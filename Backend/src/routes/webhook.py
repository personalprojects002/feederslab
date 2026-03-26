"""
Webhook Handler - Stripe Events

This module handles incoming Stripe webhook events.
Matches the exact structure and logic from TypeScript:
- POST /api/webhook -> POST /webhook/stripe

Handles these events:
- checkout.session.completed: User completed payment -> Grant access
- customer.subscription.deleted: Subscription cancelled -> Revoke access

All webhook signatures are verified using Stripe's signature verification.
"""

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db import get_session
from src.config.settings import STRIPE_WEBHOOK_SECRET
from src.services.stripe_service import StripeService

router = APIRouter(tags=["webhook"])


@router.post("/webhook/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    session: AsyncSession = Depends(get_session),
):
    """
    Handle Stripe webhook events

    Equivalent to TypeScript: POST /api/webhook

    Flow (EXACT same as TypeScript):
    1. Initialize Stripe
    2. Get raw body text and signature from headers
    3. Verify webhook signature
    4. Construct event from Stripe
    5. Handle specific event types:
       - checkout.session.completed: Grant user access
       - customer.subscription.deleted: Revoke user access
    6. Return success response

    Raises:
        HTTPException 400: If signature missing or verification fails
        HTTPException 404: If user not found
        HTTPException 400: If webhook handler fails

    Example TypeScript equivalent:
        const stripeObject = new Stripe(process.env.SB_STRIPE_SECRET_KEY, {
            apiVersion: "2025-12-15.clover"
        });
        const body = await req.text();
        const signatureKey = headersList.get("stripe-signature");
        const event = stripeObject.webhooks.constructEvent(body, signatureKey, webHookSecret);
    """
    try:
        # Step 1: Initialize Stripe - EXACT same as TypeScript
        # const stripeObject = new Stripe(process.env.SB_STRIPE_SECRET_KEY, {...});
        stripe.api_version = "2025-12-15.clover"
        
        print("\n" + "="*60)
        print("🔔 WEBHOOK RECEIVED")
        print("="*60)

        # Step 2: Get the raw body text
        # const body = await req.text();
        body = await request.body()

        # Step 3: Check if signature exists
        # if (!signatureKey) { return error }
        print(f"📍 Signature header received: {stripe_signature[:20] if stripe_signature else 'MISSING'}...")
        if not stripe_signature:
            print("❌ ERROR: Missing stripe-signature header!")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature",
            )

        # Step 4: Verify that the event actually came from Stripe
        # const event = stripeObject.webhooks.constructEvent(body, signatureKey, webHookSecret);
        try:
            print(f"🔐 Verifying webhook signature...")
            event = stripe.Webhook.construct_event(
                payload=body, sig_header=stripe_signature, secret=STRIPE_WEBHOOK_SECRET
            )
            print(f"✅ Signature verified successfully!")
        except Exception as e:
            # Stripe signature verification error
            print(f"❌ Signature verification failed: {str(e)}")
            if "signature" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid signature: {str(e)}",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Webhook construction failed: {str(e)}",
            )

        # Step 5: Extract event data
        # const { data, type } = event;
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        print(f"📌 Event Type: {event_type}")
        print(f"📦 Event Data: {event_data}")

        # Step 6: Initialize service
        stripe_service = StripeService(session)

        # Step 7: Handle specific event types
        # EXACT same logic as TypeScript

        # Handle checkout completion
        # if (type === "checkout.session.completed")
        if event_type == "checkout.session.completed":
            print(f"\n💳 Processing checkout.session.completed...")
            try:
                await stripe_service.handle_checkout_completed(event_data)
                print(f"✅ Checkout completed successfully!")
                print(f"   Customer ID: {event_data.get('customer')}")
                print(f"   User ID: {event_data.get('client_reference_id')}")
            except ValueError as e:
                # User not found
                print(f"❌ ERROR: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
                )

        # Handle subscription cancellation
        # else if (type === "customer.subscription.deleted")
        elif event_type == "customer.subscription.deleted":
            print(f"\n⛔ Processing customer.subscription.deleted...")
            try:
                await stripe_service.handle_subscription_deleted(event_data)
                print(f"✅ Subscription cancelled - access revoked")
            except Exception as e:
                print(f"❌ ERROR: {str(e)}")

        # Step 8: Return success response
        # return NextResponse.json({ received: true });
        print("\n" + "="*60)
        print("✅ WEBHOOK PROCESSED SUCCESSFULLY")
        print("="*60 + "\n")
        return {"received": True}

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Catch-all error handler
        # Same as TypeScript: catch (error: any) { return error }
        print(f"Webhook Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook handler failed: {str(e)}",
        )
