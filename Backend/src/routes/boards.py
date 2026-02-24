from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.config.db import get_session
from src.middlewares.auth import CurrentUser
from src.routes.schemas import BoardCreateRequest, BoardResponse, BoardUpdateRequest
from src.services.board_service import BoardService

router = APIRouter(prefix="/boards", tags=["boards"])


@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(
    body: BoardCreateRequest,
    user_email: CurrentUser,
    session: Session = Depends(get_session),
):
    try:
        if not body.board_name or body.board_name.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Board name is required"
            )

        service = BoardService(session)
        new_board = service.create_board(body.board_name, user_email)

        return new_board

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/", response_model=list[BoardResponse])
def get_all_boards(user_email: CurrentUser, session: Session = Depends(get_session)):
    try:
        service = BoardService(session)
        boards = service.get_all_boards(user_email)
        return boards

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/{board_id}", response_model=BoardResponse)
def get_board(
    board_id: int, user_email: CurrentUser, session: Session = Depends(get_session)
):
    try:
        service = BoardService(session)
        board = service.get_board_by_id(board_id, user_email)

        if not board:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Board not found"
            )

        return board

    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.patch("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: int,
    body: BoardUpdateRequest,
    user_email: CurrentUser,
    session: Session = Depends(get_session),
):
    """
    Update a board's name

    Equivalent to Next.js: PATCH /api/boards/[id]

    Request Body:
    {
        "boardName": "Updated Board Name"
    }
    """
    try:
        service = BoardService(session)
        board = service.update_board(board_id, body.board_name, user_email)

        if not board:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Board not found"
            )

        return board

    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.delete("/{board_id}", status_code=status.HTTP_200_OK)
def delete_board(
    board_id: int, user_email: CurrentUser, session: Session = Depends(get_session)
):
    try:
        service = BoardService(session)
        deleted = service.delete_board(board_id, user_email)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Board not found"
            )

        return {"message": f"Board with id {board_id} successfully deleted"}

    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/subscription/status", status_code=status.HTTP_200_OK)
def get_subscription_status(
    user_email: CurrentUser, session: Session = Depends(get_session)
):
    try:
        from src.models.user import User
        from sqlmodel import select
        
        user = session.exec(select(User).where(User.email == user_email)).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "has_access": user.has_access,
            "customer_id": user.customer_id,
            "stripe_current_period_end": user.stripe_current_period_end.isoformat() if user.stripe_current_period_end else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
