from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import String, Boolean

if TYPE_CHECKING:
    from src.models.board import Board


class User(SQLModel, table=True):
    """
    User Model - Compatible with Better Auth schema + Stripe integration
    
    This model uses Better Auth's user table directly + Stripe subscription fields.
    Better Auth creates: id, name, email, emailVerified, image, createdAt, updatedAt
    """

    # Better Auth fields (must match their schema exactly)
    id: str = Field(primary_key=True, max_length=255)  # Better Auth uses string IDs
    name: str = Field(default="Friend", max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    emailVerified: bool = Field(default=False, sa_column=Column("emailVerified", Boolean))
    image: Optional[str] = Field(default=None, max_length=500)
    createdAt: datetime = Field(sa_column=Column("createdAt"))
    updatedAt: datetime = Field(sa_column=Column("updatedAt"))

    # Stripe subscription fields
    customer_id: Optional[str] = Field(default=None, max_length=255, index=True)  # Stripe customer ID
    has_access: bool = Field(default=False, sa_column=Column("has_access", Boolean))  # Subscription active?
    stripe_current_period_end: Optional[datetime] = Field(default=None, sa_column=Column("stripe_current_period_end"))  # When subscription ends

    # Relationship to boards
    boards: list["Board"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"},
    )
