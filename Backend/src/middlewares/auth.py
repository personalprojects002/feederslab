from typing import Annotated

from fastapi import Depends, Header

from src.exceptions import UnauthorizedError, to_http_exception
from src.utils.jwt import verify_jwt_token, extract_user_email


def get_current_user_email(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    # Keep auth parsing at the boundary so downstream services can assume they
    # always receive a normalized identity instead of raw transport headers.
    if not authorization:
        raise to_http_exception(UnauthorizedError("Not Authorized"))

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise to_http_exception(
            UnauthorizedError(
                "Invalid authorization header format. Expected: Bearer <token>"
            )
        )

    token = parts[1].strip()

    if not token:
        raise to_http_exception(UnauthorizedError("Token is missing"))

    try:
        payload = verify_jwt_token(token)
        return extract_user_email(payload)
    except UnauthorizedError as exc:
        # Convert domain auth failures to HTTP only at the boundary to keep
        # non-HTTP layers reusable and framework-agnostic.
        raise to_http_exception(exc)


CurrentUser = Annotated[str, Depends(get_current_user_email)]