# 🚀 READY TO GO - Complete Startup Guide

## 🎯 The Absolute Fastest Way

### **Option 1: Just Double-Click (30 seconds)**

Go to root folder → Double-click `start-all.bat`

**Done!** Everything starts automatically:

- ✅ Stripe Webhook Listener
- ✅ Backend (port 8000)
- ✅ Frontend (port 3000)

Then go to http://localhost:3000

---

### **Option 2: Manual Startup (3 Terminals)**

**Terminal 1:**

```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

**Terminal 2:**

```bash
cd Back && ..\.venv\Scripts\activate.bat && python -m uvicorn main:app --reload
```

**Terminal 3:**

```bash
cd Frontend && npm run dev
```

Then go to http://localhost:3000

---

## 📋 What's Running

| Service               | Status  | Port | URL                   |
| --------------------- | ------- | ---- | --------------------- |
| 🎵 Stripe Webhook CLI | Running | -    | Forwarding to 8000    |
| ⚡ Backend (FastAPI)  | Running | 8000 | http://localhost:8000 |
| 🎨 Frontend (Next.js) | Running | 3000 | http://localhost:3000 |

---

## 🎯 Test the Setup

1. **Go to:** http://localhost:3000
2. **Click:** "Subscribe" button
3. **Enter card:** `4242 4242 4242 4242`
4. **Check Terminal 1:** Should show webhook
5. **Check Terminal 2:** Should show webhook processing
6. **Check database:** `customer_id` should be filled

---

## 🔍 What You'll See

### **Terminal 1 (Stripe CLI):**

```
> Ready! Your webhook signing secret is: whsec_...
> Forwarding to http://localhost:8000/webhook/stripe

[After payment:]
> event.created [evt_test_...]
> checkout.session.completed [cs_test_...]
> POST http://localhost:8000/webhook/stripe [200] ✅
```

### **Terminal 2 (Backend):**

```
INFO: Uvicorn running on http://127.0.0.1:8000

[After payment webhook arrives:]
============================================================
🔔 WEBHOOK RECEIVED
============================================================
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
> Local: http://localhost:3000
```

---

## ✨ That's All!

Everything is ready. Just pick Option 1 or Option 2 above and you're good!

**Files Created:**

- `start-all.bat` - Automated startup script
- `QUICK_START_EVERYTHING.md` - Detailed startup guide
- `COMMANDS_CHEATSHEET.md` - Quick command reference

**Choose your preference:**

- 🚀 **Lazy?** Double-click `start-all.bat`
- 📝 **Like control?** Use 3 terminals and commands
- 📚 **Want details?** Read `QUICK_START_EVERYTHING.md`

---

## 🎉 Ready!

Everything is set up. Just run it and test the Subscribe button!

**Questions?** See the other markdown files in the root folder.
