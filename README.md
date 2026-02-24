# Full Project README (Converter)

This is a full-stack project.

Full-stack means there are 2 parts:

- Frontend: what user sees in browser
- Backend: server that handles data, auth, and Stripe billing

You now have one clean README per major part:

- `Frontend/README.md`
- `Backend/README.md`

---

## 1) Project structure

- `Frontend/` → Next.js app
- `Backend/` → FastAPI app
- `scripts/` → one-click start and stop scripts for Windows

---

## 2) Before you start (software)

Install these tools:

- Node.js 18+ (includes npm)
- Python 3.12+
- Stripe CLI (only needed for webhook testing)

---

## 3) Environment files you must create

### A) Backend env file

Create: `Backend/.env`

```env
DATABASE_URL=postgresql://username:password@host:5432/db_name
TEST_DATABASE_URL=postgresql://username:password@host:5432/test_db_name

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

SB_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SB_PRODUCT_PRICE_ID=price_your_product_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### B) Frontend env file

Create: `Frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret

RESEND_KEY=re_your_resend_api_key
RESEND_FROM=noreply@yourdomain.com
```

---

## 4) One-command run (recommended)

Use this for daily local work on Windows.

From project root:

```powershell
.\scripts\start-all.bat
```

This starts:

- Stripe webhook listener
- Backend on `http://localhost:8000`
- Frontend on `http://localhost:3000`

To stop everything:

```powershell
.\scripts\stop-all.bat
```

---

## 5) Manual run (if needed)

### Start backend manually

```powershell
cd Backend
..\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start frontend manually

```powershell
cd Frontend
npm install
npm run dev
```

### Start webhook manually

```powershell
stripe listen --forward-to http://localhost:8000/webhook/stripe
```

---

## 6) URLs you will use

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend API docs: `http://localhost:8000/docs`

---

## 7) Step-by-step first run checklist

1. Create both env files exactly as shown above.
2. Install Node.js and Python.
3. Run `npm install` inside `Frontend` once.
4. Make sure Python environment exists in `.venv`.
5. Run `.\scripts\start-all.bat`.
6. Open `http://localhost:3000`.
7. Keep all service windows open while testing.

---

## 8) If something is not working

1. Check env variable values first.
2. Check backend is running on port `8000`.
3. Check frontend is running on port `3000`.
4. Check Stripe CLI is logged in (`stripe login`).
5. Run `.\scripts\stop-all.bat`, then start again.

---

## 9) Documentation policy (new clean structure)

To keep this project easy and clear:

- only one root `README.md`
- only one `Frontend/README.md`
- only one `Backend/README.md`

All extra old markdown guides were removed to avoid confusion.
