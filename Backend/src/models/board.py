from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.feature import Feature
    from src.models.share_link import ShareLink
    from src.models.user import User


class Board(SQLModel, table=True):
    """Aggregate root for a user's feedback workspace.

    Board owns features and share links so lifecycle rules can be enforced
    centrally (for example, deleting a board cleans up its dependent data).
    """

    id: int | None = Field(default=None, primary_key=True)
    board_name: str = Field(default="New Board", max_length=200)
    # Better Auth user identifiers are strings, so board ownership uses the
    # same shape to avoid translation layers between auth and domain models.
    user_id: str = Field(foreign_key="user.id", max_length=255)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    user: Optional["User"] = Relationship(back_populates="boards")
    # selectin keeps list pages efficient, and delete-orphan ensures board
    # teardown cannot leave orphaned rows behind.
    features: list["Feature"] = Relationship(
        back_populates="board",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"},
    )
    share_links: list["ShareLink"] = Relationship(
        back_populates="board",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"},
    )
