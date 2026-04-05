from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.feature import Feature


class Upvote(SQLModel, table=True):
    """A voter's preference state for a feature.

    We store one row per feature/voter pair and toggle activity state so vote
    operations stay idempotent and historical traces remain debuggable.
    """

    # One logical vote per voter per feature keeps count math deterministic.
    __table_args__ = (UniqueConstraint("feature_id", "voter_key", name="uq_upvote_feature_voter"),)

    id: int | None = Field(default=None, primary_key=True)
    feature_id: int = Field(foreign_key="feature.id", index=True)
    voter_key: str = Field(max_length=255, index=True)
    # Soft toggling avoids churn from delete/reinsert cycles and supports
    # resilient retry semantics on unstable networks.
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    feature: Optional["Feature"] = Relationship(back_populates="upvotes")
