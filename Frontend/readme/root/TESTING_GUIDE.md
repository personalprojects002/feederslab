# Complete System Testing Guide

This guide walks you through testing the entire system from authentication to payments.

## 🎯 Prerequisites

Before testing, ensure you have:

- ✅ Frontend running on `http://localhost:3000`
- ✅ Backend running on `http://localhost:8000`
- ✅ PostgreSQL database (Neon) accessible
- ✅ Both `.env` files configured correctly
- ✅ Stripe test mode enabled
- ✅ All dependencies installed

---

## 📋 Testing Checklist

### Phase 1: Environment Setup ✓

#### Frontend Environment Variables
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32-char-secret>
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_ID=...
GOOGLE_SECRET=...
RESEND_KEY=...
RESEND_FROM=...
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

#### Backend Environment Variables
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<same-as-frontend>
SB_STRIPE_SECRET_KEY=sk_test_...
SB_PRODUCT_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Critical Verification:**
```bash
# Frontend
cd Frontend
echo $BETTER_AUTH_SECRET  # Or check .env.local

# Backend
cd Backend
echo $BETTER_AUTH_SECRET  # Or check .env

# THESE MUST MATCH EXACTLY!
```

---

### Phase 2: Start Services ✓

#### 1. Start Backend (Terminal 1)
```bash
cd Backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
Creating Tables ...
INFO:     Application startup complete.
```

**Verify:**
- Visit: http://localhost:8000/docs
- Should see FastAPI Swagger UI with endpoints:
  - `/boards` (POST, GET, GET/{id}, PATCH/{id}, DELETE/{id})
  - `/billing/create-checkout` (POST)
  - `/billing/create-portal` (POST)
  - `/webhook/stripe` (POST)

#### 2. Start Frontend (Terminal 2)
```bash
cd Frontend
npm install  # First time only
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

**Verify:**
- Visit: http://localhost:3000
- Should see your app's homepage

#### 3. Start Stripe Webhook Listener (Terminal 3)
```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

**Expected Output:**
```
Ready! You are using Stripe API Version [2025-12-15]. Your webhook signing secret is whsec_... (^C to quit)
```

**Copy the webhook secret (`whsec_...`) and add it to Backend `.env` as `STRIPE_WEBHOOK_SECRET`**

---

### Phase 3: Authentication Testing ✓

#### Test 1: Sign Up / Sign In

**Steps:**
1. Go to: http://localhost:3000/sign-in
2. Choose one of:
   - **Google Sign-In**: Click "Continue with Google"
   - **Magic Link**: Enter email → Check inbox → Click link

**Expected Result:**
- Redirected to `/dashboard`
- User session created in PostgreSQL `session` table
- User record created in PostgreSQL `user` table

**Verify in Database:**
```sql
-- Check user was created
SELECT id, name, email, has_access, customer_id FROM "user";

-- Expected: New user with has_access = false, customer_id = null
```

**Browser DevTools Check:**
1. Open DevTools → Application → Cookies
2. Look for Better Auth session cookie
3. Should contain session token

---

#### Test 2: JWT Token Generation

**Steps:**
1. After login, open DevTools → Console
2. Run this code:
```javascript
// Get session from Better Auth
const session = await authClient.getSession();
console.log('Session:', session);
console.log('JWT Token:', session.data.token);
```

**Expected Result:**
```javascript
{
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: "1",
      email: "user@example.com",
      name: "Friend"
    }
  }
}
```

**Verify JWT Token:**
1. Copy the token value
2. Go to: https://jwt.io
3. Paste token in "Encoded" section
4. Verify payload contains:
   - `email`
   - `userId` or `sub`
   - `exp` (expiration timestamp)

---

#### Test 3: Backend JWT Verification

**Steps:**
1. Copy JWT token from previous test
2. Test backend authentication using curl:

```bash
# Replace <TOKEN> with your actual JWT token
curl -X GET "http://localhost:8000/boards" \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected Result (Success):**
```json
[]  // Empty array (no boards yet)
```

**Expected Result (Failed - No Token):**
```bash
curl -X GET "http://localhost:8000/boards"
```
```json
{
  "detail": "Not Authorized"
}
```

**Expected Result (Failed - Invalid Token):**
```bash
curl -X GET "http://localhost:8000/boards" \
  -H "Authorization: Bearer invalid_token"
