from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import secrets
import jwt
import time
from typing import Any

from src.config.db import get_session
from src.middlewares.auth import CurrentUser
from src.config.settings import settings
from src.models.refresh_token import RefreshToken

router = APIRouter(prefix="/auth", tags=["auth"])


def _cookie_samesite() -> str:
    normalized = settings.refresh_cookie_samesite.strip().lower()
    if normalized not in {"lax", "strict", "none"}:
        # Defaulting to lax prevents accidental cross-site exposure when config
        # is invalid, while still allowing common top-level navigation flows.
        return "lax"
    return normalized


def _build_access_token(user_email: str) -> tuple[str, int]:
    # Use Unix epoch seconds to avoid timezone ambiguity from naive datetime.timestamp().
    now_ts = int(time.time())
    exp_ts = now_ts + settings.access_token_expiry_seconds
    payload = {
        "email": user_email,
        "exp": exp_ts,
        "iat": now_ts,
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token, settings.access_token_expiry_seconds


def _set_refresh_cookie(response: JSONResponse, refresh_token: str) -> None:
    # Refresh token stays cookie-bound to reduce accidental token leakage in
    # client-side storage and to keep rotation transport consistent.
    max_age = settings.refresh_token_expiry_days * 24 * 60 * 60
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=max_age,
        expires=max_age,
        path=settings.refresh_cookie_path,
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=_cookie_samesite(),
    )


def _clear_refresh_cookie(response: JSONResponse) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=_cookie_samesite(),
    )


