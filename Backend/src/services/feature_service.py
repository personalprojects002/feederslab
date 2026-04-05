from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.board import Board
from src.models.feature import Feature
from src.models.user import User
from src.exceptions import (
    BadRequestError,
    BoardNotFoundError,
    FeatureNotFoundError,
    ForbiddenActionError,
)


class FeatureService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_user_by_email(self, user_email: str) -> User:
        result = await self.session.execute(select(User).where(User.email == user_email))
        user = result.scalars().first()
        if not user:
            raise ForbiddenActionError("Not authorized")
        return user

    async def _get_owner_board(self, board_id: int, user_email: str) -> Board:
        user = await self._get_user_by_email(user_email)
        result = await self.session.execute(select(Board).where(Board.id == board_id))
        board = result.scalars().first()

        if not board:
            raise BoardNotFoundError()
        if board.user_id != user.id:
            # Ownership is checked in the service layer so every owner-only action
            # shares one authorization rule regardless of route wiring.
            raise ForbiddenActionError("Not authorized to access this board")
        return board

    async def _get_feature_on_board(self, board_id: int, feature_id: int) -> Feature:
        result = await self.session.execute(
            select(Feature).where(Feature.id == feature_id, Feature.board_id == board_id)
        )
        feature = result.scalars().first()
        if not feature:
            raise FeatureNotFoundError()
        return feature

    async def _ensure_board_exists(self, board_id: int) -> Board:
        result = await self.session.execute(select(Board).where(Board.id == board_id))
        board = result.scalars().first()
        if not board:
            raise BoardNotFoundError()
        return board

    async def list_features_for_owner(self, board_id: int, user_email: str) -> list[Feature]:
        await self._get_owner_board(board_id, user_email)
        result = await self.session.execute(
            select(Feature).where(Feature.board_id == board_id)
        )
        features = list(result.scalars().all())
        # Sorting by votes first preserves the product intent that community signal
        # outranks recency while still producing deterministic ties.
        return sorted(features, key=lambda item: (item.upvotes_count, item.created_at), reverse=True)

    async def list_features_public(self, board_id: int) -> list[Feature]:
        result = await self.session.execute(
            select(Feature).where(Feature.board_id == board_id)
        )
        features = list(result.scalars().all())
        return sorted(features, key=lambda item: (item.upvotes_count, item.created_at), reverse=True)

    async def create_feature_for_owner(
        self,
        board_id: int,
        user_email: str,
        title: str,
        description: str | None,
    ) -> Feature:
        user = await self._get_user_by_email(user_email)
        await self._get_owner_board(board_id, user_email)

        trimmed_title = title.strip()
        if not trimmed_title:
            raise BadRequestError("Feature title is required")

        feature = Feature(
            board_id=board_id,
            creator_user_id=user.id,
            title=trimmed_title,
            description=description.strip() if description else None,
        )
        self.session.add(feature)
        await self.session.commit()
        # Refresh ensures DB-managed defaults/timestamps are present in the response,
        # avoiding stale objects after commit.
        await self.session.refresh(feature)
        return feature

    async def create_feature_for_shared(
        self,
        board_id: int,
        creator_client_id: str,
        title: str,
        description: str | None,
    ) -> Feature:
        await self._ensure_board_exists(board_id)

        trimmed_client = creator_client_id.strip()
        if not trimmed_client:
            raise BadRequestError("Client key is required")

        trimmed_title = title.strip()
        if not trimmed_title:
            raise BadRequestError("Feature title is required")

        feature = Feature(
            board_id=board_id,
            creator_client_id=trimmed_client,
            title=trimmed_title,
            description=description.strip() if description else None,
        )
        self.session.add(feature)
        await self.session.commit()
        await self.session.refresh(feature)
        return feature

    async def delete_feature_for_owner(self, board_id: int, feature_id: int, user_email: str) -> bool:
        await self._get_owner_board(board_id, user_email)
        feature = await self._get_feature_on_board(board_id, feature_id)

        await self.session.delete(feature)
        await self.session.commit()
        return True

    async def delete_feature_for_shared(
        self,
        board_id: int,
        feature_id: int,
        creator_client_id: str,
    ) -> bool:
        feature = await self._get_feature_on_board(board_id, feature_id)

        if not feature.creator_client_id or feature.creator_client_id != creator_client_id:
            # Shared links intentionally allow anonymous contribution, so deletion
            # must be scoped to the original client key to prevent griefing.
            raise ForbiddenActionError("You can only delete features you created")

        await self.session.delete(feature)
        await self.session.commit()
        return True
