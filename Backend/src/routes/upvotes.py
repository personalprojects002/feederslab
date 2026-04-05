import hashlib

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db import get_session
from src.exceptions import (
    BadRequestError,
    BoardNotFoundError,
    DomainError,
    to_http_exception,
)
from src.middlewares.auth import CurrentUser
from src.schemas import UpvoteStatusResponse, UpvoteToggleRequest
from src.services.share_service import ShareService
from src.services.upvote_service import UpvoteService

router = APIRouter(tags=["upvotes"])


def _resolve_owner_voter_key(user_email: str) -> str:
    normalized_email = user_email.strip().lower()
    if not normalized_email:
        raise BadRequestError("Missing owner identity")
    # Namespacing voter keys keeps owner identities isolated from anonymous
    # shared voters, preventing accidental collisions in vote records.
    return f"owner:{normalized_email}"


def _extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "").strip()
    if forwarded_for:
        first_forwarded_ip = forwarded_for.split(",", 1)[0].strip()
        if first_forwarded_ip:
            return first_forwarded_ip

    real_ip = request.headers.get("x-real-ip", "").strip()
    if real_ip:
        return real_ip

    if request.client and request.client.host:
        return request.client.host.strip()

    return "unknown-ip"


def _resolve_shared_voter_key(request: Request, token: str) -> str:
    # Strict server-side identity for shared links: same requester context => same voter key.
    client_ip = _extract_client_ip(request).lower()
    user_agent = request.headers.get("user-agent", "").strip().lower() or "unknown-ua"
    accept_language = (
        request.headers.get("accept-language", "").strip().lower()
        or "unknown-language"
    )
    sec_ch_ua = request.headers.get("sec-ch-ua", "").strip().lower() or "unknown-ch-ua"

    fingerprint_source = f"{token}|{client_ip}|{user_agent}|{accept_language}|{sec_ch_ua}"
    fingerprint_hash = hashlib.sha256(fingerprint_source.encode("utf-8")).hexdigest()

    # Token is part of the fingerprint so a person can vote separately on
    # different shared boards while still being deduplicated per board.
    return f"shared:{fingerprint_hash}"


@router.post("/features/{feature_id}/upvote", response_model=UpvoteStatusResponse)
async def toggle_owner_upvote(
    feature_id: int,
    body: UpvoteToggleRequest,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        voter_key = _resolve_owner_voter_key(user_email)
        service = UpvoteService(session)
        upvotes_count, upvoted = await service.set_upvote(
            feature_id=feature_id,
            voter_key=voter_key,
            upvoted=body.upvoted,
        )
        return UpvoteStatusResponse.model_validate(
            {
                "feature_id": feature_id,
                "upvotes_count": upvotes_count,
                "upvoted": upvoted,
            }
        )
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/features/{feature_id}/upvote-status", response_model=UpvoteStatusResponse)
async def get_owner_upvote_status(
    feature_id: int,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        resolved_voter_key = _resolve_owner_voter_key(user_email)
        service = UpvoteService(session)
        upvotes_count, upvoted = await service.get_status(
            feature_id=feature_id,
            voter_key=resolved_voter_key,
        )
        return UpvoteStatusResponse.model_validate(
            {
                "feature_id": feature_id,
                "upvotes_count": upvotes_count,
                "upvoted": upvoted,
            }
        )
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/shared/{token}/features/{feature_id}/upvote", response_model=UpvoteStatusResponse)
async def toggle_shared_upvote(
    token: str,
    feature_id: int,
    body: UpvoteToggleRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    try:
        voter_key = _resolve_shared_voter_key(request, token)
        share_service = ShareService(session)
        board, _ = await share_service.get_shared_board(token)
        board_pk = board.id
        if board_pk is None:
            raise BoardNotFoundError()

        # Board scoping ensures a valid token cannot be reused to vote on a
        # feature that belongs to a different board.
        service = UpvoteService(session)
        upvotes_count, upvoted = await service.set_upvote(
            feature_id=feature_id,
            voter_key=voter_key,
            upvoted=body.upvoted,
            board_id=board_pk,
        )
        return UpvoteStatusResponse.model_validate(
            {
                "feature_id": feature_id,
                "upvotes_count": upvotes_count,
                "upvoted": upvoted,
            }
        )
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/shared/{token}/features/{feature_id}/upvote-status", response_model=UpvoteStatusResponse)
async def get_shared_upvote_status(
    token: str,
    feature_id: int,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    try:
        resolved_voter_key = _resolve_shared_voter_key(request, token)
        share_service = ShareService(session)
        board, _ = await share_service.get_shared_board(token)
        board_pk = board.id
        if board_pk is None:
            raise BoardNotFoundError()

        service = UpvoteService(session)
        upvotes_count, upvoted = await service.get_status(
            feature_id=feature_id,
            voter_key=resolved_voter_key,
            board_id=board_pk,
        )
        return UpvoteStatusResponse.model_validate(
            {
                "feature_id": feature_id,
                "upvotes_count": upvotes_count,
                "upvoted": upvoted,
            }
        )
    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
