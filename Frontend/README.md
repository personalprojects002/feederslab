# Frontend README (Next.js)

This folder has the frontend (UI) of the project.

UI means what users see in browser:

- pages,
- forms,
- buttons,
- dashboard screens.

---

## 1) What this frontend does

- Shows auth pages (sign in / sign up).
- Calls backend APIs.
- Lets user start subscription checkout.
- Shows board-related screens.

---

## 2) Folder map (important files)

- `app/` → routes and pages
- `app/components/` → reusable UI components
- `lib/backend-api.ts` → API client for backend requests
- `lib/better-auth.ts` → auth server config
- `lib/auth-client.ts` → auth client config
- `public/` → static files (images etc.)

---

## 3) Prerequisites

Install first:

- Node.js 18+
- npm (comes with Node.js)

---

## 4) Environment file (`Frontend/.env.local`)

Create `.env.local` in this folder.

Use this template:

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

BETTER_AUTH_SECRET=your_minimum_32_character_secret_here

GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret

RESEND_KEY=re_your_resend_api_key
RESEND_FROM=noreply@yourdomain.com
```

Simple meaning:

- `NEXT_PUBLIC_BACKEND_API_URL` = backend base URL
- `NEXT_PUBLIC_BETTER_AUTH_URL` = frontend base URL
- `BETTER_AUTH_SECRET` = auth safety secret
- `GOOGLE_ID`, `GOOGLE_SECRET` = Google login keys
- `RESEND_KEY`, `RESEND_FROM` = email sender setup

---

## 5) Install dependencies

From project root:

```powershell
cd Frontend
npm install
```

---

## 6) Run frontend

From project root:

```powershell
cd Frontend
npm run dev
```

After start:

- App URL: `http://localhost:3000`

---

## 7) Build for production

```powershell
cd Frontend
npm run build
npm start
```

---

## 8) Common issues and fixes

1. **Port 3000 already in use**
   - Close old Node process
   - Or run on another port

2. **Google login fails**
   - Check `GOOGLE_ID` and `GOOGLE_SECRET`
   - Check callback URL in Google Console

3. **API call fails**
   - Check backend is running on `http://localhost:8000`
   - Check `NEXT_PUBLIC_BACKEND_API_URL`

---

## 9) Quick start (minimum commands)

```powershell
cd Frontend
npm install
npm run dev
```
