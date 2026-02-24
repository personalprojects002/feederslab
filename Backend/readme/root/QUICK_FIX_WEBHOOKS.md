# ⚡ Quick Fix: Enable Webhooks on Localhost

## 🎯 The Issue

You complete payment → Thank you page shows → But webhook never arrives → `customer_id` stays NULL

## ✅ The Fix (3 Steps)

### **Step 1: Install Stripe CLI**

**Windows PowerShell:**

```powershell
choco install stripe-cli
```

**Or manually:**

1. Download: https://github.com/stripe/stripe-cli/releases
2. Extract `stripe.exe` to a folder
3. Add folder to PATH
4. Or just use full path: `C:\path\to\stripe.exe`

**Verify:**

```bash
stripe --version
```

---

### **Step 2: Login to Stripe**

```bash
stripe login
```

Browser opens, login to your Stripe account, approve access.

---

### **Step 3: Run Stripe CLI (Keep Running!)**

**Open a NEW terminal and run this:**

```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

**Expected output:**

```
> Ready! Your webhook signing secret is: whsec_test_ABC123...
> Forwarding to http://localhost:8000/webhook/stripe
```

**⚠️ IMPORTANT:** Keep this terminal open!

---

## 🧪 Now Test

**Terminal 1:** Keep Stripe CLI running (from Step 3) ✅

**Terminal 2:** Start backend

```bash
cd Back
python run_backend.bat
```

**Browser:** Go to http://localhost:3000

**Click:** Subscribe → Pay with `4242 4242 4242 4242`

---

## 📊 What You'll See

### **Terminal 1 (Stripe CLI):**

```
> event.created [evt_test_ABC123]
> checkout.session.completed [cs_test_ABC123]
> POST http://localhost:8000/webhook/stripe [200] ✅
```

### **Terminal 2 (Backend):**

```
============================================================
🔔 WEBHOOK RECEIVED
============================================================
📍 Signature header received: whsec_fbc6165a6...
🔐 Verifying webhook signature...
✅ Signature verified successfully!
📌 Event Type: checkout.session.completed
📦 Event Data: {...}

💳 Processing checkout.session.completed...
✅ Checkout completed successfully!
   Customer ID: cus_ABC123XY789Z
   User ID: cuid_ABC123...

============================================================
✅ WEBHOOK PROCESSED SUCCESSFULLY
============================================================
```

### **Database:**

```sql
SELECT customer_id, has_access FROM "user" WHERE email='your@example.com';
-- customer_id: cus_ABC123XY789Z  ✅
-- has_access: true               ✅
```

---

## 🎉 That's It!

Now every time you:

1. Click Subscribe
2. Complete payment
3. Webhook automatically gets sent to your localhost ✅
4. Database gets updated ✅
5. User has access ✅

---

## 🚀 When You Deploy to Production

**No Stripe CLI needed!** Stripe will send webhooks directly to your production URL.

Just update `.env`:

```
SB_STRIPE_SECRET_KEY=sk_live_...
```

---

## ❓ FAQ

**Q: Do I need to keep the CLI running?**
A: Yes, keep it running while testing locally.

**Q: Can I close the CLI?**
A: Yes, but then webhooks won't be sent to localhost.

**Q: Will my .env secret change?**
A: No, keep your `.env` secret. CLI uses it automatically.

**Q: What if I restart?**
A: Just run `stripe listen --forward-to localhost:8000/webhook/stripe` again.

---

**See [FIX_WEBHOOK_LOCALHOST.md](FIX_WEBHOOK_LOCALHOST.md) for detailed troubleshooting!**
