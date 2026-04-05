from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db import get_session
from src.exceptions import (
    BadRequestError,
    BoardNotFoundError,
    DomainError,
    ForbiddenActionError,
    to_http_exception,
)
from src.middlewares.auth import CurrentUser
from src.schemas import FeatureCreateRequest, FeatureResponse
from src.services.feature_service import FeatureService
from src.services.share_service import ACCESS_CREATE_UPVOTE, ShareService

router = APIRouter(tags=["features"])


@router.get("/boards/{board_id}/features", response_model=list[FeatureResponse])
async def list_owner_features(
    board_id: int,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        # Route handlers stay thin so domain rules remain centralized in services,
        # which avoids authorization logic drifting differently across endpoints.
        service = FeatureService(session)
        return await service.list_features_for_owner(board_id, user_email)
    except DomainError as e:
        # Domain errors are intentionally translated to stable HTTP responses here,
        # so service code can evolve without leaking transport concerns.
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/boards/{board_id}/features", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
async def create_owner_feature(
    board_id: int,
    body: FeatureCreateRequest,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        service = FeatureService(session)
        return await service.create_feature_for_owner(
            board_id=board_id,
            user_email=user_email,
            title=body.title,
            description=body.description,
        )
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/boards/{board_id}/features/{feature_id}", status_code=status.HTTP_200_OK)
async def delete_owner_feature(
    board_id: int,
    feature_id: int,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        service = FeatureService(session)
        await service.delete_feature_for_owner(board_id, feature_id, user_email)
        return {"message": "Feature deleted"}
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/shared/{token}/features", response_model=list[FeatureResponse])
async def list_shared_features(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        share_service = ShareService(session)
        features, _, _ = await share_service.get_shared_features(token)
        return features
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/shared/{token}/features", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
async def create_shared_feature(
    token: str,
    body: FeatureCreateRequest,
    x_client_key: str | None = Header(default=None, alias="X-Client-Key"),
    session: AsyncSession = Depends(get_session),
):
    try:
        if not x_client_key:
            # Shared callers are anonymous by design, so a client key is the only
            # ownership anchor we can use for follow-up actions like deletion.
            raise BadRequestError("Missing X-Client-Key header")

        share_service = ShareService(session)
        board, access_level = await share_service.get_shared_board(token)
        board_pk = board.id
        if board_pk is None:
            raise BoardNotFoundError()

        if access_level != ACCESS_CREATE_UPVOTE:
            # We fail early here to prevent clients from inferring partial write
            # capability from downstream validation errors.
            raise ForbiddenActionError("This share link is upvote-only")

        feature_service = FeatureService(session)
        return await feature_service.create_feature_for_shared(
            board_id=board_pk,
            creator_client_id=x_client_key,
            title=body.title,
            description=body.description,
        )
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/shared/{token}/features/{feature_id}", status_code=status.HTTP_200_OK)
async def delete_shared_feature(
    token: str,
    feature_id: int,
    x_client_key: str | None = Header(default=None, alias="X-Client-Key"),
    session: AsyncSession = Depends(get_session),
):
    try:
        if not x_client_key:
            raise BadRequestError("Missing X-Client-Key header")

        share_service = ShareService(session)
        board, access_level = await share_service.get_shared_board(token)
        board_pk = board.id
        if board_pk is None:
            raise BoardNotFoundError()

        if access_level != ACCESS_CREATE_UPVOTE:
            raise ForbiddenActionError("This share link is upvote-only")

        feature_service = FeatureService(session)
        await feature_service.delete_feature_for_shared(
            board_id=board_pk,
            feature_id=feature_id,
            creator_client_id=x_client_key,
        )
        return {"message": "Feature deleted"}
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
