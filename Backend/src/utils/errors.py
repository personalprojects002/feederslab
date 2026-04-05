"""Compatibility layer for legacy imports.

Use src.exceptions directly for new code.
"""

from src.exceptions import (
    BadRequestError,
    BoardNotFoundError,
    FeatureNotFoundError,
    ForbiddenActionError,
    InvalidShareTokenError,
)

__all__ = [
    "BadRequestError",
    "BoardNotFoundError",
    "FeatureNotFoundError",
    "ForbiddenActionError",
    "InvalidShareTokenError",
]
