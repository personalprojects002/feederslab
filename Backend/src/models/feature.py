from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.board import Board
    from src.models.upvote import Upvote


class Feature(SQLModel, table=True):
    """Product feedback item stored under a board.

    Ownership can come from authenticated users or anonymous shared-link
    contributors, so we keep both identity channels available.
    """

    id: int | None = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="board.id", index=True)
    creator_user_id: Optional[str] = Field(default=None, foreign_key="user.id", max_length=255, index=True)
    # For shared links we intentionally allow anonymous contribution while still
    # preserving a stable client-scoped identity for moderation/deletion rules.
    creator_client_id: Optional[str] = Field(default=None, max_length=255, index=True)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    # Denormalized count avoids repeated aggregate queries on every board render.
    upvotes_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    board: Optional["Board"] = Relationship(back_populates="features")
    # Cascading prevents orphaned upvotes if a feature is deleted.
    upvotes: list["Upvote"] = Relationship(
        back_populates="feature",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"},
    )
