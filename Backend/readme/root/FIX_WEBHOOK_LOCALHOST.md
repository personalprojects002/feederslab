# 🔧 How to Enable Stripe Webhooks on Localhost

## ❌ The Problem

When you complete a test payment on Stripe's checkout page, Stripe **cannot send webhooks to localhost** because:

- Localhost is not accessible from the internet
- Stripe's servers can't reach `http://localhost:8000`
- The webhook event is created but never delivered to your server

**Result:** Payment completes, but webhook never arrives → `customer_id` and `has_access` never get set ❌

---

## ✅ The Solution: Use Stripe CLI

Stripe provides the **Stripe CLI** - a tool that creates a tunnel from Stripe's servers to your localhost webhook endpoint.

### **Step 1: Download & Install Stripe CLI**

**Windows:**

1. Go to: https://github.com/stripe/stripe-cli/releases
2. Download: `stripe_X.X.X_windows_x86_64.zip` (latest version)
3. Extract the ZIP file
4. Rename `stripe.exe` to something easy (like `stripe.exe`)
5. Add to PATH or use full path

**Or use PowerShell (easier):**

```powershell
choco install stripe-cli
```

**Verify installation:**

```bash
stripe --version
# Should output: stripe version X.X.X
```

---

### **Step 2: Login to Stripe CLI**

```bash
stripe login
```

**What happens:**

1. Browser opens Stripe login
2. You login to your Stripe account
3. CLI gets permission to forward webhooks
4. Shows: ✅ `Done! The Stripe CLI is configured for your account.`

---

### **Step 3: Forward Webhooks to Localhost**

Run this command in a **separate terminal** (keep it running):

```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

**Expected output:**

```
> Ready! Your webhook signing secret is: whsec_test_ABC123...
> Forwarding to http://localhost:8000/webhook/stripe
```

**Important Notes:**

- This creates a tunnel from Stripe to your localhost
- Keep this terminal open while testing
- The signing secret shown here is temporary for this session

---

### **Step 4: Test the Payment**

Now test the payment:

1. **Terminal 1:** Keep Stripe CLI running (from Step 3)
2. **Terminal 2:** Start your backend:
   ```bash
   cd Back
   python run_backend.bat
   ```
3. **Browser:** Go to http://localhost:3000
4. **Click:** "Subscribe" button
5. **Pay:** With test card `4242 4242 4242 4242`

**What you'll see:**

**In Terminal 1 (Stripe CLI):**

```
2025-02-05 10:30:45 → event.created [evt_test_ABC123]
2025-02-05 10:30:45 → checkout.session.completed [cs_test_ABC123]
2025-02-05 10:30:45 → POST http://localhost:8000/webhook/stripe [200]
```

**In Terminal 2 (Backend):**

```
Webhook Event Received: checkout.session.completed
Customer ID: cus_ABC123XYZ789
User Updated Successfully: has_access=True
```

**In Database:**

```sql
SELECT customer_id, has_access FROM "user" WHERE email='your@example.com';
-- customer_id: cus_ABC123XYZ789
-- has_access: true
```

---

## 🔍 Verify It's Working

### **Check 1: Stripe CLI Shows Events**

Terminal 1 should show:

```
2025-02-05 10:30:45 → event.created [evt_test_ABC123]
2025-02-05 10:30:45 → checkout.session.completed [cs_test_ABC123]
2025-02-05 10:30:45 → POST http://localhost:8000/webhook/stripe [200] ✅
```

The `[200]` means webhook was successfully received!

### **Check 2: Backend Logs Show Success**

Terminal 2 should show something like:

```
INFO:     127.0.0.1:54321 - "POST /webhook/stripe HTTP/1.1" 200 OK
Webhook received: checkout.session.completed
Customer ID: cus_ABC123...
User Updated Successfully
```

### **Check 3: Database Updated**

```sql
SELECT customer_id, has_access, stripe_current_period_end
FROM "user"
WHERE email='your@example.com';

-- Should show:
-- customer_id: cus_ABC123...
-- has_access: true
-- stripe_current_period_end: 2025-03-05 12:00:00
```

---

## 🚀 Complete Testing Workflow

```bash
# Terminal 1: Start Stripe CLI (keep running)
stripe listen --forward-to localhost:8000/webhook/stripe
# Output: Ready! Your webhook signing secret is: whsec_test_ABC123...
# Output: Forwarding to http://localhost:8000/webhook/stripe

# Terminal 2: Start Backend
cd Back
python run_backend.bat
# Wait for: Uvicorn running on http://127.0.0.1:8000

# Terminal 3: Start Frontend (if needed)
cd Frontend
npm run dev
# Visit: http://localhost:3000

# Then:
# 1. Click "Subscribe" button
# 2. Complete payment with 4242 4242 4242 4242
# 3. Check Terminal 1 for webhook delivery
# 4. Check Terminal 2 for webhook processing
# 5. Check database for updated fields
```

---

## ⚠️ Important Notes

### **Webhook Signing Secret**

When you run:

```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

Stripe shows a temporary signing secret. This is **different** from your `.env` secret!

**Why?**

- Your `.env` has: `whsec_your_webhook_secret`
- CLI shows: `whsec_test_ABC123...` (temporary for this CLI session)

**Solution:** The CLI automatically uses the correct secret, so you don't need to change `.env`! ✅

### **Keep Terminal Open**

Stripe CLI must stay running while you're testing:

- If you close the CLI terminal → webhooks stop being forwarded
- If you restart CLI → you get a new tunnel URL and signing secret

---

## 🎯 Troubleshooting

### **Problem: Webhook shows [400] error**

```
[400] POST http://localhost:8000/webhook/stripe
```

**Fix:** Your webhook handler is returning an error.

**Check backend logs for:**

- `Invalid signature`
- `User not found`
- `Missing stripe-signature header`

See your backend terminal for details.

---

### **Problem: Webhook doesn't appear in CLI**

```
# Nothing shows in Stripe CLI
```

**Possible causes:**

1. CLI tunnel not created properly → Run `stripe listen` again
2. Event not sent → Check Stripe Dashboard → Events
3. Frontend URL wrong → Make sure button calls `/billing/create-checkout`

**Fix:** Restart everything:

```bash
# Kill Stripe CLI (Ctrl+C)
# Kill Backend (Ctrl+C)
# Start Stripe CLI again
# Start Backend again
# Try payment again
```

---

### **Problem: "signature verification failed"**

```
Invalid signature: unable to extract timestamp
```

**Cause:** Webhook signature header not being read correctly.

**Fix:** Check your webhook handler is receiving the header:

```python
# In webhook.py, add debug logging:
print(f"Signature header: {stripe_signature}")
print(f"Webhook secret: {STRIPE_WEBHOOK_SECRET}")
```

---

## 📋 Setup Checklist

- [ ] Downloaded Stripe CLI
- [ ] Installed Stripe CLI
- [ ] Ran `stripe login` (authorized)
- [ ] Running `stripe listen --forward-to localhost:8000/webhook/stripe`
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can click Subscribe button
- [ ] Test payment completes
- [ ] Stripe CLI shows webhook delivery
- [ ] Backend logs show webhook processing
- [ ] Database shows `customer_id` and `has_access=true`

---

## ✨ Once It's Working

After you verify webhooks work locally:

1. **Commit your code** with webhook handler
2. **Deploy to production** with live Stripe keys
3. **No more CLI needed** - Stripe will send webhooks directly to your production URL
4. **Customers' payments** will automatically grant access! ✅

---

## 🎓 Learning More

- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Event Types:** https://stripe.com/docs/api/events/types

---

**Now try the payment again with Stripe CLI running!** 🚀
