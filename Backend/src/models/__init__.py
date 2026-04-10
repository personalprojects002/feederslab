"""Model registry imported by metadata/bootstrap flows.

Importing all models here ensures SQLModel metadata is fully populated before
table creation and relation resolution.
"""

from src.models.user import User
from src.models.board import Board
from src.models.feature import Feature
from src.models.share_link import ShareLink
from src.models.upvote import Upvote

__all__ = ["User", "Board", "Feature", "ShareLink", "Upvote"]
