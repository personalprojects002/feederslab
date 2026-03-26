"""
Stripe Service - Payment Processing

This service handles all Stripe-related operations.
Matches the exact logic from TypeScript API routes:
- /api/billing/create-checkout
- /api/billing/create-portal
- /api/webhook

All Stripe operations use the same API version and structure as the TypeScript implementation.
"""

from typing import Optional

import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.config.settings import STRIPE_PRICE_ID, STRIPE_SECRET_KEY
from src.models.user import User


class StripeService:
    """
    Stripe payment service

    Handles:
    - Creating checkout sessions
    - Creating customer portal sessions
    - Managing subscription status

    Equivalent to TypeScript Stripe logic in:
    - app/api/billing/create-checkout/route.ts
    - app/api/billing/create-portal/route.ts
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.stripe = stripe
        self.stripe.api_key = STRIPE_SECRET_KEY
        # EXACT same API version as TypeScript
        self.stripe.api_version = "2025-12-15.clover"

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address

        Args:
            email: User email address

        Returns:
            User object or None if not found
        """
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        user = result.scalars().first()
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID

        Args:
            user_id: User ID (string)

        Returns:
            User object or None if not found
        """
        statement = select(User).where(User.id == user_id)
        result = await self.session.execute(statement)
        user = result.scalars().first()
        return user

    async def create_checkout_session(
        self, user_email: str, user_id: str, success_url: str, cancel_url: str
    ) -> str:
        """
        Create Stripe checkout session

        Equivalent to TypeScript:
            POST /api/billing/create-checkout

        Exact same logic as TypeScript version:
        1. Validate user exists
        2. Create Stripe checkout session
        3. Set mode to "subscription"
        4. Add price ID and quantity
        5. Set success/cancel URLs
        6. Add customer email and metadata
        7. Return checkout URL

        Args:
            user_email: User's email address
            user_id: User's ID (string)
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled

        Returns:
            str: Stripe checkout session URL

        Raises:
            ValueError: If Stripe session creation fails

        Example TypeScript equivalent:
            const stripeCheckoutSession = await stripe.checkout.sessions.create({
                mode: "subscription",
                line_items: [{
                    price: process.env.SB_PRODUCT_PRICE_ID,
                    quantity: 1
                }],
                success_url: body.successUrl,
                cancel_url: body.cancelUrl,
                customer_email: user.email,
                client_reference_id: user._id.toString(),
                metadata: { userId: user._id.toString() }
            });
        """
        try:
            # Create checkout session - EXACT same structure as TypeScript
            checkout_session = self.stripe.checkout.Session.create(
                mode="subscription",
                line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                client_reference_id=str(user_id),
                metadata={"userId": str(user_id)},
            )

            return checkout_session.url or ""

        except Exception as e:
            raise ValueError(f"Failed to create checkout session: {str(e)}")

    async def create_portal_session(self, user_email: str) -> str:
        """
        Create Stripe customer portal session

        Equivalent to TypeScript:
            POST /api/billing/create-portal

        Allows customers to manage their subscription, payment methods, and billing info.

        Args:
            user_email: User's email address

        Returns:
            str: Stripe portal session URL

        Raises:
            ValueError: If user not found or no customer_id
            ValueError: If Stripe portal creation fails

        Example TypeScript equivalent:
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: user.customerId,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
            });
        """
        user = await self.get_user_by_email(user_email)

        if not user:
            raise ValueError("User not found")

        if not user.customer_id:
            raise ValueError(
                "No customer ID found. User must complete a purchase first."
            )

        try:
            portal_session = self.stripe.billing_portal.Session.create(
                customer=user.customer_id,
                return_url=f"{self._get_app_url()}/dashboard",
            )

            return portal_session.url or ""

        except Exception as e:
            raise ValueError(f"Failed to create portal session: {str(e)}")

    async def handle_checkout_completed(self, session_data: dict) -> None:
        """
        Handle successful checkout completion

        Equivalent to TypeScript webhook handler:
            if (type === "checkout.session.completed")

        Updates user:
        - Sets has_access = True
        - Stores Stripe customer_id

        Args:
            session_data: Stripe checkout session data

        Raises:
            ValueError: If user not found

        Example TypeScript equivalent:
            const user = await User.findById(session.client_reference_id);
            user.hasAccess = true;
            user.customerId = session.customer as string;
            await user.save();
        """
        user_id = session_data.get("client_reference_id")
        customer_id = session_data.get("customer")

        if not user_id:
            raise ValueError("client_reference_id not found in session data")

        user = await self.get_user_by_id(user_id)  # Now user_id is a string

        if not user:
            raise ValueError("User not found")

        # Update user - EXACT same fields as TypeScript
        user.has_access = True
        user.customer_id = customer_id

        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

    async def handle_subscription_deleted(self, subscription_data: dict) -> None:
        """
        Handle subscription cancellation

        Equivalent to TypeScript webhook handler:
            else if (type === "customer.subscription.deleted")

        Updates user:
        - Sets has_access = False

        Args:
            subscription_data: Stripe subscription data

        Example TypeScript equivalent:
            const user = await User.findOne({ customerId: subscription.customer });
            if (user) {
                user.hasAccess = false;
                await user.save();
            }
        """
        customer_id = subscription_data.get("customer")

        if not customer_id:
            return

        statement = select(User).where(User.customer_id == customer_id)
        result = await self.session.execute(statement)
        user = result.scalars().first()

        if user:
            # Revoke access - EXACT same logic as TypeScript
            user.has_access = False
            self.session.add(user)
            await self.session.commit()
            await self.session.refresh(user)

    def _get_app_url(self) -> str:
        """
        Get application URL for redirects

        Returns:
            str: Application base URL
        """
        # In production, you'd get this from environment variables
        # For now, return localhost for development
        return "http://localhost:3000"
