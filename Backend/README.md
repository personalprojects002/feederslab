# Backend README (FastAPI)

This folder has the backend (server side) of the project.

Server side means:

- it talks to the database,
- it checks user access,
- it creates Stripe checkout sessions,
- it receives Stripe webhook events.

---

## 1) What this backend does

- Builds REST APIs using FastAPI.
- Stores and reads data from PostgreSQL.
- Handles board data and user access.
- Connects Stripe subscription flow.
- Verifies Stripe webhook events.

---

## 2) Folder map (important files)

- `main.py` → app entry point (server starts here)
- `src/routes/` → API route files
- `src/models/` → database models
- `src/services/` → business logic
- `src/config/` → environment and database config
- `scripts/run_backend.bat` → simple backend start helper
- `tests/` → backend tests

---

## 3) Prerequisites

Install these first:

- Python 3.12+
- PostgreSQL database

Optional but useful:

- Stripe CLI (for webhook testing)

---

## 4) Environment file (`Backend/.env`)

Create a file named `.env` inside this `Backend` folder.

Use this template:

```env
DATABASE_URL=postgresql://username:password@host:5432/db_name
TEST_DATABASE_URL=postgresql://username:password@host:5432/test_db_name

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

SB_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SB_PRODUCT_PRICE_ID=price_your_product_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Simple meaning:

- `DATABASE_URL` = main database connection string
- `TEST_DATABASE_URL` = test database connection string
- `BETTER_AUTH_SECRET` = secret used for auth token safety
- `SB_STRIPE_SECRET_KEY` = Stripe private key
- `SB_PRODUCT_PRICE_ID` = Stripe price id for subscription
- `STRIPE_WEBHOOK_SECRET` = secret to verify webhook requests

---

## 5) Install dependencies

From project root:

```powershell
cd Backend
python -m venv ..\.venv
..\.venv\Scripts\python -m pip install --upgrade pip
..\.venv\Scripts\python -m pip install fastapi uvicorn sqlmodel sqlalchemy python-dotenv pyjwt[crypto] python-multipart psycopg2-binary stripe pytest
```

---

## 6) Run backend

From project root:

```powershell
cd Backend
..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

After start:

- API base URL: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

---

## 7) Webhook test (local)

In a new terminal:

```powershell
stripe listen --forward-to http://localhost:8000/webhook/stripe
```

Copy the generated `whsec_...` value and set it in `STRIPE_WEBHOOK_SECRET`.

---

## 8) Run tests

From project root:

```powershell
cd Backend
..\.venv\Scripts\python -m pytest -q
```

---

## 9) Common issues and fixes

1. **Error: database connection failed**
   - Check `DATABASE_URL` in `.env`
   - Check PostgreSQL service is running

2. **Error: Stripe signature verification failed**
   - `STRIPE_WEBHOOK_SECRET` is wrong
   - Restart webhook listener and copy latest secret

3. **Error: module not found**
   - Dependencies are missing
   - Re-run install commands from step 5

---

## 10) Quick start (minimum commands)

```powershell
cd Backend
..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
