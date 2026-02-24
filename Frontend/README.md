# Frontend (Next.js)

This folder contains the client application for FeedersLab.

## What this frontend does

- Renders landing page and pricing
- Handles sign-in (magic link + Google)
- Shows user dashboard and board pages
- Calls backend APIs for boards and billing
- Starts checkout or billing portal flows

## Tech used in frontend

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + DaisyUI
- Better Auth + `@better-auth/client`
- Axios
- React Hot Toast

## Important folders and files

- `app/` - routes and pages
- `app/components/` - reusable UI components
- `app/dashboard/` - private authenticated screens
- `app/sign-in/` - authentication page
- `lib/backend-api.ts` - axios client for backend
- `lib/auth-client.ts` - Better Auth client usage
- `lib/better-auth.ts` - Better Auth server config

## Environment variables

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

Meaning:

- `NEXT_PUBLIC_BACKEND_API_URL`: backend base URL
- `NEXT_PUBLIC_BETTER_AUTH_URL`: frontend app URL
- `BETTER_AUTH_SECRET`: auth signing secret
- `GOOGLE_ID` / `GOOGLE_SECRET`: Google OAuth credentials
- `RESEND_KEY` / `RESEND_FROM`: email delivery credentials

## Commands

Install dependencies:

```powershell
cd Frontend
npm install
```

Run development server:

```powershell
npm run dev
```

Run lint:

```powershell
npm run lint
```

Production build:

```powershell
npm run build
npm start
```

## Local URL

- `http://localhost:3000`

## Frontend runtime requirements

- Backend must run on `http://localhost:8000`
- Stripe checkout relies on backend billing endpoints
- Magic-link email requires valid Resend credentials

## Common problems

1. Port 3000 busy
   - close previous Next.js process and rerun

2. Sign-in email not received
   - verify `RESEND_KEY` and `RESEND_FROM`
   - check spam folder and sender domain setup

3. Google login error
   - verify OAuth credentials and callback settings

4. API request errors
   - verify backend is running and `NEXT_PUBLIC_BACKEND_API_URL` is correct
