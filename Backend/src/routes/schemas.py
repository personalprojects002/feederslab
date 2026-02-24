from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# ==================== Board Schemas ====================


class BoardCreateRequest(BaseModel):
    board_name: str = Field(min_length=1, max_length=200, alias="boardName")

    class Config:
        populate_by_name = True


class BoardUpdateRequest(BaseModel):
    board_name: str = Field(min_length=1, max_length=200, alias="boardName")

    class Config:
        populate_by_name = True


class BoardResponse(BaseModel):
    id: int
    board_name: str
    user_id: str  # Changed to string to match Better Auth user IDs
    created_at: datetime  # Changed to datetime
    updated_at: datetime  # Changed to datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()  # Convert datetime to ISO string for JSON
        }


# ==================== Payment/Billing Schemas ====================
# Match TypeScript interfaces from billing API routes


class CheckoutRequest(BaseModel):
    """
    Request body for creating Stripe checkout session

    Equivalent to TypeScript:
        interface CheckoutRequestBody {
            successUrl: string,
            cancelUrl: string
        }
    """

    success_url: str = Field(alias="successUrl")
    cancel_url: str = Field(alias="cancelUrl")

    class Config:
        populate_by_name = True


class CheckoutResponse(BaseModel):
    """
    Response from checkout session creation

    Equivalent to TypeScript:
        return NextResponse.json({ url: stripeCheckoutSession.url });
    """

    url: str


class PortalResponse(BaseModel):
    """
    Response from portal session creation

    Equivalent to TypeScript:
        return NextResponse.json({ url: portalSession.url });
    """

    url: str


class BillingStatusResponse(BaseModel):
    has_access: bool
    customer_id: Optional[str] = None


# ==================== Common Schemas ====================


class ErrorResponse(BaseModel):
    error: str


class SuccessResponse(BaseModel):
    message: str
