"""Exception surface exported for route and service layers.

Centralizing exports keeps calling code stable even if exception classes are
reorganized internally.
"""

from src.exceptions.domain import (
    BadRequestError,
    BoardNotFoundError,
    ConflictError,
    DomainError,
    ExternalServiceError,
    FeatureNotFoundError,
    ForbiddenActionError,
    ForbiddenError,
    InvalidShareTokenError,
    NotFoundError,
    SubscriptionRequiredError,
    UnauthorizedError,
    UserNotFoundError,
    ValidationError,
)
from src.exceptions.http import to_http_exception

__all__ = [
    "BadRequestError",
    "BoardNotFoundError",
    "ConflictError",
    "DomainError",
    "ExternalServiceError",
    "FeatureNotFoundError",
    "ForbiddenActionError",
    "ForbiddenError",
    "InvalidShareTokenError",
    "NotFoundError",
    "SubscriptionRequiredError",
    "UnauthorizedError",
    "UserNotFoundError",
    "ValidationError",
    "to_http_exception",
]
