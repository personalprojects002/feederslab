from datetime import datetime, timezone

from sqlmodel import Session, select

from src.models.board import Board
from src.models.user import User


class BoardService:
    def __init__(self, session: Session):
        self.session = session

    def create_board(self, board_name: str, user_email: str) -> Board:
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
        user = self.session.exec(select(User).where(User.email == user_email)).first()

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
        self.session.commit()
        self.session.refresh(new_board)

        return new_board

    def get_all_boards(self, user_email: str) -> list[Board]:
        user = self.session.exec(select(User).where(User.email == user_email)).first()

        if not user:
            raise ValueError("User not found")

        # Query boards directly instead of using relationship
        boards = self.session.exec(
            select(Board).where(Board.user_id == user.id)
        ).all()

        return list(boards)

    def get_board_by_id(self, board_id: int, user_email: str) -> Board | None:
        board = self.session.exec(select(Board).where(Board.id == board_id)).first()

        if not board:
            return None

        # Check if board has a user and verify ownership
        if not board.user:
            raise PermissionError("Board has no owner")

        if board.user.email != user_email:
            raise PermissionError("Not authorized to access this board")

        return board

    def update_board(
        self, board_id: int, board_name: str, user_email: str
    ) -> Board | None:
        board = self.session.exec(select(Board).where(Board.id == board_id)).first()

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
        self.session.commit()
        self.session.refresh(board)

        return board

    def delete_board(self, board_id: int, user_email: str) -> bool:
        board = self.session.exec(select(Board).where(Board.id == board_id)).first()

        if not board:
            return False

        # Check if board has a user and verify ownership
        if not board.user:
            raise PermissionError("Board has no owner")

        if board.user.email != user_email:
            raise PermissionError("Not authorized to delete this board")

        self.session.delete(board)
        self.session.commit()

        return True
