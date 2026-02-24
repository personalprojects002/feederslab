# 🚀 Quick Start - Run Everything in One Go

## Option 1: Automated (Recommended) ✅

### **Step 1: Double-click the startup script**

In the root folder, double-click:

```
start-all.bat
```

This will automatically start:

1. ✅ Stripe Webhook Listener (CLI)
2. ✅ Backend (FastAPI on port 8000)
3. ✅ Frontend (Next.js on port 3000)

**That's it!** Just wait for everything to load.

---

## Option 2: Manual (3 Separate Terminals)

### **Terminal 1: Stripe Webhook Listener**

```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

Expected output:

```
Ready! Your webhook signing secret is: whsec_fbc6165a...
> Forwarding to http://localhost:8000/webhook/stripe
```

**Keep this running!** ✅

---

### **Terminal 2: Backend**

```bash
cd Back
python run_backend.bat

# Or manually:
cd Back
..\.venv\Scripts\activate.bat
python -m uvicorn main:app --reload
```

Expected output:

```
Uvicorn running on http://127.0.0.1:8000
```

**Keep this running!** ✅

---

### **Terminal 3: Frontend**

```bash
cd Frontend
npm run dev
```

Expected output:

```
> Local:        http://localhost:3000
```

---

## ✅ Verify Everything is Running

Once all three are running:

1. **Open browser:** http://localhost:3000
2. **See your app:** Should load normally
3. **Click Subscribe:** Should take you to Stripe checkout
4. **Complete payment:** Use `4242 4242 4242 4242`
5. **Check Terminal 1:** Should show webhook delivery
6. **Check database:** Should have `customer_id` and `has_access=true`

---

## 🎯 What Each Component Does

| Component      | Port | Purpose                                                   |
| -------------- | ---- | --------------------------------------------------------- |
| **Stripe CLI** | -    | Receives webhooks from Stripe, forwards to localhost:8000 |
| **Backend**    | 8000 | FastAPI server, processes API calls & webhooks            |
| **Frontend**   | 3000 | Next.js app, what you see in browser                      |

---

## 📊 Expected Output in Each Terminal

### **Terminal 1 (Stripe CLI):**

```
> Ready! Your webhook signing secret is: whsec_fbc6165a...
> Forwarding to http://localhost:8000/webhook/stripe

[When you complete payment:]
> event.created [evt_test_ABC123]
> checkout.session.completed [cs_test_ABC123]
> POST http://localhost:8000/webhook/stripe [200] ✅
```

### **Terminal 2 (Backend):**

```
INFO:     Uvicorn running on http://127.0.0.1:8000

[When payment webhook arrives:]
============================================================
🔔 WEBHOOK RECEIVED
============================================================
📍 Signature header received: whsec_fbc6165a...
🔐 Verifying webhook signature...
✅ Signature verified successfully!
📌 Event Type: checkout.session.completed

💳 Processing checkout.session.completed...
✅ Checkout completed successfully!
   Customer ID: cus_ABC123XY789Z

============================================================
✅ WEBHOOK PROCESSED SUCCESSFULLY
============================================================
```

### **Terminal 3 (Frontend):**

```
> npm run dev
> Local:        http://localhost:3000
```

---

## 🎉 You're Ready!

Just run `start-all.bat` and you're done! Everything will start automatically.

**Next steps:**

1. Go to http://localhost:3000
2. Click Subscribe
3. Complete payment
4. Watch the webhook arrive in Terminal 1
5. See it process in Terminal 2
6. Verify in database

---

## 🛑 To Stop Everything

Close all three terminals. All services will stop.

---

**That's it! You now have a complete Stripe integration working locally!** ✅
