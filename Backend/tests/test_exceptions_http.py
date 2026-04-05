"""Tests for domain-to-HTTP exception translation.

The mapping matrix is intentionally explicit so API status contracts cannot
silently drift when exception classes evolve.
"""

from fastapi import status

from src.exceptions.domain import (
    ConflictError,
    DomainError,
    ExternalServiceError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from src.exceptions.http import to_http_exception


def test_to_http_exception_maps_domain_errors() -> None:
    assert to_http_exception(ValidationError("bad")).status_code == status.HTTP_400_BAD_REQUEST
    assert to_http_exception(UnauthorizedError("nope")).status_code == status.HTTP_401_UNAUTHORIZED
    assert to_http_exception(ForbiddenError("forbidden")).status_code == status.HTTP_403_FORBIDDEN
    assert to_http_exception(NotFoundError("missing")).status_code == status.HTTP_404_NOT_FOUND
    assert to_http_exception(ConflictError("conflict")).status_code == status.HTTP_409_CONFLICT
    assert to_http_exception(ExternalServiceError("upstream")).status_code == status.HTTP_502_BAD_GATEWAY


def test_to_http_exception_falls_back_to_500_for_unknown_domain_error() -> None:
    class UnknownDomainError(DomainError):
        pass

    err = to_http_exception(UnknownDomainError("boom"))
    assert err.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert err.detail == "boom"
