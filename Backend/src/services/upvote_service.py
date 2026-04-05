from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.feature import Feature
from src.models.upvote import Upvote
from src.exceptions import BadRequestError, FeatureNotFoundError


class UpvoteService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_feature(self, feature_id: int, board_id: int | None = None) -> Feature:
        statement = select(Feature).where(Feature.id == feature_id)
        if board_id is not None:
            statement = statement.where(Feature.board_id == board_id)

        result = await self.session.execute(statement)
        feature = result.scalars().first()
        if not feature:
            raise FeatureNotFoundError()
        return feature

    async def set_upvote(
        self,
        feature_id: int,
        voter_key: str,
        upvoted: bool,
        board_id: int | None = None,
    ) -> tuple[int, bool]:
        clean_voter_key = voter_key.strip()
        if not clean_voter_key:
            raise BadRequestError("Voter key is required")

        feature = await self._get_feature(feature_id, board_id=board_id)
        if feature.id is None:
            raise FeatureNotFoundError()
        feature_pk = feature.id

        existing_result = await self.session.execute(
            select(Upvote).where(Upvote.feature_id == feature_pk, Upvote.voter_key == clean_voter_key)
        )
        existing = existing_result.scalars().first()

        if upvoted:
            if existing and existing.is_active:
                # This path is intentionally a no-op to keep repeated "upvote"
                # requests idempotent across retries and double-clicks.
                pass
            elif existing:
                existing.is_active = True
                existing.updated_at = datetime.now()
                feature.upvotes_count += 1
                self.session.add(existing)
            else:
                # We preserve vote history by reusing rows via is_active toggles,
                # which makes audit/debug scenarios easier than hard deletes.
                new_upvote = Upvote(feature_id=feature_pk, voter_key=clean_voter_key, is_active=True)
                feature.upvotes_count += 1
                self.session.add(new_upvote)
        else:
            if existing and existing.is_active:
                existing.is_active = False
                existing.updated_at = datetime.now()
                feature.upvotes_count = max(0, feature.upvotes_count - 1)
                self.session.add(existing)

            # Feature timestamp is updated on any vote intent so list ordering and sync
            # clients can treat vote changes as meaningful board activity.
        feature.updated_at = datetime.now()
        self.session.add(feature)
        await self.session.commit()
        await self.session.refresh(feature)

        status = False
        if existing:
            status = existing.is_active
        elif upvoted:
            status = True

        return feature.upvotes_count, status

    async def get_status(
        self,
        feature_id: int,
        voter_key: str,
        board_id: int | None = None,
    ) -> tuple[int, bool]:
        clean_voter_key = voter_key.strip()
        if not clean_voter_key:
            raise BadRequestError("Voter key is required")

        feature = await self._get_feature(feature_id, board_id=board_id)
        if feature.id is None:
            raise FeatureNotFoundError()
        feature_pk = feature.id

        existing_result = await self.session.execute(
            select(Upvote).where(Upvote.feature_id == feature_pk, Upvote.voter_key == clean_voter_key)
        )
        existing = existing_result.scalars().first()

        return feature.upvotes_count, bool(existing and existing.is_active)
