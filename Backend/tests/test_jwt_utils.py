"""JWT payload extraction tests.

Coverage focuses on tolerant payload-shape handling because token providers may
encode identity fields differently across auth flows.
"""

import pytest

from src.exceptions.domain import UnauthorizedError
from src.utils.jwt import extract_user_email, extract_user_id


@pytest.mark.parametrize(
    "payload,expected",
    [
        ({"email": "User@Example.com"}, "user@example.com"),
        ({"user": {"email": "Another@Example.com"}}, "another@example.com"),
        ({"userEmail": "Third@Example.com"}, "third@example.com"),
    ],
)
def test_extract_user_email_supports_multiple_payload_shapes(
    payload: dict[str, object],
    expected: str,
) -> None:
    assert extract_user_email(payload) == expected


def test_extract_user_email_raises_when_missing() -> None:
    with pytest.raises(UnauthorizedError, match="Email not found"):
        extract_user_email({})


@pytest.mark.parametrize(
    "payload,expected",
    [
        ({"userId": "abc123"}, "abc123"),
        ({"sub": "subject-1"}, "subject-1"),
    ],
)
def test_extract_user_id_supports_multiple_payload_shapes(
    payload: dict[str, object],
    expected: str,
) -> None:
    assert extract_user_id(payload) == expected


def test_extract_user_id_raises_when_missing() -> None:
    with pytest.raises(UnauthorizedError, match="User ID not found"):
        extract_user_id({})
