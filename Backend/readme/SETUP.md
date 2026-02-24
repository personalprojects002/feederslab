# Backend Setup Instructions

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration (PostgreSQL - Neon)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Authentication Configuration
# MUST BE IDENTICAL to frontend BETTER_AUTH_SECRET
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-here-min-32-characters

# Stripe Configuration
SB_STRIPE_SECRET_KEY=sk_test_...
SB_PRODUCT_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Test Database
TEST_DATABASE_URL=postgresql://username:password@host/test_database?sslmode=require
```

## Important Notes

### BETTER_AUTH_SECRET
- **CRITICAL**: Must be **IDENTICAL** in both Frontend and Backend `.env` files
- Used to sign and verify JWT tokens
- Must be at least 32 characters long
- If these don't match, authentication will fail
- Generate a secure secret: `openssl rand -base64 32`

### DATABASE_URL
- Use Neon PostgreSQL connection string
- Same database as Frontend (shared PostgreSQL instance)
- Format: `postgresql://user:password@host/database?sslmode=require`
- The `sslmode=require` parameter is mandatory for Neon

### Stripe Configuration

#### SB_STRIPE_SECRET_KEY
- Your Stripe secret key (starts with `sk_test_` for test mode)
- Get from: https://dashboard.stripe.com/test/apikeys
- **Never commit this to version control!**

#### SB_PRODUCT_PRICE_ID
- The price ID for your subscription product
- Format: `price_...`
- Create in Stripe Dashboard → Products → Add Product → Add Price
- Use the same price ID as your TypeScript implementation

#### STRIPE_WEBHOOK_SECRET
- Webhook signing secret (starts with `whsec_...`)
- Get from: Stripe Dashboard → Webhooks → Add endpoint
- Webhook URL: `https://your-domain.com/webhook/stripe`
- Select events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.deleted`

## Installation

1. Install UV package manager (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies:
```bash
uv sync
```

3. Verify installation:
```bash
uv pip list
```

Expected packages:
- fastapi
- sqlmodel
- psycopg2-binary
- pyjwt
- stripe
- uvicorn
- python-multipart

## Database Setup

1. Tables are automatically created on first run via SQLModel
2. The following tables will be created:
   - `user` - User accounts (shared with Better Auth)
   - `board` - User boards

3. Better Auth tables (created by Frontend):
   - `user` - Extended by Backend with `has_access`, `customer_id`
   - `session` - JWT sessions
   - `account` - OAuth provider accounts
   - `verification` - Email verification tokens

## Running the Backend

### Development Mode
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

### Access API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication Required (JWT Token)
All endpoints except webhook require JWT token in header:
```
Authorization: Bearer <token>
```

### Boards
- `POST /boards` - Create new board (requires subscription)
- `GET /boards` - Get all user's boards
- `GET /boards/{id}` - Get specific board
- `PATCH /boards/{id}` - Update board name
- `DELETE /boards/{id}` - Delete board

### Billing
- `POST /billing/create-checkout` - Create Stripe checkout session
- `POST /billing/create-portal` - Create Stripe customer portal

### Webhook
- `POST /webhook/stripe` - Stripe webhook handler (no auth required)

## Testing Stripe Webhooks Locally

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local backend:
```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

4. Copy the webhook signing secret (whsec_...) to your `.env` file

5. Test a payment:
```bash
stripe trigger checkout.session.completed
```

## Architecture Overview

```
Frontend (Next.js)
    ↓ (JWT Token in Authorization header)
Backend (FastAPI)
    ↓ (Verify JWT)
PostgreSQL (Neon)
    ↑ (Query user data)
Stripe (Payment)
    → (Webhook events)
Backend
    → (Update user.has_access)
```

## JWT Authentication Flow

1. **User logs in on Frontend**
   - Better Auth creates JWT token
   - Token contains: email, userId, expiration

2. **Frontend calls Backend API**
   - Axios automatically attaches token: `Authorization: Bearer <token>`

3. **Backend receives request**
   - Extracts token from header
   - Verifies signature using `BETTER_AUTH_SECRET`
   - Decodes payload to get user email

4. **Backend queries database**
   - Finds user by email
   - Checks permissions (has_access for boards)
   - Returns data or error

## Payment Flow

### Subscribe Flow
1. User clicks "Subscribe" on Frontend
2. Frontend calls: `POST /billing/create-checkout`
3. Backend creates Stripe checkout session
4. Returns checkout URL
5. User redirected to Stripe
6. User completes payment
7. Stripe sends webhook: `checkout.session.completed`
8. Backend updates: `user.has_access = True`, `user.customer_id = <id>`
9. User can now create boards

### Cancel Subscription Flow
1. User clicks "Manage Subscription"
2. Frontend calls: `POST /billing/create-portal`
3. Backend creates Stripe portal session
4. User cancels subscription in Stripe portal
5. Stripe sends webhook: `customer.subscription.deleted`
6. Backend updates: `user.has_access = False`
7. User can no longer create boards

## Troubleshooting

### "Missing BETTER_AUTH_SECRET" Error
- Ensure `.env` file exists in Backend directory
- Verify `BETTER_AUTH_SECRET` is set
- Must match Frontend secret exactly

### "Invalid token" Error
- Check that BETTER_AUTH_SECRET matches Frontend
- Verify JWT token is being sent from Frontend
- Check token hasn't expired (7-day default)

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon PostgreSQL is running
- Ensure `sslmode=require` is in connection string
- Test connection: `psql $DATABASE_URL`

### Stripe Webhook Not Working
- Verify STRIPE_WEBHOOK_SECRET is set
- Check webhook signature verification
- Use Stripe CLI to test locally
- Ensure webhook endpoint is publicly accessible in production

### CORS Issues
- Verify Frontend URL is in `allow_origins` list (main.py)
- Check browser console for CORS errors
- Ensure credentials are being sent from Frontend

## Production Deployment

### Environment Variables
- Set all `.env` variables in your hosting platform
- Use production Stripe keys (sk_live_...)
- Use production webhook secret
- Set production DATABASE_URL

### Webhook URL
- Update Stripe webhook URL to production:
  - `https://api.yourdomain.com/webhook/stripe`
- Add events: `checkout.session.completed`, `customer.subscription.deleted`

### Security Checklist
- ✅ Never commit `.env` file
- ✅ Use strong BETTER_AUTH_SECRET (32+ characters)
- ✅ Use production Stripe keys in production
- ✅ Enable HTTPS for all API endpoints
- ✅ Verify webhook signatures
- ✅ Validate all user inputs
- ✅ Set proper CORS origins (not *)

## Code Structure Matches TypeScript

This Python backend mirrors your TypeScript structure exactly:

| TypeScript | Python |
|------------|--------|
| `app/api/board/route.ts` | `src/routes/boards.py` |
| `app/api/billing/create-checkout/route.ts` | `src/routes/billing.py` (create_checkout) |
| `app/api/billing/create-portal/route.ts` | `src/routes/billing.py` (create_portal) |
| `app/api/webhook/route.ts` | `src/routes/webhook.py` |
| `Models/user.ts` | `src/models/user.py` |
| `Models/board.ts` | `src/models/board.py` |
| `auth.api.getSession()` | `CurrentUser` dependency |

Every route, model, and logic pattern matches your TypeScript implementation for easy reading and maintenance.