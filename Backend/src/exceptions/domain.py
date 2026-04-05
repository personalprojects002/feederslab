class DomainError(Exception):
    """Base domain exception used in services and utilities."""

    default_message = "Application error"

    def __init__(self, message: str | None = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class ValidationError(DomainError):
    default_message = "Invalid request data"


class UnauthorizedError(DomainError):
    default_message = "Not authorized"


class ForbiddenError(DomainError):
    default_message = "You do not have permission for this action"


class NotFoundError(DomainError):
    default_message = "Requested resource was not found"


class ConflictError(DomainError):
    default_message = "Resource conflict"


class ExternalServiceError(DomainError):
    default_message = "External service error"


class BadRequestError(ValidationError):
    pass


class ForbiddenActionError(ForbiddenError):
    pass


class SubscriptionRequiredError(ForbiddenError):
    default_message = "Subscription required"


class UserNotFoundError(NotFoundError):
    default_message = "User not found"


class BoardNotFoundError(NotFoundError):
    default_message = "Board not found"


class FeatureNotFoundError(NotFoundError):
    default_message = "Feature not found"


class InvalidShareTokenError(NotFoundError):
    default_message = "Share link not found"
