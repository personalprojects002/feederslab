# 🔍 How to Verify Stripe Integration is Working

## Step-by-Step Verification

### **STEP 1: Verify Environment Variables are Loaded** ✅

**Run this command in your Back folder:**

```bash
cd Back
python -c "from src.config.settings import STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET; print(f'Secret: {STRIPE_SECRET_KEY[:20]}...'); print(f'Price: {STRIPE_PRICE_ID}'); print(f'Webhook: {STRIPE_WEBHOOK_SECRET[:20]}...')"
```

**Expected output:**

```
Secret: sk_test_51SmtRyD0h...
Price: price_1SmtqzD0hfJWCvsZyDa8Ms9U
Webhook: whsec_fbc6165a653ace...
```

---

### **STEP 2: Verify Database Columns Exist** ✅

**Run this SQL in your PostgreSQL:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name='user'
AND column_name IN ('customer_id', 'has_access', 'stripe_current_period_end')
ORDER BY column_name;
```

**Expected output:**

```
      column_name      |         data_type          | is_nullable
----------------------+----------------------------+----------
customer_id           | character varying(255)     | YES
has_access            | boolean                    | NO
stripe_current_period_end | timestamp without time zone | YES
```

**If you see these 3 rows → ✅ Columns exist!**

---

### **STEP 3: Verify User Model Has Fields** ✅

**Check the file:** [Back/src/models/user.py](Back/src/models/user.py#L32-L35)

You should see:

```python
# Stripe subscription fields
customer_id: Optional[str] = Field(default=None, max_length=255, index=True)
has_access: bool = Field(default=False)
stripe_current_period_end: Optional[datetime] = Field(default=None)
```

**✅ If you see these 3 lines → Fields are in model!**

---

### **STEP 4: Verify Existing User Has Blank Stripe Fields** ✅

**Run this SQL (replace email with yours):**

```sql
SELECT
    id,
    email,
    customer_id,
    has_access,
    stripe_current_period_end
FROM "user"
WHERE email = 'your-email@example.com'
LIMIT 1;
```

**Expected output (new user, not subscribed):**

```
              id              |       email        | customer_id | has_access | stripe_current_period_end
-------------------------------+--------------------+-------------+------------+-----------------------
cuid_abc123def456             | your@example.com   | NULL        | false      | NULL
```

**✅ If customer_id is NULL and has_access is false → Correct!**

---

## 🧪 Full Payment Test

### **STEP 5: Start Backend and Make a Payment** ✅

**1. Start your backend:**

```bash
cd Back
python run_backend.bat
```

**Wait for:** `Uvicorn running on http://127.0.0.1:8000`

**2. Open frontend:** http://localhost:3000

**3. Make sure you're logged in**, then click "Subscribe"

**4. On Stripe checkout page, use this test card:**

```
Card Number:  4242 4242 4242 4242
Expiry:       12/25
CVC:          123
Name:         Any Name
```

**5. Click "Pay" and wait for success page**

---

### **STEP 6: Verify Database Was Updated** ✅

**Run the same SQL query again:**

```sql
SELECT
    id,
    email,
    customer_id,
    has_access,
    stripe_current_period_end
FROM "user"
WHERE email = 'your-email@example.com'
LIMIT 1;
```

**Expected output (AFTER payment):**

```
              id              |       email        |    customer_id    | has_access |    stripe_current_period_end
-------------------------------+--------------------+-------------------+------------+---------------------------
cuid_abc123def456             | your@example.com   | cus_ABC123XY789Z  | true       | 2025-03-05 12:00:00
```

**✅ If you see these changes → Payment worked!**

| Field                     | Before Payment | After Payment       |
| ------------------------- | -------------- | ------------------- |
| customer_id               | NULL           | cus_ABC123...       |
| has_access                | false          | true                |
| stripe_current_period_end | NULL           | 2025-03-05 12:00:00 |

---

## 🔍 Checking Backend Logs

### **STEP 7: Verify Webhook Was Received** ✅

**In your backend terminal, look for logs like:**

```
INFO:     127.0.0.1:54321 - "POST /webhook/stripe HTTP/1.1" 200 OK
Webhook Event: checkout.session.completed
Customer ID: cus_ABC123XY789Z
User Updated Successfully
```

**Or similar success messages → ✅ Webhook worked!**

---

## 🎯 Stripe Dashboard Verification

### **STEP 8: Check Stripe Dashboard for Events** ✅

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find your endpoint: `http://localhost:8000/webhook/stripe`
3. Click on it
4. Scroll to "Recent Events"
5. Look for: **✅ checkout.session.completed**

**If you see a green checkmark → Webhook delivered successfully!**

---

## 💾 Summary of What Gets Updated

### **When user completes payment:**

```
BEFORE PAYMENT:
customer_id = NULL
has_access = false
stripe_current_period_end = NULL

AFTER PAYMENT:
customer_id = "cus_ABC123..."     ← Stripe's customer ID
has_access = true                  ← User has access now!
stripe_current_period_end = "2025-03-05 12:00:00"  ← When renews
```

---

## ❌ Troubleshooting

### **Problem: Stripe checkout doesn't load**

**Check:**

1. Backend is running
2. `.env` has valid `SB_STRIPE_SECRET_KEY`
3. `.env` has valid `SB_PRODUCT_PRICE_ID`
4. Network tab shows `/billing/create-checkout` returns `url`

---

### **Problem: Payment works but database not updated**

**Check:**

1. Backend logs for webhook errors
2. `.env` has valid `STRIPE_WEBHOOK_SECRET`
3. Stripe Dashboard → Webhooks shows event received
4. Run: `SELECT * FROM "user" WHERE email = 'your@example.com';`

---

### **Problem: "No token found" error**

**Check:**

1. You're logged in (Better Auth session exists)
2. `Authorization: Bearer` header is being sent
3. See [auth.py](Back/src/middlewares/auth.py) for details

---

## 📊 Data Flow Verification

```
✅ USER SIGNS UP
   → id created
   → email created
   → customer_id = NULL ✓

✅ USER CLICKS SUBSCRIBE
   → Calls /billing/create-checkout
   → Creates Stripe checkout session
   → Redirects to Stripe

✅ USER PAYS ON STRIPE
   → Enters card info
   → Completes payment
   → Stripe sends webhook

✅ WEBHOOK RECEIVED BY BACKEND
   → Webhook verified (signature checked)
   → Event: checkout.session.completed
   → Calls handle_checkout_completed()

✅ DATABASE UPDATED
   → customer_id saved from Stripe
   → has_access set to TRUE
   → stripe_current_period_end set

✅ USER HAS ACCESS NOW!
```

---

## ✅ Final Checklist

- [ ] Backend is running
- [ ] `.env` has 4 Stripe variables (not empty)
- [ ] Database columns exist (verified in SQL)
- [ ] User model has 3 Stripe fields
- [ ] Existing user has NULL customer_id (before payment)
- [ ] Can click Subscribe button (doesn't error)
- [ ] Stripe checkout page loads
- [ ] Can complete payment with test card
- [ ] Database updated with customer_id after payment
- [ ] Webhook event appears in Stripe Dashboard

**If all ✅ → Everything is working!** 🎉

---

## 📚 Need Help?

- **Quick overview:** [STRIPE_QUICK_REFERENCE.md](STRIPE_QUICK_REFERENCE.md)
- **Detailed guide:** [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)
- **Visual summary:** [STRIPE_AT_A_GLANCE.md](STRIPE_AT_A_GLANCE.md)
- **See code:** [stripe_service.py](Back/src/services/stripe_service.py)
