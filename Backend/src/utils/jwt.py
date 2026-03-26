"""
JWT Token Verification Utility

This module handles JWT token verification for authentication.
Matches the exact token format and verification logic used by Better Auth on the frontend.

Flow:
1. Receive token from Authorization header
2. Decode using BETTER_AUTH_SECRET (same secret as frontend)
3. Verify signature and expiration
4. Extract user email/ID from payload
5. Return user data or raise error
"""

import jwt
from fastapi import HTTPException, status

from src.config.settings import BETTER_AUTH_SECRET


def verify_jwt_token(token: str) -> dict:
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
        # Decode and verify token
        # - Verifies signature using BETTER_AUTH_SECRET
        # - Checks expiration automatically
        # - Returns decoded payload
        payload = jwt.decode(
            token,
            str(BETTER_AUTH_SECRET),
            algorithms=["HS256"],  # Better Auth uses HS256 by default
        )

        return payload

    except jwt.exceptions.ExpiredSignatureError:
        # Token has expired - user needs to login again
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )

    except jwt.exceptions.InvalidTokenError:
        # Token is malformed or signature doesn't match
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    except Exception as e:
        # Catch any other errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )


def extract_user_email(payload: dict) -> str:
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
        payload.get("email")
        or payload.get("user", {}).get("email")
        or payload.get("userEmail")
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


def extract_user_id(payload: dict) -> str:
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
    user_id = payload.get("userId") or payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    return user_id