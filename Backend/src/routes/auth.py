from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import secrets
import jwt
from typing import Optional

from src.config.db import get_session
from src.middlewares.auth import CurrentUser
from src.utils.jwt import verify_jwt_token
from src.config.settings import BETTER_AUTH_SECRET
from src.models.refresh_token import RefreshToken

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Refresh access token using refresh token
    """
    try:
        # Get refresh token from request body
        body = await request.json()
        refresh_token_str = body.get("refreshToken")

        if not refresh_token_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )

        # Find the refresh token in the database
        from sqlmodel import select
        refresh_token_query = await session.exec(
            select(RefreshToken).where(RefreshToken.token == refresh_token_str)
        )
        db_refresh_token = refresh_token_query.first()

        if not db_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Check if token is expired or revoked
        if db_refresh_token.is_expired or db_refresh_token.is_revoked:
            # Remove the token from DB if expired
            if db_refresh_token.is_expired:
                await session.delete(db_refresh_token)
                await session.commit()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Expired or revoked refresh token"
            )

        user_email = db_refresh_token.user_email

        # Generate new access token (valid for 15 minutes in production, 2 minutes for demo)
        access_token_exp = datetime.utcnow() + timedelta(minutes=2)  # 2 minutes for demo

        new_access_token_payload = {
            "email": user_email,
            "exp": int(access_token_exp.timestamp()),
            "iat": int(datetime.utcnow().timestamp())
        }

        new_access_token = jwt.encode(
            new_access_token_payload,
            BETTER_AUTH_SECRET,
            algorithm="HS256"
        )

        # Return new access token
        return JSONResponse(
            content={
                "accessToken": new_access_token,
                "expiresIn": 120  # 2 minutes in seconds (will be 900 for 15 minutes in production)
            },
            headers={
                "Cache-Control": "no-store",
                "Pragma": "no-cache"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_ERROR,
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
        # Get refresh token from request body
        body = await request.json()
        refresh_token_str = body.get("refreshToken")

        if refresh_token_str:
            # Find and revoke the refresh token in the database
            refresh_token_query = await session.exec(
                select(RefreshToken).where(
                    RefreshToken.token == refresh_token_str
                )
            )
            db_refresh_token = refresh_token_query.first()

            if db_refresh_token:
                # Mark as revoked
                db_refresh_token.revoked_at = datetime.utcnow()
                session.add(db_refresh_token)
                await session.commit()

        return {"message": "Successfully logged out"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_ERROR,
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
        # Generate a cryptographically secure refresh token
        token = secrets.token_urlsafe(32)  # 32 bytes = 256 bits

        # Create refresh token record (valid for 7 days)
        expires_at = datetime.utcnow() + timedelta(days=7)

        new_refresh_token = RefreshToken(
            token=token,
            user_email=user_email,
            expires_at=expires_at
        )

        session.add(new_refresh_token)
        await session.commit()
        await session.refresh(new_refresh_token)

        return {
            "refreshToken": new_refresh_token.token,
            "expiresIn": 7 * 24 * 60 * 60  # 7 days in seconds
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_ERROR,
            detail="Failed to generate refresh token"
        )