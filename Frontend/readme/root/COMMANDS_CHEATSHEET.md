# ⚡ One-Command Cheat Sheet

## The Fastest Way to Get Everything Running

### **Option A: Double-Click (Easiest)**

```
Double-click: start-all.bat
```

That's it! All three services will start in separate windows.

---

### **Option B: One Terminal - All Services**

If you want everything in ONE terminal window that shows what's happening:

```bash
# Terminal 1: Start Stripe CLI
stripe listen --forward-to localhost:8000/webhook/stripe

# Open NEW terminal (Ctrl+Shift+T in Terminal, or new PowerShell window)

# Terminal 2: Start Backend
cd Back && ..\.venv\Scripts\activate.bat && python -m uvicorn main:app --reload

# Open NEW terminal

# Terminal 3: Start Frontend
cd Frontend && npm run dev
```

---

## 🎯 The Order Matters

**Start in this order:**

1. **Stripe CLI** ← Start first (webhook listener)
2. **Backend** ← Start second (port 8000)
3. **Frontend** ← Start third (port 3000)

---

## ✅ Check All Are Running

Once all three are started:

```bash
# Test in a new terminal:
curl http://localhost:8000/docs
# Should show: Swagger UI (FastAPI docs)

curl http://localhost:3000
# Should return HTML (Next.js frontend)
```

---

## 🎯 Single Commands (Copy-Paste Ready)

### **Just Backend + Webhook**

```bash
# Terminal 1:
stripe listen --forward-to localhost:8000/webhook/stripe

# Terminal 2:
cd Back && ..\.venv\Scripts\activate.bat && python -m uvicorn main:app --reload
```

### **Everything**

```bash
# Terminal 1:
stripe listen --forward-to localhost:8000/webhook/stripe

# Terminal 2:
cd Back && ..\.venv\Scripts\activate.bat && python -m uvicorn main:app --reload

# Terminal 3:
cd Frontend && npm run dev
```

---

## 📊 Port Reference

| Service    | Port | URL                           |
| ---------- | ---- | ----------------------------- |
| Stripe CLI | -    | localhost:8000/webhook/stripe |
| Backend    | 8000 | http://localhost:8000         |
| Frontend   | 3000 | http://localhost:3000         |

---

## 🆘 Quick Troubleshooting

| Issue                      | Solution                                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| "stripe command not found" | Install Stripe CLI: `choco install stripe-cli`                              |
| "Port 8000 already in use" | Kill process: `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` |
| "Port 3000 already in use" | Kill process: `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| "No webhook received"      | Make sure Stripe CLI is running in Terminal 1                               |

---

**Choose one of the three options above and you're good to go!** 🚀
