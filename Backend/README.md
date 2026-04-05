# Backend (FastAPI)

This folder contains the API and business logic for FeedersLab.

## What this backend does

- Exposes REST APIs for boards and billing
- Connects to PostgreSQL for persistent data
- Verifies user access with auth middleware
- Creates Stripe checkout sessions
- Creates Stripe billing portal sessions
- Handles Stripe webhook events

## Tech used in backend

- FastAPI
- SQLModel + SQLAlchemy
- PostgreSQL (`psycopg2-binary`)
- JWT (`pyjwt[crypto]`)
- Stripe Python SDK
- Python Dotenv
- Uvicorn
- Pytest

## Important files and folders

- `main.py` - FastAPI app entry
- `src/routes/` - API routes
- `src/models/` - data models
- `src/services/` - business/service layer
- `src/config/` - settings and database setup
- `src/middlewares/auth.py` - auth validation middleware
- `tests/` - backend tests

## Environment variables

Copy `Backend/.env.example` to `Backend/.env`, then fill values.

Required keys:

```env
DATABASE=PROD
BACKEND_PROD_DATABASE_URL=postgresql://username:password@host:5432/db_name?sslmode=require
BACKEND_TEST_DATABASE_URL=postgresql://username:password@host:5432/test_db_name?sslmode=require

CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PRODUCT_PRICE_ID=price_your_product_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

ACCESS_TOKEN_EXPIRY_SECONDS=1800
REFRESH_TOKEN_EXPIRY_DAYS=14
REFRESH_TOKEN_LEEWAY_SECONDS=30
REFRESH_COOKIE_NAME=feeders_refresh_token
REFRESH_COOKIE_SECURE=false
REFRESH_COOKIE_SAMESITE=lax
REFRESH_COOKIE_PATH=/
```

Meaning:

- `DATABASE`: selects PROD or TEST URL branch
- `BACKEND_PROD_DATABASE_URL` / `BACKEND_TEST_DATABASE_URL`: database connections
- `BETTER_AUTH_SECRET`: auth security secret
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PRODUCT_PRICE_ID`: Stripe recurring price id
- `STRIPE_WEBHOOK_SECRET`: webhook signature verification key

## Setup

From project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -e .\Backend
```

## Run backend

From project root:

```powershell
cd Backend
..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Backend URLs

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Local webhook test

In another terminal:

```powershell
stripe listen --events checkout.session.completed,customer.subscription.deleted --forward-to http://localhost:8000/webhook/stripe
```

Copy the generated `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## Run tests

From project root:

```powershell
cd Backend
..\.venv\Scripts\python -m pytest -q
```

## Common problems

1. DB connection error
   - verify `DATABASE_URL`
   - verify PostgreSQL is running

2. Stripe webhook verification failed
   - refresh Stripe CLI listener
   - update `STRIPE_WEBHOOK_SECRET`

3. Unauthorized API requests
   - confirm auth token/cookie is being sent from frontend

4. Stripe checkout/portal fails
   - verify `SB_STRIPE_SECRET_KEY` and `SB_PRODUCT_PRICE_ID`
