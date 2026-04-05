import secrets

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.board import Board
from src.models.feature import Feature
from src.models.share_link import ShareLink
from src.models.user import User
from src.exceptions import (
    BadRequestError,
    BoardNotFoundError,
    ForbiddenActionError,
    InvalidShareTokenError,
)

ACCESS_CREATE_UPVOTE = "create_upvote"
ACCESS_UPVOTE_ONLY = "upvote_only"
ALLOWED_ACCESS_LEVELS = {ACCESS_CREATE_UPVOTE, ACCESS_UPVOTE_ONLY}


class ShareService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_owner_board(self, board_id: int, user_email: str) -> Board:
        user = await self._get_owner_user(user_email)
        result = await self.session.execute(select(Board).where(Board.id == board_id))
        board = result.scalars().first()

        if not board:
            raise BoardNotFoundError()
        if board.user_id != user.id:
            raise ForbiddenActionError("Not authorized to manage share links on this board")
        return board

    async def _get_owner_user(self, user_email: str) -> User:
        result = await self.session.execute(select(User).where(User.email == user_email))
        user = result.scalars().first()
        if not user:
            raise ForbiddenActionError("Not authorized")
        return user

    async def create_share_link(
        self,
        board_id: int,
        user_email: str,
        access_level: str,
        frontend_origin: str,
    ) -> tuple[ShareLink, str]:
        normalized_access = access_level.strip().lower()
        if normalized_access not in ALLOWED_ACCESS_LEVELS:
            raise BadRequestError("Invalid access level")

        await self._get_owner_board(board_id, user_email)

        # A high-entropy token keeps links unguessable without requiring users to
        # sign in when collaborating through public share URLs.
        token = secrets.token_urlsafe(24)
        share_link = ShareLink(
            board_id=board_id,
            token=token,
            access_level=normalized_access,
        )
        self.session.add(share_link)
        await self.session.commit()
        await self.session.refresh(share_link)

        share_url = f"{frontend_origin.rstrip('/')}/shared/{token}"
        return share_link, share_url

    async def resolve_share_link(self, token: str) -> ShareLink:
        statement = select(ShareLink).where(ShareLink.token == token)
        result = await self.session.execute(statement)
        link = result.scalars().first()
        if not link:
            raise InvalidShareTokenError()
        return link

    async def get_shared_board(self, token: str) -> tuple[Board, str]:
        link = await self.resolve_share_link(token)
        board_result = await self.session.execute(select(Board).where(Board.id == link.board_id))
        board = board_result.scalars().first()
        if not board:
            raise BoardNotFoundError()
        return board, link.access_level

    async def get_shared_features(self, token: str) -> tuple[list[Feature], str, int]:
        link = await self.resolve_share_link(token)

        feature_result = await self.session.execute(
            select(Feature).where(Feature.board_id == link.board_id)
        )
        features = list(feature_result.scalars().all())
        # Shared pages should mirror owner pages so collaborators see a consistent
        # ordering model and discuss the same top-priority items.
        features = sorted(features, key=lambda item: (item.upvotes_count, item.created_at), reverse=True)
        return features, link.access_level, link.board_id

    async def get_outgoing_shared_boards(self, user_email: str) -> list[tuple[Board, int]]:
        owner = await self._get_owner_user(user_email)

        boards_result = await self.session.execute(
            select(Board).where(Board.user_id == owner.id)
        )
        boards = list(boards_result.scalars().all())
        boards = sorted(boards, key=lambda item: item.updated_at, reverse=True)
        if not boards:
            return []

        board_ids = [board.id for board in boards if board.id is not None]
        links_result = await self.session.execute(select(ShareLink))
        links = list(links_result.scalars().all())

        # Counting in memory avoids dialect-specific GROUP BY edge cases and keeps
        # this path simple at current scale; can be replaced by aggregation later.
        counts_by_board: dict[int, int] = {}
        for link in links:
            if link.board_id not in board_ids:
                continue
            counts_by_board[link.board_id] = counts_by_board.get(link.board_id, 0) + 1

        rows: list[tuple[Board, int]] = []
        for board in boards:
            if board.id is None:
                continue
            rows.append((board, counts_by_board.get(board.id, 0)))
        return rows