```
```json
{
  "detail": "Invalid token"
}
```

---

### Phase 4: Board Creation Testing (Without Subscription) ✓

#### Test 4: Try Creating Board Without Subscription

**Steps:**
1. Stay logged in at `/dashboard`
2. Enter a board name (e.g., "My First Board")
3. Click "Create Board"

**Expected Result:**
- ❌ Error toast: "Please Subscribe First"
- No board created
- User still has `has_access = false` in database

**Verify in Database:**
```sql
SELECT id, email, has_access FROM "user";
-- has_access should be false
```

**Backend Logs:**
```
INFO: 127.0.0.1:... - "POST /boards HTTP/1.1" 403 Forbidden
```

---

### Phase 5: Stripe Payment Testing ✓

#### Test 5: Subscribe Flow

**Steps:**
1. At `/dashboard`, click "Subscribe" button
2. Wait for redirect to Stripe Checkout

**Expected Result:**
- Frontend calls: `POST /billing/create-checkout`
- Backend creates Stripe session
- Redirect to Stripe Checkout page
- URL starts with: `https://checkout.stripe.com/c/pay/...`

**Stripe Checkout Page:**
- Product name displayed
- Price displayed
- Email pre-filled
- Test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Complete Payment:**
1. Fill in test card details
2. Click "Subscribe"
3. Wait for redirect back to `/dashboard/success`

---

#### Test 6: Webhook Processing

**Expected in Terminal 3 (Stripe CLI):**
```
2024-01-15 10:30:45   --> checkout.session.completed [evt_...]
2024-01-15 10:30:45  <--  [200] POST http://localhost:8000/webhook/stripe [evt_...]
```

**Backend Logs:**
```
INFO: Webhook received: checkout.session.completed
INFO: User access granted for user_id: 1
INFO: 127.0.0.1:... - "POST /webhook/stripe HTTP/1.1" 200 OK
```

**Verify in Database:**
```sql
SELECT id, email, has_access, customer_id FROM "user";

-- Expected:
-- id | email            | has_access | customer_id
-- 1  | user@example.com | true       | cus_...
```

**Frontend:**
- Refresh `/dashboard` page
- "Subscribe" button should change to "Billing" button

---

### Phase 6: Board Creation Testing (With Subscription) ✓

#### Test 7: Create Board After Subscription

**Steps:**
1. At `/dashboard`, enter board name: "My Awesome Board"
2. Click "Create Board"

**Expected Result:**
- ✅ Success toast: "Board Created"
- Board appears in list below
- Page refreshes automatically

**Backend Logs:**
```
INFO: 127.0.0.1:... - "POST /boards HTTP/1.1" 201 Created
```

**Verify in Database:**
```sql
SELECT * FROM board;

-- Expected:
-- id | board_name        | user_id | created_at | updated_at
-- 1  | My Awesome Board  | 1       | 2024-...   | 2024-...
```

---

#### Test 8: Create Multiple Boards

**Steps:**
1. Create 3 more boards with different names
2. Verify all appear in dashboard list

**Expected Result:**
- All boards displayed
- Each board is clickable
- Board count updates: "Total Boards: 4"

---

### Phase 7: Customer Portal Testing ✓

#### Test 9: Manage Subscription

**Steps:**
1. At `/dashboard`, click "Billing" button
2. Wait for redirect to Stripe Customer Portal

**Expected Result:**
- Frontend calls: `POST /billing/create-portal`
- Backend creates portal session
- Redirect to: `https://billing.stripe.com/p/session/...`

**Customer Portal:**
- Subscription details displayed
- Can update payment method
- Can cancel subscription
- Can view invoices

**Cancel Subscription:**
1. Click "Cancel subscription"
2. Confirm cancellation
3. Wait for cancellation

---

#### Test 10: Subscription Cancellation Webhook

**Expected in Terminal 3 (Stripe CLI):**
```
2024-01-15 10:35:00   --> customer.subscription.deleted [evt_...]
2024-01-15 10:35:00  <--  [200] POST http://localhost:8000/webhook/stripe [evt_...]
```

