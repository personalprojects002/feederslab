import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db import get_session
from src.config.settings import settings
from src.exceptions import DomainError, to_http_exception
from src.services.stripe_service import StripeService

router = APIRouter(tags=["webhook"])


@router.post("/webhook/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    session: AsyncSession = Depends(get_session),
):
    try:
        stripe.api_version = "2025-12-15.clover"

        body = await request.body()

        if not stripe_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature",
            )

        try:
            # Signature verification must happen before touching event payload so
            # untrusted requests cannot trigger billing state transitions.
            event = stripe.Webhook.construct_event(
                payload=body,
                sig_header=stripe_signature,
                secret=settings.stripe_webhook_secret,
            )
        except Exception as e:
            if "signature" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid signature: {str(e)}",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Webhook construction failed: {str(e)}",
            )

        event_type = event["type"]
        event_data = event["data"]["object"]

        stripe_service = StripeService(session)

        if event_type == "checkout.session.completed":
            await stripe_service.handle_checkout_completed(event_data)
        elif event_type == "customer.subscription.deleted":
            await stripe_service.handle_subscription_deleted(event_data)
        # Unknown events are acknowledged to stop retries while keeping handler
        # scope intentionally focused on entitlement-changing signals.

        return {"received": True}

    except DomainError as e:
        raise to_http_exception(e)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook handler failed: {str(e)}",
        )