def _extract_refresh_token(request: Request, body: dict[str, Any]) -> str | None:
    # Cookie-first fallback supports browser flows while preserving compatibility
    # with non-browser clients that explicitly post refreshToken in body.
    refresh_cookie_token = request.cookies.get(settings.refresh_cookie_name)
    if isinstance(refresh_cookie_token, str) and refresh_cookie_token.strip():
        return refresh_cookie_token.strip()

    refresh_from_body = body.get("refreshToken")
    if isinstance(refresh_from_body, str) and refresh_from_body.strip():
        return refresh_from_body.strip()

    return None


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Refresh access token using refresh token
    """
    try:
        try:
            raw_body = await request.json()
            body = raw_body if isinstance(raw_body, dict) else {}
        except Exception:
            body = {}

        refresh_token_str = _extract_refresh_token(request, body)

        if not refresh_token_str:
            print("[AUTH-REFRESH] denied: missing refresh token")
            response = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Refresh token is required"},
            )
            # Clearing the cookie on missing/invalid refresh input prevents the
            # browser from repeatedly sending unusable state forever.
            _clear_refresh_cookie(response)
            return response

        # Find the refresh token in the database
        refresh_token_query = await session.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token_str)
        )
        db_refresh_token = refresh_token_query.scalars().first()

        if not db_refresh_token:
            print("[AUTH-REFRESH] denied: invalid refresh token")
            response = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid refresh token"},
            )
            _clear_refresh_cookie(response)
            return response

        # Check if token is expired or revoked
        if db_refresh_token.is_expired or db_refresh_token.is_revoked:
            # Remove the token from DB if expired
            if db_refresh_token.is_expired:
                # Expired rows are pruned opportunistically on refresh so token
                # storage stays bounded without a separate cleanup job.
                await session.delete(db_refresh_token)
                await session.commit()

            print(
                f"[AUTH-REFRESH] denied: expired_or_revoked user={db_refresh_token.user_email}"
            )
            response = JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Expired or revoked refresh token"},
            )
            _clear_refresh_cookie(response)
            return response

        user_email = db_refresh_token.user_email

        new_access_token, expires_in = _build_access_token(user_email)
        print(
            f"[AUTH-REFRESH] success: user={user_email} expires_in={expires_in}s"
        )

        # Return new access token
        return JSONResponse(
            content={
                "accessToken": new_access_token,
                "expiresIn": expires_in,
            },
            headers={
                # Auth responses are no-store so shared devices/proxies do not
                # cache bearer credentials.
                "Cache-Control": "no-store",
                "Pragma": "no-cache",
            }
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Logout and revoke refresh token
    """
    try:
        try:
            raw_body = await request.json()
            body = raw_body if isinstance(raw_body, dict) else {}
        except Exception:
            body = {}

        refresh_token_str = _extract_refresh_token(request, body)

        # Revoking all active tokens enforces sign-out across tabs/devices and
        # avoids partial logout behavior that surprises users.
        user_tokens = await session.execute(
            select(RefreshToken).where(RefreshToken.user_email == user_email)
        )

        now = datetime.utcnow()
        tokens_updated = False
        for token_row in user_tokens.scalars().all():
            if token_row.revoked_at is None:
                token_row.revoked_at = now
                session.add(token_row)
                tokens_updated = True

        if refresh_token_str:
            # Find and revoke the refresh token in the database
            refresh_token_query = await session.execute(
                select(RefreshToken).where(
                    RefreshToken.token == refresh_token_str
                )
            )
            db_refresh_token = refresh_token_query.scalars().first()

            if db_refresh_token and db_refresh_token.revoked_at is None:
                # Mark as revoked
                db_refresh_token.revoked_at = now
                session.add(db_refresh_token)
                tokens_updated = True

        if tokens_updated:
            await session.commit()

        response = JSONResponse(content={"message": "Successfully logged out"})
        _clear_refresh_cookie(response)
        return response

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post("/generate-refresh-token", status_code=status.HTTP_200_OK)
async def generate_refresh_token(
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session)
):
    """
    Generate a refresh token for the authenticated user
    This would be called after successful authentication
    """
    try:
        now = datetime.utcnow()

        active_tokens_query = await session.execute(
            select(RefreshToken).where(
                RefreshToken.user_email == user_email,
                RefreshToken.revoked_at.is_(None),
            )
        )
        active_tokens = active_tokens_query.scalars().all()

        refresh_record: RefreshToken | None = None
        for active_token in active_tokens:
            if active_token.is_expired:
                active_token.revoked_at = now
                session.add(active_token)
                continue

            if refresh_record is None:
                # Reuse one active token to reduce token churn while preserving
                # a single source of truth for session continuity.
                refresh_record = active_token
            else:
                # Keep one canonical active token per user.
                active_token.revoked_at = now
                session.add(active_token)

        issued_new_refresh_token = False

        if refresh_record is None:
            # Generate a cryptographically secure refresh token
            token = secrets.token_urlsafe(32)  # 32 bytes = 256 bits
            expires_at = now + timedelta(days=settings.refresh_token_expiry_days)

            refresh_record = RefreshToken(
                token=token,
                user_email=user_email,
                expires_at=expires_at,
            )
            session.add(refresh_record)
            issued_new_refresh_token = True

        await session.commit()
        await session.refresh(refresh_record)

        if issued_new_refresh_token:
            print(
                f"[AUTH-BOOTSTRAP] refresh token issued: user={user_email} days={settings.refresh_token_expiry_days}"
            )
        else:
            print(f"[AUTH-BOOTSTRAP] refresh token reused: user={user_email}")

        new_access_token, access_expires_in = _build_access_token(user_email)
        print(
            f"[AUTH-BOOTSTRAP] access token issued: user={user_email} expires_in={access_expires_in}s"
        )

        response = JSONResponse(
            content={
                "accessToken": new_access_token,
                "expiresIn": access_expires_in,
                "refreshTokenExpiresIn": settings.refresh_token_expiry_days * 24 * 60 * 60,
            },
            headers={
                "Cache-Control": "no-store",
                "Pragma": "no-cache",
            },
        )
        # Refresh token remains cookie-bound so client JS never needs direct
        # access to long-lived credentials.
        _set_refresh_cookie(response, refresh_record.token)
        return response

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate refresh token"
        )