**Backend Logs:**
```
INFO: Webhook received: customer.subscription.deleted
INFO: User access revoked for customer_id: cus_...
INFO: 127.0.0.1:... - "POST /webhook/stripe HTTP/1.1" 200 OK
```

**Verify in Database:**
```sql
SELECT id, email, has_access, customer_id FROM "user";

-- Expected:
-- id | email            | has_access | customer_id
-- 1  | user@example.com | false      | cus_...
```

**Frontend:**
- Refresh `/dashboard`
- "Billing" button should change back to "Subscribe"
- Existing boards still visible (not deleted)
- Try creating new board → "Please Subscribe First" error

---

### Phase 8: End-to-End Testing ✓

#### Test 11: Complete User Journey

**Steps:**
1. Log out (if logged in)
2. Sign in with NEW email address
3. Verify no subscription (Subscribe button visible)
4. Try creating board → Error
5. Click Subscribe
6. Complete payment with test card
7. Verify webhook received
8. Create 3 boards
9. Verify all boards appear
10. Click Billing
11. Cancel subscription in portal
12. Verify webhook received
13. Try creating new board → Error
14. Verify existing boards still accessible

**All steps should work exactly as described above.**

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid token" Error

**Symptoms:**
- Backend returns 401 Unauthorized
- Error: "Invalid token"

**Solutions:**
1. Verify `BETTER_AUTH_SECRET` matches in both .env files
2. Check token is being sent from frontend
3. Verify token hasn't expired (check `exp` field in jwt.io)
4. Clear browser cookies and login again

---

### Issue 2: "Not Authorized" Error

**Symptoms:**
- Backend returns 401
- Error: "Not Authorized"

**Solutions:**
1. Check user is logged in
2. Verify JWT token exists in browser
3. Check Authorization header is being sent:
   ```javascript
   // In browser DevTools Network tab
   // Look for request headers
   Authorization: Bearer eyJhbG...
   ```

---

### Issue 3: Board Creation Fails

**Symptoms:**
- Error: "Please Subscribe First"
- User has paid but still can't create boards

**Solutions:**
1. Check webhook was received:
   ```bash
   # In Stripe CLI terminal
   # Should see: checkout.session.completed
   ```
2. Verify database:
   ```sql
   SELECT has_access FROM "user" WHERE email = 'your@email.com';
   -- Should be: true
   ```
3. Refresh frontend page
4. Re-login if needed

---

### Issue 4: Webhook Not Working

**Symptoms:**
- Payment completes but `has_access` stays false
- No logs in Stripe CLI

**Solutions:**
1. Verify Stripe CLI is running
2. Check webhook secret in Backend `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Restart backend after changing .env
4. Test webhook manually:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

### Issue 5: CORS Errors

**Symptoms:**
- Browser console shows CORS error
- Network requests blocked

**Solutions:**
1. Verify backend CORS settings in `main.py`:
   ```python
   allow_origins=["http://localhost:3000"]
   ```
2. Check frontend is running on port 3000
3. Restart backend after changes

---

### Issue 6: Database Connection Failed

**Symptoms:**
- Backend won't start
- Error: "could not connect to server"

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check Neon PostgreSQL is running
3. Test connection:
   ```bash
   psql $DATABASE_URL
   ```
4. Ensure `sslmode=require` in connection string

---

## 📊 Testing Checklist Summary

Use this checklist to verify everything works:

### Authentication
- [ ] User can sign up with Google OAuth
- [ ] User can sign in with Magic Link
- [ ] JWT token is generated after login
- [ ] JWT token contains correct user data
- [ ] Backend verifies JWT correctly
- [ ] Invalid tokens are rejected

### Subscription Flow
- [ ] Subscribe button appears for new users
- [ ] Clicking Subscribe redirects to Stripe
- [ ] Test card payment works
- [ ] Webhook fires after payment
- [ ] `has_access` becomes true in database
- [ ] Subscribe button changes to Billing button

### Board Management
- [ ] Cannot create board without subscription
- [ ] Can create board after subscription
- [ ] Multiple boards can be created
- [ ] Boards appear in dashboard list
- [ ] Board count updates correctly

### Cancellation Flow
- [ ] Billing button opens customer portal
- [ ] Can cancel subscription in portal
- [ ] Webhook fires after cancellation
- [ ] `has_access` becomes false in database
- [ ] Cannot create new boards after cancellation
- [ ] Existing boards remain accessible
- [ ] Billing button changes to Subscribe button

### Error Handling
- [ ] Proper error messages shown
- [ ] Toast notifications work
- [ ] 401 errors handled gracefully
- [ ] 403 errors show subscription required
- [ ] Network errors caught and displayed

---

## 🚀 Production Testing Checklist

Before deploying to production:

### Environment
- [ ] Production DATABASE_URL configured
- [ ] Production Stripe keys (sk_live_...) configured
- [ ] Production webhook endpoint configured
- [ ] BETTER_AUTH_SECRET is strong (32+ chars)
- [ ] CORS origins set to production domains
- [ ] HTTPS enabled on all endpoints

### Stripe Configuration
- [ ] Live mode enabled in Stripe Dashboard
- [ ] Webhook endpoint added: `https://api.yourdomain.com/webhook/stripe`
- [ ] Webhook events selected:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.deleted
- [ ] Webhook secret copied to production .env
- [ ] Test subscription in live mode
- [ ] Test cancellation in live mode

