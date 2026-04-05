from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db import get_session
from src.config.settings import settings
from src.exceptions import BoardNotFoundError, DomainError, to_http_exception
from src.middlewares.auth import CurrentUser
from src.schemas import ShareLinkCreateRequest, ShareLinkResponse, SharedBoardResponse
from src.services.share_service import ShareService

router = APIRouter(tags=["share-links"])


@router.post(
    "/boards/{board_id}/share-links",
    response_model=ShareLinkResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_share_link(
    board_id: int,
    body: ShareLinkCreateRequest,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        service = ShareService(session)
        link, share_url = await service.create_share_link(
            board_id=board_id,
            user_email=user_email,
            access_level=body.access_level,
            frontend_origin=settings.frontend_origin,
        )
        # Response keys are kept in frontend-friendly casing here so route-level
        # contracts stay stable even if internal ORM field names differ.
        return {
            "token": link.token,
            "accessLevel": link.access_level,
            "shareUrl": share_url,
        }
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/shared/{token}",
    response_model=SharedBoardResponse,
    response_model_by_alias=True,
)
async def get_shared_board(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        service = ShareService(session)
        board, access_level = await service.get_shared_board(token)
        board_pk = board.id
        if board_pk is None:
            raise BoardNotFoundError()
        # Shared callers only need minimal metadata to render and enforce access,
        # so we intentionally avoid exposing unrelated board internals.
        return {
            "boardId": board_pk,
            "boardName": board.board_name,
            "accessLevel": access_level,
        }
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
