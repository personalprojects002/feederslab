from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.board import Board
from src.models.user import User


class BoardService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_board(self, board_name: str, user_email: str) -> Board:
        """
        Create a new board for authenticated user

        Equivalent to TypeScript: POST /api/board

        Matches exact logic:
        1. Find user by email
        2. Check if user exists
        3. Check if user has active subscription (has_access = true)
        4. Create board
        5. Return board
        """
        result = await self.session.exec(select(User).where(User.email == user_email))
        user = result.first()

        if not user:
            raise ValueError("You are not allowed to create a board")

        # Ensure user has an ID before creating board
        if not user.id:
            raise ValueError("User ID is required")

        # Check if user has active subscription
        if not user.has_access:
            raise PermissionError(
                "Subscription required. Please subscribe to create boards."
            )

        new_board = Board(board_name=board_name, user_id=user.id)

        self.session.add(new_board)
        await self.session.commit()
        await self.session.refresh(new_board)

        return new_board

    async def get_all_boards(self, user_email: str) -> list[Board]:
        result = await self.session.exec(select(User).where(User.email == user_email))
        user = result.first()

        if not user:
            raise ValueError("User not found")

        # Query boards directly instead of using relationship
        boards_result = await self.session.exec(
            select(Board).where(Board.user_id == user.id)
        )
        boards = boards_result.all()

        return list(boards)

    async def get_board_by_id(self, board_id: int, user_email: str) -> Board | None:
        result = await self.session.exec(select(Board).where(Board.id == board_id))
        board = result.first()

        if not board:
            return None

        # Check if board has a user and verify ownership
        if not board.user:
            raise PermissionError("Board has no owner")

        if board.user.email != user_email:
            raise PermissionError("Not authorized to access this board")

        return board

    async def update_board(
        self, board_id: int, board_name: str, user_email: str
    ) -> Board | None:
        result = await self.session.exec(select(Board).where(Board.id == board_id))
        board = result.first()

        if not board:
            return None

        # Check if board has a user and verify ownership
        if not board.user:
            raise PermissionError("Board has no owner")

        if board.user.email != user_email:
            raise PermissionError("Not authorized to update this board")

        board.board_name = board_name
        board.updated_at = datetime.now(timezone.utc)

        self.session.add(board)
        await self.session.commit()
        await self.session.refresh(board)

        return board

    async def delete_board(self, board_id: int, user_email: str) -> bool:
        result = await self.session.exec(select(Board).where(Board.id == board_id))
        board = result.first()

        if not board:
            return False

        # Check if board has a user and verify ownership
        if not board.user:
            raise PermissionError("Board has no owner")

        if board.user.email != user_email:
            raise PermissionError("Not authorized to delete this board")

        await self.session.delete(board)
        await self.session.commit()

        return True
