from fastapi import HTTPException, status

from src.exceptions.domain import (
    ConflictError,
    DomainError,
    ExternalServiceError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)


def to_http_exception(error: DomainError) -> HTTPException:
    """Convert domain exceptions to HTTPException at route boundary."""
    if isinstance(error, ValidationError):
        code = status.HTTP_400_BAD_REQUEST
    elif isinstance(error, UnauthorizedError):
        code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(error, ForbiddenError):
        code = status.HTTP_403_FORBIDDEN
    elif isinstance(error, NotFoundError):
        code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ConflictError):
        code = status.HTTP_409_CONFLICT
    elif isinstance(error, ExternalServiceError):
        code = status.HTTP_502_BAD_GATEWAY
    else:
        code = status.HTTP_500_INTERNAL_SERVER_ERROR

    return HTTPException(status_code=code, detail=str(error))
