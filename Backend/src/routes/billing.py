from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db import get_session
from src.exceptions import BadRequestError, DomainError, UserNotFoundError, to_http_exception
from src.middlewares.auth import CurrentUser
from src.schemas import (
    BillingStatusResponse,
    CheckoutRequest,
    CheckoutResponse,
    PortalResponse,
)
from src.services.stripe_service import StripeService

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(
    user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    stripe_service = StripeService(session)
    user = await stripe_service.get_user_by_email(user_email)

    if not user:
        raise to_http_exception(UserNotFoundError())

    # Billing status is intentionally minimal so frontend gating decisions can
    # be made without exposing full payment-provider metadata.
    return BillingStatusResponse(
        has_access=bool(user.has_access), customer_id=user.customer_id
    )


@router.post(
    "/create-checkout", response_model=CheckoutResponse, status_code=status.HTTP_200_OK
)
async def create_checkout_session(
    body: CheckoutRequest,
    user_email: CurrentUser,
    session: AsyncSession = Depends(get_session),
):
    try:
        if not body.success_url or not body.cancel_url:
            # Explicit URL validation avoids creating checkout sessions that can
            # strand users without a deterministic return path.
            raise BadRequestError("successUrl and cancelUrl are required")

        stripe_service = StripeService(session)
        user = await stripe_service.get_user_by_email(user_email)

        if not user:
            raise UserNotFoundError()

        if not user.id:
            raise BadRequestError("User ID not found")

        checkout_url = await stripe_service.create_checkout_session(
            user_email=user.email,
            user_id=user.id,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )

        return CheckoutResponse(url=checkout_url)

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post(
    "/create-portal", response_model=PortalResponse, status_code=status.HTTP_200_OK
)
async def create_portal_session(
    user_email: CurrentUser, session: AsyncSession = Depends(get_session)
):
    try:
        stripe_service = StripeService(session)
        user = await stripe_service.get_user_by_email(user_email)

        if not user:
            raise UserNotFoundError()

        if not user.customer_id:
            # Portal requires an existing Stripe customer; failing early avoids
            # opaque provider errors and gives a user-actionable message.
            raise BadRequestError(
                "No customer ID found. Please complete a purchase first."
            )

        portal_url = await stripe_service.create_portal_session(user_email)
        return PortalResponse(url=portal_url)

    except DomainError as e:
        raise to_http_exception(e)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
