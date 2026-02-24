# API Routes - DEPRECATED

⚠️ **These API routes are no longer used and can be safely deleted.**

## What Changed

This application has been migrated from a monolithic Next.js architecture to a microservices architecture:

- **Before:** All API logic was in Next.js API routes (`/app/api/`)
- **After:** All API logic is now in the FastAPI backend (`Backend/src/routes/`)

## Current Status

### ✅ Still Active
- **`/api/better-auth/[...all]`** - Better Auth endpoints (required for authentication)
  - This MUST remain as it handles JWT token generation and user authentication

### ❌ Deprecated (Safe to Delete)
- **`/api/board`** - Board CRUD operations
  - ➡️ **Now:** `Backend/src/routes/boards.py` (FastAPI)
  
- **`/api/billing/create-checkout`** - Stripe checkout session
  - ➡️ **Now:** `Backend/src/routes/billing.py` (FastAPI)
  
- **`/api/billing/create-portal`** - Stripe customer portal
  - ➡️ **Now:** `Backend/src/routes/billing.py` (FastAPI)
  
- **`/api/webhook`** - Stripe webhook handler
  - ➡️ **Now:** `Backend/src/routes/webhook.py` (FastAPI)

## Migration Complete

All frontend components have been updated to call the FastAPI backend:

- `components/NewBoard.tsx` → Calls `backendApi.post("/boards")`
- `components/ButtonCheckout.tsx` → Calls `backendApi.post("/billing/create-checkout")`
- `components/ButtonPortal.tsx` → Calls `backendApi.post("/billing/create-portal")`
- `components/BoardList.tsx` → Calls `backendApi.get("/boards")`

## What to Do

You have two options:

### Option 1: Delete Deprecated Routes (Recommended)
```bash
# Keep only Better Auth
rm -rf app/api/board
rm -rf app/api/billing
rm -rf app/api/webhook
```

### Option 2: Keep for Reference
Leave them as-is for reference, but they won't be used by the application.

## Important Notes

- **DO NOT delete** `app/api/better-auth/` - This is required for authentication
- The frontend now uses `lib/backend-api.ts` to communicate with FastAPI
- All authentication is JWT-based (stateless)
- All business logic is in the Python backend

## Need Help?

- Frontend setup: `Frontend/SETUP.md`
- Backend setup: `Backend/SETUP.md`
- Architecture overview: `README.md`
- Testing guide: `TESTING_GUIDE.md`
