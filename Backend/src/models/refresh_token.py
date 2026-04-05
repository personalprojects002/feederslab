from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    """Long-lived token record used to mint short-lived access tokens.

    Refresh rows are persisted server-side so sessions can be revoked
    centrally without trusting client-side storage state.
    """

    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(unique=True, index=True)
    user_email: str = Field(index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked_at: Optional[datetime] = None

    @property
    def is_expired(self) -> bool:
        # Computed status keeps expiry checks consistent wherever tokens are used.
        return datetime.utcnow() > self.expires_at

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    @property
    def is_active(self) -> bool:
        # Single source of truth for token usability avoids duplicated predicates.
        return not self.is_expired and not self.is_revoked