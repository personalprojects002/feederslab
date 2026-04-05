from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.board import Board


class ShareLink(SQLModel, table=True):
    """Public collaboration handle bound to a board.

    Share links encode access policy directly so permission checks can be
    evaluated quickly without additional lookup tables.
    """

    __tablename__ = "sharelink"

    id: int | None = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="board.id", index=True)
    # Unique opaque token allows direct URL sharing while preventing collisions.
    token: str = Field(index=True, unique=True, max_length=64)
    # Access level is stored on the link so old links keep their original policy.
    access_level: str = Field(max_length=40)
    created_at: datetime = Field(default_factory=datetime.now)

    board: Optional["Board"] = Relationship(back_populates="share_links")