### Security
- [ ] .env files not committed to Git
- [ ] Secrets stored in hosting platform
- [ ] JWT tokens expire correctly
- [ ] Webhook signatures verified
- [ ] User inputs validated
- [ ] Rate limiting configured (optional)

---

## 📝 Manual Testing Script

Run this script to quickly test the entire system:

```bash
#!/bin/bash

echo "=== System Testing Script ==="

# 1. Test Backend Health
echo "\n1. Testing Backend..."
curl http://localhost:8000/docs > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is NOT running"
  exit 1
fi

# 2. Test Frontend Health
echo "\n2. Testing Frontend..."
curl http://localhost:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Frontend is running"
else
  echo "❌ Frontend is NOT running"
  exit 1
fi

# 3. Test Backend Auth (Should Fail - No Token)
echo "\n3. Testing Backend Auth..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/boards)
if [ "$RESPONSE" -eq 401 ]; then
  echo "✅ Auth protection working"
else
  echo "❌ Auth protection NOT working (expected 401, got $RESPONSE)"
fi

echo "\n=== All automated tests passed! ==="
echo "Now test manually:"
echo "1. Sign in at http://localhost:3000/sign-in"
echo "2. Try creating a board (should fail)"
echo "3. Subscribe via Stripe"
echo "4. Create a board (should succeed)"
echo "5. Cancel subscription"
echo "6. Try creating board again (should fail)"
```

---

## 🎓 Understanding the System

### Data Flow Diagram

```
User Login
    ↓
Better Auth (Frontend)
    ↓
Generate JWT Token
    ↓
Store in Browser
    ↓
User Clicks "Create Board"
    ↓
Frontend: backendApi.post("/boards")
    ↓
Add Header: Authorization: Bearer <JWT>
    ↓
Backend: Verify JWT → Extract Email
    ↓
Query Database: SELECT * FROM user WHERE email = ?
    ↓
Check: user.has_access == true?
    ↓
Yes: Create Board → Return Success
No: Return Error "Please Subscribe First"
```

### Payment Flow Diagram

```
User Clicks "Subscribe"
    ↓
Frontend: POST /billing/create-checkout
    ↓
Backend: Create Stripe Session
    ↓
Return Checkout URL
    ↓
Redirect to Stripe
    ↓
User Enters Card → Pay
    ↓
Stripe: Send Webhook to Backend
    ↓
Backend: Verify Signature
    ↓
Update: user.has_access = true
    ↓
Save to Database
    ↓
User Redirected to /dashboard/success
    ↓
Can Now Create Boards
```

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check Backend logs for errors
2. Check Frontend browser console
3. Check Stripe CLI logs
4. Verify database state with SQL queries
5. Review environment variables
6. Restart all services

**Happy Testing! 🚀**