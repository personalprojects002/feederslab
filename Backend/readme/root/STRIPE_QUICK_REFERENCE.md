# ⚡ Stripe Quick Reference - 3 Fields You Need to Know

## 🎯 The 3 New Stripe Fields in User Model

| Field                         | Type     | Purpose                              | Example               |
| ----------------------------- | -------- | ------------------------------------ | --------------------- |
| **customer_id**               | String   | Stripe's unique ID for this customer | `cus_ABC123XYZ789`    |
| **has_access**                | Boolean  | Is user's subscription active?       | `True` or `False`     |
| **stripe_current_period_end** | DateTime | When does subscription end?          | `2025-03-05 12:00:00` |

---

## 📍 Files You Need to Know

### **3 Key Locations:**

1. **User Model** → `Back/src/models/user.py`
   - Defines the 3 fields
2. **Stripe Service** → `Back/src/services/stripe_service.py`
   - Updates these fields when payments happen
3. **Webhook** → `Back/src/routes/webhook.py`
   - Listens for Stripe events and updates the fields

---

## 🔄 What Happens When You Click "Subscribe"

```
Click Subscribe
    ↓
Backend creates Stripe checkout (customer_id gets created by Stripe)
    ↓
You pay on Stripe
    ↓
Stripe sends webhook to backend
    ↓
Webhook updates database:
  - customer_id = "cus_ABC..."
  - has_access = true
  - stripe_current_period_end = "2025-03-05"
    ↓
User now has access ✅
```

---

## ✅ 3 Things to Check if Something Breaks

### **1. Is the field in the database?**

```sql
SELECT customer_id, has_access FROM "user" WHERE email = 'your@example.com';
```

Should return a row with both fields visible.

### **2. Are Stripe keys in .env?**

Check [Back/.env](../Back/.env) has:

```
SB_STRIPE_SECRET_KEY=sk_test_...
SB_PRODUCT_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **3. Did the webhook receive the payment event?**

Check backend logs or Stripe Dashboard → Webhooks for `checkout.session.completed` event.

---

## 🎯 Summary

| When                      | What Happens            | Which Fields Update                                                         |
| ------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| User signs up             | Creates user in DB      | `customer_id=NULL`, `has_access=FALSE`                                      |
| User clicks Subscribe     | Creates Stripe checkout | (no DB changes yet)                                                         |
| User completes payment    | Stripe sends webhook    | `customer_id` + `has_access=TRUE` + `stripe_current_period_end` all updated |
| User cancels subscription | Stripe sends webhook    | `has_access=FALSE`                                                          |

---

**See STRIPE_SETUP_GUIDE.md for detailed explanations & checks** ✨
