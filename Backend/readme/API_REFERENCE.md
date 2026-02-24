# API Reference - Backend

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints (except webhooks) require Bearer token authentication:

```http
Authorization: Bearer <session-token>
```

---

## Boards Endpoints

### Get All Boards

Retrieve all boards for authenticated user.

**Endpoint:** `GET /boards/`

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "board_name": "Product Feedback",
    "board_id": "unique-board-id",
    "owner_email": "user@example.com",
    "created_at": "2026-02-06T12:00:00",
    "updated_at": "2026-02-06T12:00:00"
  }
]
```

**Errors:**

- `401 Unauthorized` - Invalid/missing token
- `500 Internal Server Error` - Database error

---

### Get Board by ID

Retrieve specific board by ID.

**Endpoint:** `GET /boards/{board_id}`

**Parameters:**

- `board_id` (path) - Board ID string

**Response:** `200 OK`

```json
{
  "id": 1,
  "board_name": "Product Feedback",
  "board_id": "unique-board-id",
  "owner_email": "user@example.com",
  "created_at": "2026-02-06T12:00:00",
  "updated_at": "2026-02-06T12:00:00"
}
```

**Errors:**

- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Board belongs to different user
- `404 Not Found` - Board doesn't exist
- `500 Internal Server Error` - Database error

---

### Create Board

Create a new board for authenticated user.

**Endpoint:** `POST /boards/`

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "board_name": "My New Board"
}
```

**Response:** `201 Created`

```json
{
  "id": 2,
  "board_name": "My New Board",
  "board_id": "generated-unique-id",
  "owner_email": "user@example.com",
  "created_at": "2026-02-06T12:00:00",
  "updated_at": "2026-02-06T12:00:00"
}
```

**Errors:**

- `400 Bad Request` - Board name empty or invalid
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - No active subscription (has_access = false)
- `404 Not Found` - User not found
- `500 Internal Server Error` - Database error

---

### Update Board

Update existing board name.

**Endpoint:** `PUT /boards/{board_id}`

**Parameters:**

- `board_id` (path) - Board ID string

**Request Body:**

```json
{
  "board_name": "Updated Board Name"
}
```

**Response:** `200 OK`

```json
{
  "id": 2,
  "board_name": "Updated Board Name",
  "board_id": "board-id",
  "owner_email": "user@example.com",
  "created_at": "2026-02-06T12:00:00",
  "updated_at": "2026-02-06T13:00:00"
}
```

**Errors:**

- `400 Bad Request` - Board name empty
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Board belongs to different user
- `404 Not Found` - Board not found
- `500 Internal Server Error` - Database error

---

### Delete Board

Delete a board.

**Endpoint:** `DELETE /boards/{board_id}`

**Parameters:**

- `board_id` (path) - Board ID string

**Response:** `200 OK`

```json
{
  "message": "Board deleted successfully"
}
```

**Errors:**

- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Board belongs to different user
- `404 Not Found` - Board not found
- `500 Internal Server Error` - Database error

---

## Billing Endpoints

### Create Checkout Session

Create Stripe checkout session for subscription.

**Endpoint:** `POST /billing/create-checkout`

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "priceId": "price_1234567890"
}
```

**Response:** `200 OK`

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Flow:**

1. Backend finds/creates Stripe customer
2. Creates checkout session
3. Returns checkout URL
4. Frontend redirects to URL
5. User completes payment
6. Webhook updates user access

**Errors:**

- `400 Bad Request` - Invalid price ID
- `401 Unauthorized` - Invalid/missing token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Stripe error

---

### Create Portal Session

Create Stripe customer portal session.

**Endpoint:** `POST /billing/create-portal`

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Features:**

- Update payment method
- View invoices
- Manage subscription
- Update billing information

**Errors:**

- `400 Bad Request` - No Stripe customer ID
- `401 Unauthorized` - Invalid/missing token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Stripe error

---

## Webhook Endpoints

### Stripe Webhook

Handle Stripe webhook events.

**Endpoint:** `POST /stripe/webhooks`

**Headers:**

```http
Stripe-Signature: <signature>
Content-Type: application/json
```

**Events Handled:**

- `checkout.session.completed` - Payment successful
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled

**Response:** `200 OK`

```json
{
  "status": "success"
}
```

**Errors:**

- `400 Bad Request` - Invalid signature
- `500 Internal Server Error` - Processing error

**Notes:**

- No authentication required (verified via signature)
- Idempotent (safe to retry)
- Updates `has_access` field in user table

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message description"
}
```

### Common Error Messages

**Authentication:**

- `"Not Authorized"` - No Authorization header
- `"Invalid authorization header format"` - Wrong format
- `"Token is missing"` - Empty Bearer token
- `"Invalid or expired session"` - Session not found/expired

**Validation:**

- `"Board name is required"` - Empty board name
- `"Board not found"` - Invalid board_id
- `"User not found"` - User doesn't exist

**Authorization:**

- `"You don't have an active subscription"` - No access
- `"This board does not belong to you"` - Wrong owner

---

## Rate Limiting

No rate limiting currently implemented.

Recommended for production:

- Use FastAPI rate limiting middleware
- Configure per-endpoint limits
- Return 429 Too Many Requests

---

## Pagination

Not currently implemented for boards.

To implement:

```python
@router.get("/boards/")
def get_boards(
    skip: int = 0,
    limit: int = 100,
    user_email: CurrentUser = Depends()
):
    # Return paginated results
    pass
```

---

## Filtering & Sorting

Not currently implemented.

To implement:

```python
@router.get("/boards/")
def get_boards(
    sort_by: str = "created_at",
    order: str = "desc",
    user_email: CurrentUser = Depends()
):
    # Return sorted results
    pass
```

---

## Testing Endpoints

### Using cURL

```bash
# Get all boards
curl -X GET http://localhost:8000/boards/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create board
curl -X POST http://localhost:8000/boards/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"board_name":"Test Board"}'

# Update board
curl -X PUT http://localhost:8000/boards/board-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"board_name":"Updated Name"}'

# Delete board
curl -X DELETE http://localhost:8000/boards/board-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Python requests

```python
import requests

BASE_URL = "http://localhost:8000"
TOKEN = "your-session-token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Get boards
response = requests.get(f"{BASE_URL}/boards/", headers=headers)
boards = response.json()

# Create board
data = {"board_name": "Test Board"}
response = requests.post(f"{BASE_URL}/boards/", headers=headers, json=data)
board = response.json()
```

---

## Interactive Documentation

FastAPI auto-generates interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
  - Try endpoints directly
  - See request/response schemas
  - Test authentication

- **ReDoc**: http://localhost:8000/redoc
  - Cleaner documentation view
  - Better for reading
  - Export to Markdown

---

## Versioning

Current version: `v1.0.0`

No API versioning currently implemented.

For future versions, consider:

- URL versioning: `/v1/boards/`, `/v2/boards/`
- Header versioning: `API-Version: 2.0`
- Query param: `/boards/?version=2`
