# Authentication Test Guide

## Changes Made

### 1. Better Auth Server Configuration (`lib/better-auth.ts`)

- ✅ Added JWT plugin to server-side Better Auth config
- Now matches the client-side JWT plugin configuration

### 2. Backend API Token Handling (`lib/backend-api.ts`)

- ✅ Simplified token extraction using `authClient.getToken()`
- ✅ Better error logging with emojis for easy debugging
- ✅ Cleaner token attachment to requests

### 3. Backend JWT Verification (`Back/src/utils/jwt.py`)

- ✅ Added support for multiple JWT payload structures
- ✅ Added detailed logging of payload structure for debugging
- ✅ Better error messages

### 4. Backend Auth Middleware (`Back/src/middlewares/auth.py`)

- ✅ Added detailed logging for token verification steps
- ✅ Shows exactly which user is authenticated

## How to Test

### Step 1: Restart Both Servers

**Terminal 1 - Backend:**

```bash
cd Back
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**

```bash
cd Frontend
npm run dev
```

### Step 2: Sign In

1. Go to `http://localhost:3000`
2. Sign in with Google or Magic Link
3. Check browser console for:
   - `✅ JWT token attached to request`
   - `✅ Session found for: your@email.com`

### Step 3: Create a Board

1. On dashboard, enter a board name (e.g., "Test Board")
2. Click "Create Board"
3. Check browser console for successful token attachment
4. Check backend terminal for:
   - `✅ Token verified successfully for user`
   - `✅ Authenticated user: your@email.com`

### Step 4: Verify Board List

1. Board should appear in the list immediately
2. No 401 errors in console
3. Backend logs show successful authentication

## Debugging

If you still see errors:

1. **Check Browser Console** - Look for token attachment logs
2. **Check Backend Terminal** - Look for JWT payload structure
3. **Verify .env files** - Ensure `BETTER_AUTH_SECRET` matches in both:
   - `Frontend/.env.local`
   - `Back/.env`

Current secrets (both should match):

```
BETTER_AUTH_SECRET=aac1xuBhw3lpDlYhLweZopVwKwAqjQew
```

## Expected Flow

```
User Sign In
    ↓
Better Auth creates JWT token
    ↓
Frontend stores token
    ↓
User creates board
    ↓
backend-api.ts attaches JWT to request
    ↓
Backend auth middleware verifies JWT
    ↓
Backend extracts user email
    ↓
Board created successfully
    ↓
BoardList refreshes and shows new board
```

## Common Issues

### "Unauthorized - token may be expired"

- **Cause**: JWT plugin not enabled on server
- **Fix**: ✅ Already fixed by adding `jwt()` plugin

### "Email not found in token payload"

- **Cause**: Token structure mismatch
- **Fix**: ✅ Already fixed by checking multiple payload structures

### "No JWT token found"

- **Cause**: User needs to sign in again
- **Fix**: Sign out and sign in again to get fresh token
