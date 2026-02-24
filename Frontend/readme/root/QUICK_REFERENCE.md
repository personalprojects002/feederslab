# 🚀 Quick Reference Card - Developer Cheat Sheet

## 🔑 Essential Environment Variables

### Frontend `.env.local`
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=your-32-char-secret
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
GOOGLE_ID=your-google-id
GOOGLE_SECRET=your-google-secret
RESEND_KEY=your-resend-key
```

### Backend `.env`
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=same-as-frontend
SB_STRIPE_SECRET_KEY=sk_test_...
SB_PRODUCT_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**⚠️ CRITICAL: `BETTER_AUTH_SECRET` must match in both files!**

---

## 🏃‍♂️ Quick Start Commands

### Start Everything (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd Backend
uv run uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

**Terminal 3 - Stripe Webhooks:**
```bash
stripe listen --forward-to localhost:8000/webhook/stripe
```

### First Time Setup

**Frontend:**
```bash
cd Frontend
npm install
cp SETUP.md .env.local  # Create and configure
npm run dev
```

**Backend:**
```bash
cd Backend
uv sync
cp SETUP.md .env  # Create and configure
uv run uvicorn main:app --reload
```

---

## 📍 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js app |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Sign In | http://localhost:3000/sign-in | Auth page |
| Dashboard | http://localhost:3000/dashboard | User dashboard |

---

## 🔐 Authentication Quick Reference

### How JWT Works Here

```
1. User logs in → Better Auth creates JWT
2. JWT stored in browser
3. Frontend calls backend → Adds header: Authorization: Bearer <JWT>
4. Backend verifies JWT → Extracts user email
5. Backend queries database → Returns data
```

### Get JWT Token (Browser Console)
```javascript
const session = await authClient.getSession();
console.log('JWT Token:', session.data.token);
```

### Test Backend Auth (curl)
```bash
# Replace <TOKEN> with actual JWT
curl -X GET http://localhost:8000/boards \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🎨 Frontend Code Patterns

### Calling Backend API

**Old Way (Next.js API):**
```typescript
const response = await axios.post("/api/board", { boardName: name });
```

**New Way (FastAPI Backend):**
```typescript
import backendApi from "@/lib/backend-api";

const response = await backendApi.post("/boards", { 
  boardName: name 
});
// JWT token automatically attached!
```

### Error Handling
```typescript
try {
  const response = await backendApi.post("/boards", data);
  toast.success("Board Created");
} catch (error: any) {
  const message = error.response?.data?.detail || "Error";
  toast.error(message);
}
```

### Protected Route Check
```typescript
const session = await auth.api.getSession({ 
  headers: await headers() 
});

if (!session) {
  redirect("/sign-in");
}
```

---

## 🐍 Backend Code Patterns

### Create New Route

**1. Define Schema (src/routes/schemas.py):**
```python
class ItemCreateRequest(BaseModel):
    name: str = Field(alias="itemName")
    
    class Config:
        populate_by_name = True
```

**2. Create Route (src/routes/items.py):**
```python
from fastapi import APIRouter, Depends
from src.middlewares.auth import CurrentUser

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/")
def create_item(
    body: ItemCreateRequest,
    user_email: CurrentUser,  # JWT verified!
    session: Session = Depends(get_session)
):
    # user_email is authenticated user's email
    # Use it to query and verify permissions
    pass
```

**3. Register Route (main.py):**
```python
from src.routes.items import router as items_router
app.include_router(items_router)
```

### Query Database
```python
from sqlmodel import select
from src.models.user import User

# Get user by email
user = session.exec(
    select(User).where(User.email == user_email)
).first()

# Get all user's boards
boards = user.boards  # Relationship auto-loads
```

### Service Pattern
```python
class ItemService:
    def __init__(self, session: Session):
        self.session = session
    
    def create_item(self, name: str, user_email: str):
        user = self.session.exec(
            select(User).where(User.email == user_email)
        ).first()
        
        if not user:
            raise ValueError("User not found")
        
        item = Item(name=name, user_id=user.id)
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item
```

---

## 💳 Stripe Integration

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Expiry: Any future date (12/34)
CVC: Any 3 digits (123)
ZIP: Any 5 digits (12345)
```

### Trigger Webhook Locally
```bash
# Simulate successful payment
stripe trigger checkout.session.completed

# Simulate subscription cancel
stripe trigger customer.subscription.deleted
```

### Check Webhook Logs
```bash
# In Stripe CLI terminal, you'll see:
# --> checkout.session.completed [evt_...]
# <-- [200] POST http://localhost:8000/webhook/stripe
```

---

## 🗄️ Database Quick Commands

### Connect to Database
```bash
psql $DATABASE_URL
```

### Common Queries
```sql
-- View all users
SELECT id, email, has_access, customer_id FROM "user";

-- View all boards
SELECT * FROM board;

-- Find user's boards
SELECT b.* FROM board b
JOIN "user" u ON b.user_id = u.id
WHERE u.email = 'user@example.com';

-- Grant access manually (testing)
UPDATE "user" SET has_access = true WHERE email = 'user@example.com';

