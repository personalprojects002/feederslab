# FeedersLab

FeedersLab is a full-stack SaaS product for collecting customer feature feedback, organizing it into boards, and managing subscription access.

It includes:

- A premium landing page and authentication flow
- A user dashboard to create and open feedback boards
- Stripe checkout + billing portal + webhook handling

## Who this product is for

- Product teams
- Founders shipping fast
- SaaS teams that need a clear system for feature requests

## Project structure

- `Frontend/` - Next.js app (UI, auth pages, dashboard)
- `Backend/` - FastAPI app (boards API, billing API, webhook)
- `scripts/` - one-click local start/stop scripts (Windows)

## Technology stack

### Frontend

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + DaisyUI
- Axios for backend API calls
- Better Auth (email magic link + Google social login)
- React Hot Toast for notifications
- Stripe SDK (frontend flow integration)

### Backend

- FastAPI
- SQLModel + SQLAlchemy
- PostgreSQL (via `psycopg2-binary`)
- JWT (`pyjwt[crypto]`)
- Stripe Python SDK
- Uvicorn ASGI server
- Python Dotenv for environment management

### External services

- Stripe (subscriptions, checkout, billing portal, webhooks)
- Resend (magic-link email delivery)
- Google OAuth (social login)

## Prerequisites

- Node.js 18+
- npm
- Python 3.12+
- PostgreSQL database
- Stripe CLI (for local webhook testing)

## Environment setup

Create `Backend/.env`:

```env
DATABASE_URL=postgresql://username:password@host:5432/db_name
TEST_DATABASE_URL=postgresql://username:password@host:5432/test_db_name

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

SB_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SB_PRODUCT_PRICE_ID=price_your_product_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Create `Frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret

RESEND_KEY=re_your_resend_api_key
RESEND_FROM=noreply@yourdomain.com
```

## Install dependencies

Frontend:

```powershell
cd Frontend
npm install
```

Backend (from project root):

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -e .\Backend
```

## Run locally (recommended)

From project root (Windows):

```powershell
.\scripts\start-all.bat
```

This starts:

- Stripe webhook listener
- Backend on `http://localhost:8000`
- Frontend on `http://localhost:3000`

Stop services:

```powershell
.\scripts\stop-all.bat
```

## Run manually (optional)

Backend:

```powershell
cd Backend
..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```powershell
cd Frontend
npm run dev
```

Stripe webhook listener:

```powershell
stripe listen --forward-to http://localhost:8000/webhook/stripe
```

## URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs (Swagger): `http://localhost:8000/docs`

## Product flow

1. User signs in (Google or magic link)
2. User enters dashboard and creates a board
3. User manages product feedback using boards
4. Billing access is checked via backend
5. User can subscribe (checkout) or manage billing (portal)
6. Stripe webhook updates billing state server-side

## Key scripts

- `scripts/start-all.bat` - start Stripe + backend + frontend
- `scripts/stop-all.bat` - stop local services

## Related docs

- `Frontend/README.md` - frontend-specific guide
- `Backend/README.md` - backend-specific guide
