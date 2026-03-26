"""
JWT Token Verification Utility

Verifies tokens received from the frontend `Authorization: Bearer <token>` header.

Better Auth's JWT plugin may sign tokens with different algorithms (often asymmetric EdDSA/Ed25519).
The previous implementation assumed `HS256` with `BETTER_AUTH_SECRET`, which can cause
authenticated users to be treated as unauthenticated (401).

This implementation:
1. Tries `HS256` with `BETTER_AUTH_SECRET` (backwards compatible).
2. If that fails, falls back to verifying with Better Auth's JWKS endpoint.
"""

import json
import os
import urllib.request
from typing import Any, cast

import jwt
from fastapi import HTTPException, status
from jwt.algorithms import OKPAlgorithm, RSAAlgorithm

from src.config.settings import BETTER_AUTH_SECRET


_JWKS_CACHE: dict[str, Any] = {"keys": None, "fetched_at": 0}
_JWKS_CACHE_TTL_SECONDS = 300


def _now_seconds() -> int:
    # Simple monotonic-ish timer for cache TTL.
    return int(os.times().elapsed)


def _get_jwks() -> dict[str, Any]:
    """
    Fetch and cache JWKS from the Better Auth server.
    """
    if _JWKS_CACHE["keys"] is not None:
        age = _now_seconds() - _JWKS_CACHE["fetched_at"]
        if age < _JWKS_CACHE_TTL_SECONDS:
            return cast(dict[str, Any], _JWKS_CACHE["keys"])

    app_url = os.getenv("APP_URL", "http://localhost:3000").strip()
    jwks_url = f"{app_url}/api/better-auth/jwks"

    req = urllib.request.Request(
        jwks_url,
        headers={"Accept": "application/json"},
    )

    with urllib.request.urlopen(req, timeout=5) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    _JWKS_CACHE["keys"] = payload
    _JWKS_CACHE["fetched_at"] = _now_seconds()
    return cast(dict[str, Any], payload)


def _verify_with_jwks(token: str) -> dict[str, Any]:
    """
    Verify token signature using the Better Auth JWKS endpoint.
    """
    try:
        header = jwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: malformed header ({str(e)})",
        )

    alg = cast(str | None, header.get("alg"))
    kid = cast(str | None, header.get("kid"))

    jwks = _get_jwks()
    keys = cast(list[dict[str, Any]], jwks.get("keys") or [])

    if not keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token (JWKS verification failed): No keys available from JWKS endpoint",
        )

    if kid:
        matching_keys = [k for k in keys if k.get("kid") == kid]
        if matching_keys:
            keys = matching_keys
        # If no matching kid found, try all keys as fallback

    last_error: str = "Invalid token"
    for jwk in keys:
        try:
            kty = jwk.get("kty")

            # Handle OKP keys (EdDSA, Ed25519, Ed448)
            if kty == "OKP":
                public_key = OKPAlgorithm.from_jwk(jwk)
            # Handle RSA keys
            elif kty == "RSA":
                public_key = RSAAlgorithm.from_jwk(jwk)
            else:
                # Skip unknown key types
                last_error = f"Unsupported key type: {kty}"
                continue

            algorithms = [alg] if isinstance(alg, str) and alg else None
            decoded = jwt.decode(
                token,
                key=cast(Any, public_key),
                algorithms=algorithms,
                options={"verify_aud": False},
            )
            return decoded
        except Exception as e:
            last_error = str(e)
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Invalid token (JWKS verification failed): {last_error}",
    )


def verify_jwt_token(token: str) -> dict[str, Any]:
    """
    Verify JWT token and return payload

    Equivalent to Better Auth token verification on frontend.
    Uses the same BETTER_AUTH_SECRET for consistency.

    Args:
        token: JWT token string (without "Bearer " prefix)

    Returns:
        dict: Token payload containing user info
        Example: {
            "email": "user@example.com",
            "userId": "123",
            "iat": 1234567890,
            "exp": 1234567890
        }

    Raises:
        HTTPException: If token is invalid, expired, or malformed

    Example:
        >>> payload = verify_jwt_token("eyJhbGciOiJIUzI1NiIs...")
        >>> user_email = payload.get("email")
    """
    try:
        # First, try to get the token header to check algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        # If it's HS256, try with BETTER_AUTH_SECRET
        if alg == "HS256":
            try:
                return jwt.decode(
                    token,
                    str(BETTER_AUTH_SECRET),
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
            except jwt.exceptions.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                )
            except jwt.exceptions.InvalidTokenError:
                # HS256 verification failed, fall through to JWKS
                pass

        # For non-HS256 or if HS256 failed, try JWKS verification
        return _verify_with_jwks(token)

    except HTTPException:
        raise
    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )


def extract_user_email(payload: dict[str, Any]) -> str:
    """
    Extract user email from JWT payload

    Better Auth JWT payload structure:
    {
        "email": "user@example.com",
        "userId": "...",
        "sessionId": "...",
        "iat": ...,
        "exp": ...
    }

    Args:
        payload: Decoded JWT payload

    Returns:
        str: User email address

    Raises:
        HTTPException: If email not found in payload

    Example:
        >>> payload = verify_jwt_token(token)
        >>> email = extract_user_email(payload)
    """
    # Better Auth can provide email in multiple payload shapes.
    email = (
        cast(str | None, payload.get("email"))
        or cast(dict[str, Any], payload.get("user") or {}).get("email")
        or cast(str | None, payload.get("userEmail"))
    )

    if not email:
        # Log the payload structure for debugging
        print(f"JWT Payload structure: {list(payload.keys())}")
        print(f"Full payload: {payload}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not found in token payload",
        )

    return str(email).strip().lower()


def extract_user_id(payload: dict[str, Any]) -> str:
    """
    Extract user ID from JWT payload

    Args:
        payload: Decoded JWT payload

    Returns:
        str: User ID

    Raises:
        HTTPException: If user ID not found in payload

    Example:
        >>> payload = verify_jwt_token(token)
        >>> user_id = extract_user_id(payload)
    """
    user_id = cast(str | None, payload.get("userId")) or cast(
        str | None, payload.get("sub")
    )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    return user_id