-- Check session
SELECT * FROM session WHERE user_id = 1;
```

---

## 🐛 Debugging Checklist

### "Invalid token" Error
- [ ] Check `BETTER_AUTH_SECRET` matches in both .env files
- [ ] Verify JWT is being sent from frontend
- [ ] Check token hasn't expired (7 days)
- [ ] Clear browser cookies and login again

### "Not Authorized" Error
- [ ] User logged in?
- [ ] JWT token exists in browser?
- [ ] Check Network tab → Authorization header present?

### "Please Subscribe First" Error
- [ ] Check `user.has_access` in database
- [ ] Verify webhook was received (Stripe CLI logs)
- [ ] Refresh page or re-login

### Board Creation Fails
- [ ] Backend running?
- [ ] JWT token valid?
- [ ] User has `has_access = true`?
- [ ] Check backend logs for errors

### Webhook Not Working
- [ ] Stripe CLI running?
- [ ] Webhook secret in Backend .env?
- [ ] Backend restarted after .env change?
- [ ] Check Stripe CLI terminal for events

---

## 📊 Testing Flow

### Complete Test Sequence
```
1. Start backend → http://localhost:8000
2. Start frontend → http://localhost:3000
3. Start Stripe CLI → webhook forwarding
4. Sign in → http://localhost:3000/sign-in
5. Try create board → Should fail (no subscription)
6. Click Subscribe → Stripe checkout
7. Pay with 4242 4242 4242 4242
8. Webhook fires → has_access = true
9. Create board → Should succeed ✅
10. Click Billing → Stripe portal
11. Cancel subscription
12. Webhook fires → has_access = false
13. Try create board → Should fail again
```

---

## 🔄 Code Structure Comparison

### TypeScript → Python Translation

| TypeScript | Python | Description |
|------------|--------|-------------|
| `interface User` | `class User(SQLModel)` | Data model |
| `async function` | `async def` | Async function |
| `try/catch` | `try/except` | Error handling |
| `Promise<T>` | `-> T` | Return type |
| `.then()` | `await` | Promise handling |
| `res.json()` | `return {...}` | JSON response |
| `req.body` | `body: Schema` | Request body |

### File Structure Mapping

| TypeScript Path | Python Path | Purpose |
|----------------|-------------|---------|
| `app/api/board/route.ts` | `src/routes/boards.py` | Board CRUD |
| `app/api/billing/create-checkout/route.ts` | `src/routes/billing.py` | Stripe checkout |
| `app/api/webhook/route.ts` | `src/routes/webhook.py` | Stripe webhooks |
| `Models/user.ts` | `src/models/user.py` | User model |
| `auth.api.getSession()` | `CurrentUser` dependency | Auth check |

---

## 🎯 Common Tasks

### Add New Model

**1. Create Model:**
```python
# src/models/item.py
from sqlmodel import SQLModel, Field, Relationship

class Item(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    user_id: int = Field(foreign_key="user.id")
    user: "User | None" = Relationship(back_populates="items")
```

**2. Add Relationship to User:**
```python
# src/models/user.py
items: "list[Item]" = Relationship(back_populates="user")
```

**3. Restart Backend** → Table auto-created!

### Add Authentication to Route
```python
from src.middlewares.auth import CurrentUser

@router.post("/protected")
def protected_route(user_email: CurrentUser):
    # user_email is automatically verified!
    return {"user": user_email}
```

### Add CORS Origin
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://yourdomain.com"  # Add production URL
    ],
    ...
)
```

---

## 📦 Install New Packages

### Frontend
```bash
cd Frontend
npm install <package-name>
npm install --save-dev <dev-package>
```

### Backend
```bash
cd Backend
uv add <package-name>
uv sync
```

---

## 🚀 Production Deployment

### Quick Checklist
- [ ] Set production DATABASE_URL
- [ ] Use production Stripe keys (sk_live_...)
- [ ] Update webhook URL in Stripe dashboard
- [ ] Use strong BETTER_AUTH_SECRET (32+ chars)
- [ ] Enable HTTPS everywhere
- [ ] Set CORS to specific origins (not *)
- [ ] Test full payment flow in production
- [ ] Monitor error logs

### Environment Variables to Change
```
Development → Production:
- DATABASE_URL → production PostgreSQL
- SB_STRIPE_SECRET_KEY → sk_live_...
- STRIPE_WEBHOOK_SECRET → whsec_... (production)
- NEXT_PUBLIC_BACKEND_API_URL → https://api.yourdomain.com
- NEXT_PUBLIC_BETTER_AUTH_URL → https://yourdomain.com
```

---

## 💡 Pro Tips

1. **Always check backend logs first** when debugging
2. **Use Stripe CLI** for local webhook testing
3. **Clear browser cache** if auth acting weird
4. **Check database** to verify data changes
5. **JWT expires in 7 days** - re-login if issues
6. **Restart backend** after changing .env
7. **Use API docs** at /docs to test endpoints
8. **Keep secrets secret** - never commit .env files

---

## 📚 Documentation Links

- Frontend Setup: `Frontend/SETUP.md`
- Backend Setup: `Backend/SETUP.md`
- Complete Testing: `TESTING_GUIDE.md`
- Architecture: `README.md`
- API Docs: http://localhost:8000/docs

---

## 🆘 Emergency Commands

### Reset Everything
```bash
# Stop all servers (Ctrl+C in each terminal)

# Frontend
cd Frontend
rm -rf .next node_modules
npm install
npm run dev

# Backend
cd Backend
uv sync
uv run uvicorn main:app --reload
```

### Clear Database (Careful!)
```sql
-- Connect to database
psql $DATABASE_URL

-- Drop all data
TRUNCATE "user", board, session, account CASCADE;

-- Or drop and recreate tables
DROP TABLE IF EXISTS board, "user", session, account CASCADE;
-- Restart backend → Tables recreated
```

### Generate New JWT Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Copy to both .env files
```

---

**Keep this card handy while developing! 🚀**