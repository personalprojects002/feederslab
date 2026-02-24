from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.user import User


class Board(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    board_name: str = Field(default="New Board", max_length=200)
    user_id: str = Field(foreign_key="user.id", max_length=255)  # String to match Better Auth
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user: Optional["User"] = Relationship(back_populates="boards")
