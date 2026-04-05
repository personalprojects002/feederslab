from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.board import Board
from src.models.share_link import ShareLink
from src.models.user import User
from src.exceptions import (
    BadRequestError,
    ForbiddenActionError,
    SubscriptionRequiredError,
    UserNotFoundError,
)


class BoardService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_board(self, board_name: str, user_email: str) -> Board:
        result = await self.session.execute(select(User).where(User.email == user_email))
        user = result.scalars().first()

        if not user:
            # In this product, board creation is subscription-gated. If the
            # user profile row is missing, we still surface the subscription
            # requirement instead of an opaque authorization error.
            raise SubscriptionRequiredError(
                "Subscription required. Please subscribe to create boards."
            )

        # Ensure user has an ID before creating board
        if not user.id:
            raise BadRequestError("User ID is required")

        # Check if user has active subscription
        if not user.has_access:
            # Board creation is the monetized capability, so entitlement is
            # enforced in service logic where all creation paths converge.
            raise SubscriptionRequiredError(
                "Subscription required. Please subscribe to create boards."
            )

        new_board = Board(board_name=board_name, user_id=user.id)

        self.session.add(new_board)
        await self.session.commit()
        await self.session.refresh(new_board)

        return new_board

    async def get_all_boards(self, user_email: str) -> list[Board]:
        result = await self.session.execute(select(User).where(User.email == user_email))
        user = result.scalars().first()

        if not user:
            raise UserNotFoundError()

        # Direct querying avoids lazy-loading surprises in async contexts and
        # keeps this read path explicit and predictable.
        boards_result = await self.session.execute(
            select(Board).where(Board.user_id == user.id)
        )
        boards = boards_result.scalars().all()

        return list(boards)

    async def get_board_by_id(self, board_id: int, user_email: str) -> Board | None:
        user_result = await self.session.execute(select(User).where(User.email == user_email))
        user = user_result.scalars().first()
        if not user:
            raise ForbiddenActionError("Not authorized to access this board")

        result = await self.session.execute(select(Board).where(Board.id == board_id))
        board = result.scalars().first()

        if not board:
            return None

        if board.user_id != user.id:
            # Returning 403 instead of pretending not-found helps owners detect
            # authorization misconfiguration during integration.
            raise ForbiddenActionError("Not authorized to access this board")

        return board

    async def update_board(
        self, board_id: int, board_name: str, user_email: str
    ) -> Board | None:
        user_result = await self.session.execute(select(User).where(User.email == user_email))
        user = user_result.scalars().first()
        if not user:
            raise ForbiddenActionError("Not authorized to update this board")

        result = await self.session.execute(select(Board).where(Board.id == board_id))
        board = result.scalars().first()

        if not board:
            return None

        if board.user_id != user.id:
            raise ForbiddenActionError("Not authorized to update this board")

        board.board_name = board_name
        board.updated_at = datetime.now()

        self.session.add(board)
        await self.session.commit()
        await self.session.refresh(board)

        return board

    async def delete_board(self, board_id: int, user_email: str) -> bool:
        user_result = await self.session.execute(select(User).where(User.email == user_email))
        user = user_result.scalars().first()
        if not user:
            raise ForbiddenActionError("Not authorized to delete this board")

        result = await self.session.execute(select(Board).where(Board.id == board_id))
        board = result.scalars().first()

        if not board:
            return False

        if board.user_id != user.id:
            raise ForbiddenActionError("Not authorized to delete this board")

        await self.session.delete(board)
        await self.session.commit()

        return True

    async def get_shared_boards(self, user_email: str) -> list[tuple[Board, int]]:
        result = await self.session.execute(select(User).where(User.email == user_email))
        user = result.scalars().first()

        if not user:
            raise UserNotFoundError()

        boards_result = await self.session.execute(
            select(Board).where(Board.user_id == user.id)
        )
        boards = list(boards_result.scalars().all())
        boards = sorted(boards, key=lambda item: item.updated_at, reverse=True)
        if not boards:
            return []

        board_ids = [board.id for board in boards if board.id is not None]
        links_result = await self.session.execute(select(ShareLink))
        links = list(links_result.scalars().all())

        # We count only links tied to this owner's boards so outgoing-sharing
        # analytics cannot be polluted by global share-link data.
        counts_by_board: dict[int, int] = {}
        for link in links:
            if link.board_id not in board_ids:
                continue
            counts_by_board[link.board_id] = counts_by_board.get(link.board_id, 0) + 1

        rows: list[tuple[Board, int]] = []
        for board in boards:
            if board.id is None:
                continue
            share_count = counts_by_board.get(board.id, 0)
            if share_count <= 0:
                continue
            rows.append((board, share_count))

        return rows
