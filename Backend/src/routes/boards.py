from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.config.db import get_session
from src.exceptions import (
    BadRequestError,
    BoardNotFoundError,
    DomainError,
    UserNotFoundError,
    to_http_exception,
)
from src.middlewares.auth import CurrentUser
from src.schemas import BoardCreateRequest, BoardResponse, BoardUpdateRequest
from src.services.board_service import BoardService

router = APIRouter(prefix="/boards", tags=["boards"])


@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    body: BoardCreateRequest,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        if not body.board_name or body.board_name.strip() == "":
            raise BadRequestError("Board name is required")

        service = BoardService(session)
        new_board = await service.create_board(body.board_name, user_email)

        return new_board

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/", response_model=list[BoardResponse])
async def get_all_boards(
    user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    try:
        service = BoardService(session)
        boards = await service.get_all_boards(user_email)
        return boards

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/shared/outgoing", response_model=list[BoardResponse])
async def get_outgoing_shared_boards(
    user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    try:
        service = BoardService(session)
        rows = await service.get_shared_boards(user_email)
        # We shape tuples into explicit response objects at the route boundary so
        # API consumers remain decoupled from service-layer query details.
        return [
            BoardResponse(
                id=board.id,
                board_name=board.board_name,
                user_id=board.user_id,
                created_at=board.created_at,
                updated_at=board.updated_at,
                share_links_count=int(share_count or 0),
            )
            for board, share_count in rows
        ]

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: int, user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    try:
        service = BoardService(session)
        board = await service.get_board_by_id(board_id, user_email)

        if not board:
            raise BoardNotFoundError()

        return board

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.patch("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: int,
    body: BoardUpdateRequest,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        service = BoardService(session)
        board = await service.update_board(board_id, body.board_name, user_email)

        if not board:
            raise BoardNotFoundError()

        return board

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.delete("/{board_id}", status_code=status.HTTP_200_OK)
async def delete_board(
    board_id: int, user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    try:
        service = BoardService(session)
        deleted = await service.delete_board(board_id, user_email)

        if not deleted:
            raise BoardNotFoundError()

        return {"message": f"Board with id {board_id} successfully deleted"}

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/subscription/status", status_code=status.HTTP_200_OK)
async def get_subscription_status(
    user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    try:
        from src.models.user import User

        result = await session.execute(select(User).where(User.email == user_email))
        user = result.scalars().first()

        if not user:
            raise UserNotFoundError()

        return {
            "has_access": user.has_access,
            "customer_id": user.customer_id,
            # ISO format keeps timezone-aware billing timestamps predictable when
            # consumed by JS clients and external dashboards.
            "stripe_current_period_end": user.stripe_current_period_end.isoformat() if user.stripe_current_period_end else None
        }

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
