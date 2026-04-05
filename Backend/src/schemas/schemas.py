from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# ==================== Board Schemas ====================


class BoardCreateRequest(BaseModel):
    # Alias keeps backend naming idiomatic while allowing camelCase payloads
    # from frontend forms without custom mapper code.
    board_name: str = Field(min_length=1, max_length=200, alias="boardName")

    class Config:
        populate_by_name = True


class BoardUpdateRequest(BaseModel):
    # Reusing the same alias contract for update/create avoids subtle client
    # inconsistencies across similar write operations.
    board_name: str = Field(min_length=1, max_length=200, alias="boardName")

    class Config:
        populate_by_name = True


class BoardResponse(BaseModel):
    id: int
    board_name: str
    user_id: str  # Changed to string to match Better Auth user IDs
    created_at: datetime  # Changed to datetime
    updated_at: datetime  # Changed to datetime
    # Included directly for dashboard use-cases to avoid extra aggregate calls
    # from clients rendering ownership/share summaries.
    share_links_count: int = 0

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


# ==================== Feature Schemas ====================


class FeatureCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class FeatureResponse(BaseModel):
    id: int
    board_id: int
    creator_user_id: Optional[str] = None
    creator_client_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    upvotes_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# ==================== Share Schemas ====================


class ShareLinkCreateRequest(BaseModel):
    access_level: str = Field(alias="accessLevel")

    class Config:
        populate_by_name = True


class ShareLinkResponse(BaseModel):
    token: str
    access_level: str = Field(alias="accessLevel")
    share_url: str = Field(alias="shareUrl")

    class Config:
        populate_by_name = True


class SharedBoardResponse(BaseModel):
    board_id: int = Field(alias="boardId")
    board_name: str = Field(alias="boardName")
    access_level: str = Field(alias="accessLevel")

    class Config:
        populate_by_name = True


# ==================== Upvote Schemas ====================


class UpvoteToggleRequest(BaseModel):
    upvoted: bool


class UpvoteStatusResponse(BaseModel):
    feature_id: int = Field(alias="featureId")
    upvotes_count: int = Field(alias="upvotesCount")
    upvoted: bool

    class Config:
        populate_by_name = True
