from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from src.utils.jwt import verify_jwt_token, extract_user_email


def get_current_user_email(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """
    Extract and validate user email from JWT token in Authorization header.

    Uses Better Auth JWT format with HS256 signature.

    Args:
        authorization: Authorization header value (e.g., "Bearer <token>")

    Returns:
        str: Authenticated user's email address

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized"
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )

    token = parts[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing"
        )

    # Verify JWT token and extract payload
    payload = verify_jwt_token(token)

    # Extract email from payload
    email = extract_user_email(payload)

    return email


# Type alias for dependency injection
# Makes code cleaner and matches TypeScript pattern
#
# Equivalent to TypeScript:
#     type CurrentUser = string;  // The authenticated user's email
#
# Usage:
#     def my_route(user_email: CurrentUser):
#         # user_email is automatically injected and verified
CurrentUser = Annotated[str, Depends(get_current_user_email)]