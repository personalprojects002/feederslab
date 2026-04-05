"""Auth middleware tests focused on boundary hardening.

These tests protect the transport-to-domain boundary where malformed headers
and token failures must map to consistent HTTP semantics.
"""

import pytest
from fastapi import HTTPException, status

from src.exceptions.domain import UnauthorizedError
from src.middlewares import auth as auth_middleware


def test_get_current_user_email_requires_authorization_header() -> None:
    with pytest.raises(HTTPException) as exc:
        auth_middleware.get_current_user_email(None)

    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc.value.detail == "Not Authorized"


@pytest.mark.parametrize(
    "header",
    [
        "Token abc",
        "Bearer",
        "Bearer   ",
    ],
)
def test_get_current_user_email_rejects_invalid_header_format(header: str) -> None:
    with pytest.raises(HTTPException) as exc:
        auth_middleware.get_current_user_email(header)

    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_email_returns_email_from_verified_token(monkeypatch: pytest.MonkeyPatch) -> None:
    # Monkeypatching isolates middleware behavior from JWT internals so this
    # test fails only when boundary orchestration changes.
    monkeypatch.setattr(
        auth_middleware,
        "verify_jwt_token",
        lambda token: {"email": "Person@Example.com", "token": token},
    )
    monkeypatch.setattr(
        auth_middleware,
        "extract_user_email",
        lambda payload: str(payload["email"]).lower(),
    )

    email = auth_middleware.get_current_user_email("Bearer abc-token")
    assert email == "person@example.com"


def test_get_current_user_email_maps_domain_unauthorized_to_http(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise(_: str) -> dict:
        raise UnauthorizedError("Token has expired")

    monkeypatch.setattr(auth_middleware, "verify_jwt_token", _raise)

    with pytest.raises(HTTPException) as exc:
        auth_middleware.get_current_user_email("Bearer abc-token")

    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc.value.detail == "Token has expired"
