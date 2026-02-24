"""
Billing Routes - Stripe Payment Integration

This module handles all Stripe billing operations.
Matches the exact structure and logic from TypeScript API routes:
- POST /api/billing/create-checkout -> POST /billing/create-checkout
- POST /api/billing/create-portal -> POST /billing/create-portal

All routes require authentication (JWT token in Authorization header).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from src.config.db import get_session
from src.middlewares.auth import CurrentUser
from src.routes.schemas import (
    BillingStatusResponse,
    CheckoutRequest,
    CheckoutResponse,
    PortalResponse,
)
from src.services.stripe_service import StripeService

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    user_email: CurrentUser, session: Session = Depends(get_session)
):
    """
    Return billing status for the current user

    Response:
    {
        "has_access": true/false,
        "customer_id": "cus_..." | null
    }
    """
    stripe_service = StripeService(session)
    user = stripe_service.get_user_by_email(user_email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return BillingStatusResponse(
        has_access=bool(user.has_access), customer_id=user.customer_id
    )


@router.post(
    "/create-checkout", response_model=CheckoutResponse, status_code=status.HTTP_200_OK
)
def create_checkout_session(
    body: CheckoutRequest,
    user_email: CurrentUser,
    session: Session = Depends(get_session),
):
    """
    Create Stripe checkout session for subscription purchase

    Equivalent to TypeScript: POST /api/billing/create-checkout

    Request Body:
    {
        "successUrl": "http://localhost:3000/dashboard/success",
        "cancelUrl": "http://localhost:3000/dashboard"
    }

    Response:
    {
        "url": "https://checkout.stripe.com/pay/..."
    }

    Flow (EXACT same as TypeScript):
    1. Parse request body
    2. Validate successUrl and cancelUrl are present
    3. Check authentication (user_email from JWT)
    4. Find user in database
    5. Create Stripe checkout session
    6. Return checkout URL

    Raises:
        HTTPException 400: If successUrl or cancelUrl missing
        HTTPException 401: If not authenticated
        HTTPException 404: If user not found
        HTTPException 500: If Stripe error or other error
    """
    try:
        # Step 1: Validate input - Same as TypeScript
        # if (!body.successUrl || !body.cancelUrl) { return error }
        if not body.success_url or not body.cancel_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="successUrl and cancelUrl are required",
            )

        # Step 2: Initialize Stripe service
        stripe_service = StripeService(session)

        # Step 3: Find user by email (from JWT token)
        # Same as: const user = await User.findById(session.user.id);
        user = stripe_service.get_user_by_email(user_email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Ensure user has an ID
        if not user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User ID not found"
            )

        # Step 4: Create Stripe checkout session
        # Same as: await stripe.checkout.sessions.create({...})
        checkout_url = stripe_service.create_checkout_session(
            user_email=user.email,
            user_id=user.id,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )

        # Step 5: Return checkout URL
        # Same as: return NextResponse.json({ url: stripeCheckoutSession.url });
        return CheckoutResponse(url=checkout_url)

    except ValueError as e:
        # Handle service-level errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )

    except Exception as e:
        # Catch-all for unexpected errors
        # Same as: catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post(
    "/create-portal", response_model=PortalResponse, status_code=status.HTTP_200_OK
)
def create_portal_session(
    user_email: CurrentUser, session: Session = Depends(get_session)
):
    """
    Create Stripe customer portal session for subscription management

    Equivalent to TypeScript: POST /api/billing/create-portal

    Response:
    {
        "url": "https://billing.stripe.com/session/..."
    }

    Flow (EXACT same as TypeScript):
    1. Check authentication (user_email from JWT)
    2. Find user in database
    3. Verify user has customer_id (has made a purchase)
    4. Create Stripe portal session
    5. Return portal URL

    Raises:
        HTTPException 401: If not authenticated
        HTTPException 404: If user not found
        HTTPException 400: If user has no customer_id
        HTTPException 500: If Stripe error or other error
    """
    try:
        # Step 1: Initialize Stripe service
        stripe_service = StripeService(session)

        # Step 2: Find user by email (from JWT token)
        user = stripe_service.get_user_by_email(user_email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Step 3: Verify user has customer_id
        if not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No customer ID found. Please complete a purchase first.",
            )

        # Step 4: Create Stripe portal session
        # Same as: await stripe.billingPortal.sessions.create({...})
        portal_url = stripe_service.create_portal_session(user_email)

        # Step 5: Return portal URL
        # Same as: return NextResponse.json({ url: portalSession.url });
        return PortalResponse(url=portal_url)

    except ValueError as e:
        # Handle service-level errors
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except Exception as e:
        # Catch-all for unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
