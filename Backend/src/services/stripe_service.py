from typing import Optional

import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.config.settings import settings
from src.exceptions import BadRequestError, ExternalServiceError, UserNotFoundError
from src.models.user import User


class StripeService:
    """Stripe payment operations for checkout, portal, and webhook updates."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.stripe = stripe
        self.stripe.api_key = settings.stripe_secret_key
        # Version pinning protects webhook/session behavior from silent provider
        # API changes between deployments.
        self.stripe.api_version = "2025-12-15.clover"

    async def get_user_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        user = result.scalars().first()
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        statement = select(User).where(User.id == user_id)
        result = await self.session.execute(statement)
        user = result.scalars().first()
        return user

    async def create_checkout_session(
        self, user_email: str, user_id: str, success_url: str, cancel_url: str
    ) -> str:
        try:
            checkout_session = self.stripe.checkout.Session.create(
                mode="subscription",
                line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                client_reference_id=str(user_id),
                # Metadata provides a durable fallback for correlating Stripe
                # events to internal users during webhook processing.
                metadata={"userId": str(user_id)},
            )

            return checkout_session.url or ""

        except Exception as e:
            raise ExternalServiceError(f"Failed to create checkout session: {str(e)}")

    async def create_portal_session(self, user_email: str) -> str:
        user = await self.get_user_by_email(user_email)

        if not user:
            raise UserNotFoundError()

        if not user.customer_id:
            raise BadRequestError(
                "No customer ID found. User must complete a purchase first."
            )

        try:
            portal_session = self.stripe.billing_portal.Session.create(
                customer=user.customer_id,
                return_url=f"{self._get_app_url()}/dashboard",
            )

            return portal_session.url or ""

        except Exception as e:
            raise ExternalServiceError(f"Failed to create portal session: {str(e)}")

    async def handle_checkout_completed(self, session_data: dict) -> None:
        user_id = session_data.get("client_reference_id")
        customer_id = session_data.get("customer")

        if not user_id:
            raise BadRequestError("client_reference_id not found in session data")

        user = await self.get_user_by_id(user_id)

        if not user:
            raise UserNotFoundError()

        # Access is granted only after Stripe confirms checkout completion to
        # keep entitlement changes aligned with payment truth.
        user.has_access = True
        user.customer_id = customer_id

        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

    async def handle_subscription_deleted(self, subscription_data: dict) -> None:
        customer_id = subscription_data.get("customer")

        if not customer_id:
            return

        statement = select(User).where(User.customer_id == customer_id)
        result = await self.session.execute(statement)
        user = result.scalars().first()

        if user:
            # Subscription deletion revokes access to enforce paywall integrity
            # without waiting for user action.
            user.has_access = False
            self.session.add(user)
            await self.session.commit()
            await self.session.refresh(user)

    def _get_app_url(self) -> str:
        return settings.app_url
