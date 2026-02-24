# 🎯 Stripe Integration Guide - Where to Find & Check Everything

## 📍 Part 1: Where These Fields Are Located

### **1. User Model** - Backend code file

**Location:** [Back/src/models/user.py](../Back/src/models/user.py#L32-L35)

```python
# Stripe subscription fields
customer_id: Optional[str] = Field(default=None, max_length=255, index=True)  # Stripe customer ID
has_access: bool = Field(default=False)  # Subscription active?
stripe_current_period_end: Optional[datetime] = Field(default=None)  # When subscription ends
```

---

### **2. Database Table** - PostgreSQL user table

**Table name:** `user`
**New columns added:**

- `customer_id` (VARCHAR, nullable) - Stores Stripe customer ID
- `has_access` (BOOLEAN, default False) - Tracks subscription status
- `stripe_current_period_end` (TIMESTAMP, nullable) - Subscription expiry date

---

### **3. Stripe Service** - Business logic

**Location:** [Back/src/services/stripe_service.py](../Back/src/services/stripe_service.py)

Methods that use these fields:

- `create_checkout_session()` - Creates checkout, generates customer_id
- `handle_checkout_completed()` - Sets `has_access=True`, stores `customer_id`
- `handle_subscription_deleted()` - Sets `has_access=False` when subscription cancelled
- `create_portal_session()` - Uses `customer_id` to show billing portal

---

### **4. Webhook Handler** - Listens to Stripe events

**Location:** [Back/src/routes/webhook.py](../Back/src/routes/webhook.py)

Listens for:

- `checkout.session.completed` → Updates has_access & customer_id
- `customer.subscription.deleted` → Revokes has_access

---

### **5. Environment Variables** - Configuration

**Location:** [Back/.env](../Back/.env)

```env
SB_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SB_PRODUCT_PRICE_ID=price_1SmtqzD0hfJWCvsZyDa8Ms9U
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_BILLING_PORTAL=https://billing.stripe.com/p/login/test_dRm8wO4eCc7z4mQ7zS9EI00
```

---

## ✅ Part 2: How to Check if Everything is Working

### **Check 1: Verify Database Columns Exist**

```sql
-- Run this in PostgreSQL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name='user'
AND column_name IN ('customer_id', 'has_access', 'stripe_current_period_end')
ORDER BY column_name;
```

**Expected output:**

```
column_name         | data_type                  | is_nullable
--------------------+----------------------------+----------
customer_id         | character varying(255)     | YES
has_access          | boolean                    | NO
stripe_current_period_end | timestamp without time zone | YES
```

---

### **Check 2: Verify Environment Variables are Loaded**

1. Start the backend: `python run_backend.bat` or `..\.venv\Scripts\activate` + `uvicorn main:app --reload`

2. In a Python terminal (with backend environment), run:

```python
from src.config.settings import STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET

print(f"✅ Secret Key: {STRIPE_SECRET_KEY[:20]}...")
print(f"✅ Price ID: {STRIPE_PRICE_ID}")
print(f"✅ Webhook Secret: {STRIPE_WEBHOOK_SECRET[:20]}...")
```

**Expected:** Should print the actual values from .env (not "default")

---

### **Check 3: Test User Creation (Check if fields are initialized)**

```bash
# Make a request to create a board (requires login first)
curl -X POST http://localhost:8000/boards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boardName": "Test Board"}'
```

Then check the database:

```sql
-- Check the user's Stripe fields
SELECT id, email, customer_id, has_access, stripe_current_period_end
FROM "user"
WHERE email = 'your-email@example.com';
```

**Expected:**

```
id   | email              | customer_id | has_access | stripe_current_period_end
-----|--------------------+-------------+------------+-----------------------
cuid | your@example.com   | NULL        | false      | NULL
```

---

### **Check 4: Test Checkout (Check if customer_id gets created)**

1. **On frontend:** Click "Subscribe" button
2. **Stripe redirects to checkout** - Complete the test payment using:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Any email

3. **Check database again:**

```sql
SELECT id, email, customer_id, has_access, stripe_current_period_end
FROM "user"
WHERE email = 'your-email@example.com';
```

**Expected after payment:**

```
id   | email              | customer_id      | has_access | stripe_current_period_end
-----|--------------------+------------------+------------+-----------------------
cuid | your@example.com   | cus_ABC123...    | true       | 2025-03-05 12:00:00
```

---

### **Check 5: Monitor Webhook Events (Check if webhook is receiving events)**

**Option A: Using Stripe Dashboard**

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your endpoint: `http://localhost:8000/webhook/stripe`
3. Scroll down to "Recent Events"
4. You should see: ✅ `checkout.session.completed`

**Option B: Check backend logs**
When you run your backend, look for logs like:

```
Webhook Event Received: checkout.session.completed
Customer ID: cus_ABC123...
User Updated: has_access=True
```

---

### **Check 6: Test Subscription Status (Check has_access flag)**

```python
from sqlmodel import Session, select
from src.models.user import User
from src.config.db import get_session

# Get a session
session = next(get_session())

# Find your user
user = session.exec(select(User).where(User.email == "your@example.com")).first()

print(f"🔐 Has Access: {user.has_access}")  # Should be True after payment
print(f"📅 Subscription Ends: {user.stripe_current_period_end}")
print(f"🏦 Stripe Customer ID: {user.customer_id}")
```

**Expected after successful payment:**

```
🔐 Has Access: True
📅 Subscription Ends: 2025-03-05 12:00:00
🏦 Stripe Customer ID: cus_ABC123...
```

---

## 🔄 Part 3: Complete Payment Flow

```
1. USER CLICKS "SUBSCRIBE" BUTTON
   ↓
2. FRONTEND CALLS: POST /billing/create-checkout
   ↓
3. BACKEND CREATES STRIPE CHECKOUT SESSION
   ↓
4. USER COMPLETES PAYMENT ON STRIPE
   ↓
5. STRIPE SENDS WEBHOOK: checkout.session.completed
   ↓
6. BACKEND WEBHOOK HANDLER:
   - Gets customer_id from webhook
   - Finds user by client_reference_id
   - Sets has_access = True
   - Stores customer_id
   - Saves to database
   ↓
7. USER NOW HAS ACCESS ✅
```

---

## 🚨 Part 4: Troubleshooting

| Issue                                    | What to Check          | Solution                                                                                          |
| ---------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| "No token found in session"              | Backend JWT handling   | Check auth middleware in [Back/src/middlewares/auth.py](../Back/src/middlewares/auth.py)          |
| Stripe API errors                        | Environment variables  | Verify .env has valid keys from Stripe Dashboard                                                  |
| Webhook not triggering                   | Webhook URL            | Check Stripe Dashboard → Webhooks → Endpoint URL should be `http://localhost:8000/webhook/stripe` |
| Payment works but has_access stays False | Webhook receiver       | Check backend logs for webhook errors                                                             |
| Customer_id is NULL                      | Checkout not completed | Make sure you completed the payment (not just started checkout)                                   |

---

## 📊 Environment Variables - What They Do

| Variable                | Purpose                                           | Where to Get                                              |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| `SB_STRIPE_SECRET_KEY`  | Allows backend to call Stripe API                 | Stripe Dashboard → Developers → API Keys → Secret key     |
| `SB_PRODUCT_PRICE_ID`   | Which subscription product/price to charge        | Stripe Dashboard → Products → Your Product → Price ID     |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook events actually came from Stripe | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `STRIPE_BILLING_PORTAL` | Portal URL for managing subscriptions             | https://billing.stripe.com/p/login/test_...               |

---

## 🎯 Production Checklist

When deploying to production, change these:

```env
# DEVELOPMENT (TEST MODE)
SB_STRIPE_SECRET_KEY=sk_test_...
SB_PRODUCT_PRICE_ID=price_test_...

# PRODUCTION (LIVE MODE)
SB_STRIPE_SECRET_KEY=sk_live_...
SB_PRODUCT_PRICE_ID=price_...  (regenerate from live products)
```

And update webhook URL in Stripe Dashboard:

```
From: http://localhost:8000/webhook/stripe
To: https://yourdomain.com/webhook/stripe
```

---

**Everything is now configured! 🚀**
