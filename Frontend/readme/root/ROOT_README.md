# 🚀 Full-Stack Application - Frontend & Backend Separation

A complete full-stack application with **Next.js frontend** and **FastAPI backend**, featuring JWT authentication, subscription payments, and user board management.

---

## 📁 Project Structure

```
Converter/
├── Frontend/              # Next.js Application
│   ├── app/              # Next.js 14+ App Router
│   │   ├── api/          # Better Auth API routes only
│   │   ├── components/   # React components
│   │   ├── dashboard/    # Protected dashboard pages
│   │   └── sign-in/      # Authentication pages
│   ├── lib/              # Utilities and configurations
│   │   ├── postgres.ts   # PostgreSQL connection
│   │   ├── better-auth.ts # Better Auth server config
│   │   ├── auth-client.ts # Better Auth client
│   │   └── backend-api.ts # Axios client for FastAPI
│   └── SETUP.md          # Frontend setup guide
│
├── Backend/              # FastAPI Application
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   │   ├── db.py     # Database engine & sessions
│   │   │   └── settings.py # Environment variables
│   │   ├── models/       # SQLModel models
│   │   │   ├── user.py   # User model
│   │   │   └── board.py  # Board model
│   │   ├── routes/       # API endpoints
│   │   │   ├── boards.py # Board CRUD operations
│   │   │   ├── billing.py # Stripe checkout & portal
│   │   │   ├── webhook.py # Stripe webhooks
│   │   │   └── schemas.py # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   │   ├── board_service.py # Board operations
│   │   │   └── stripe_service.py # Payment processing
│   │   ├── middlewares/  # Middleware
│   │   │   └── auth.py   # JWT authentication
│   │   └── utils/        # Utilities
│   │       └── jwt.py    # JWT verification
│   ├── main.py           # FastAPI app entry point
│   └── SETUP.md          # Backend setup guide
│
├── TESTING_GUIDE.md      # Complete testing guide
└── README.md            # This file
```

---

## 🏗️ Architecture Overview

### **Technology Stack**

#### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + DaisyUI
- **Authentication:** Better Auth (JWT-based)
- **Database:** PostgreSQL (Neon) - for Better Auth tables
- **HTTP Client:** Axios
- **State Management:** React Hooks
- **Notifications:** React Hot Toast

#### Backend
- **Framework:** FastAPI
- **Language:** Python 3.12+
- **Package Manager:** UV
- **ORM:** SQLModel
- **Database:** PostgreSQL (Neon)
- **Authentication:** JWT (PyJWT)
- **Payments:** Stripe
- **Server:** Uvicorn

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js - Port 3000)                 │
├─────────────────────────────────────────────────────────────┤
│  • Better Auth (JWT generation)                             │
│  • Authentication UI (Google OAuth, Magic Link)             │
│  • Protected Routes (/dashboard)                            │
│  • API Client (backendApi with auto JWT attachment)         │
│  • React Components (Boards, Payments)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + JWT Token
                           │ Authorization: Bearer <token>
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI - Port 8000)                  │
├─────────────────────────────────────────────────────────────┤
│  • JWT Verification Middleware                              │
│  • Board CRUD API (/boards)                                 │
│  • Stripe Integration (/billing)                            │
│  • Webhook Handler (/webhook/stripe)                        │
│  • Business Logic (Services)                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         DATABASE (PostgreSQL - Neon)                        │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  • user (id, email, name, has_access, customer_id)          │
│  • board (id, board_name, user_id, timestamps)              │
│  • session (Better Auth sessions)                           │
│  • account (OAuth provider accounts)                        │
│  • verification (Email verification tokens)                 │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    STRIPE (Payments)                         │
├─────────────────────────────────────────────────────────────┤
│  • Checkout Sessions (Subscription purchase)                │
│  • Customer Portal (Manage subscription)                    │
│  • Webhooks (Payment events)                                │
│    - checkout.session.completed → Grant access              │
│    - customer.subscription.deleted → Revoke access          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### **JWT-Based Authentication**

1. **User Login (Frontend)**
   ```
   User → Sign In (Google/Magic Link)
   → Better Auth validates
   → Generates JWT token
   → Stores in browser (cookie/memory)
   ```

2. **API Request (Frontend → Backend)**
   ```
   User action → Frontend component
   → backendApi.post("/boards", data)
   → Interceptor adds: Authorization: Bearer <JWT>
   → Request sent to FastAPI
   ```

3. **Token Verification (Backend)**
   ```
   Request arrives → Extract Authorization header
   → Get token from "Bearer <token>"
   → Verify signature using BETTER_AUTH_SECRET
   → Decode payload → Extract user email
   → Query database for user
   → Allow or reject request
   ```

4. **Database Query**
   ```
   Backend → PostgreSQL
   → SELECT * FROM user WHERE email = 'user@example.com'
   → Check permissions (has_access)
   → Return data or error
   ```

### **Key Security Points**

- ✅ **Shared Secret:** Frontend and Backend use identical `BETTER_AUTH_SECRET`
- ✅ **Stateless:** Backend doesn't store sessions, just verifies JWT signature
- ✅ **Expiration:** Tokens expire after 7 days (configurable)
- ✅ **HTTPS:** All production traffic encrypted
- ✅ **Webhook Verification:** Stripe signatures verified before processing

---

## 💳 Payment Flow

### **Subscribe Flow**

```
1. User clicks "Subscribe" button
   ↓
2. Frontend: POST /billing/create-checkout
   Headers: Authorization: Bearer <JWT>
   Body: { successUrl, cancelUrl }
   ↓
3. Backend verifies JWT → Gets user
   ↓
4. Backend calls Stripe API:
   stripe.checkout.Session.create({
     mode: "subscription",
     customer_email: user.email,
     client_reference_id: user.id,
     ...
   })
   ↓
5. Backend returns: { url: "https://checkout.stripe.com/..." }
   ↓
6. Frontend redirects user to Stripe
   ↓
7. User enters card details → Pays
   ↓
8. Stripe sends webhook: checkout.session.completed
   ↓
9. Backend verifies webhook signature
   ↓
10. Backend updates database:
    UPDATE user SET has_access = true, customer_id = 'cus_...'
    ↓
11. User redirected to /dashboard/success
    ↓
12. User can now create boards ✅
```

### **Cancel Subscription Flow**

```
1. User clicks "Billing" button
   ↓
2. Frontend: POST /billing/create-portal
   ↓
3. Backend creates Stripe portal session
   ↓
4. User cancels subscription in Stripe portal
   ↓
5. Stripe sends webhook: customer.subscription.deleted
   ↓
6. Backend updates database:
    UPDATE user SET has_access = false
    ↓
7. User can no longer create new boards ❌
   (Existing boards remain accessible)
```

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- Python 3.12+
- UV package manager
- PostgreSQL database (Neon recommended)
- Stripe account (test mode)
- Google OAuth credentials (optional)
- Resend account for emails (optional)

### **1. Clone and Setup**

```bash
# Clone the repository
git clone <your-repo-url>
cd Converter

# Frontend setup
cd Frontend
npm install
cp .env.example .env.local  # Create and configure

# Backend setup
cd ../Backend
uv sync
cp .env.example .env  # Create and configure
```

### **2. Configure Environment Variables**

#### Frontend `.env.local`
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=your-32-character-secret-here
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
RESEND_KEY=your-resend-api-key
RESEND_FROM=noreply@yourdomain.com
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

#### Backend `.env`
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=same-as-frontend-secret
SB_STRIPE_SECRET_KEY=sk_test_...
SB_PRODUCT_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**⚠️ CRITICAL:** `BETTER_AUTH_SECRET` must be **identical** in both files!

### **3. Run the Application**

#### Terminal 1 - Backend
```bash
cd Backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend
```bash
cd Frontend
npm run dev
```

#### Terminal 3 - Stripe Webhooks (Optional for local testing)
```bash
stripe listen --forward-to localhost:8000/webhook/stripe
# Copy the webhook secret (whsec_...) to Backend .env
```

### **4. Access the Application**

- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8000/docs
- **Sign In Page:** http://localhost:3000/sign-in

---

## 📚 API Endpoints

### **Boards** (Authentication Required)

#### Create Board
```http
POST /boards
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "boardName": "My New Board"
}

Response: 201 Created
{
  "id": 1,
  "board_name": "My New Board",
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get All Boards
```http
GET /boards
Authorization: Bearer <JWT>

Response: 200 OK
[
  {
    "id": 1,
    "board_name": "My Board",
    "user_id": 1,
    ...
  }
]
```

#### Get Board by ID
```http
GET /boards/{id}
Authorization: Bearer <JWT>

Response: 200 OK
```

#### Update Board
```http
PATCH /boards/{id}
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "boardName": "Updated Name"
}

Response: 200 OK
```

#### Delete Board
```http
DELETE /boards/{id}
Authorization: Bearer <JWT>

Response: 200 OK
{
  "message": "Board with id 1 successfully deleted"
}
```

### **Billing** (Authentication Required)

#### Create Checkout Session
```http
POST /billing/create-checkout
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "successUrl": "http://localhost:3000/dashboard/success",
  "cancelUrl": "http://localhost:3000/dashboard"
}

Response: 200 OK
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

#### Create Portal Session
```http
POST /billing/create-portal
Authorization: Bearer <JWT>

Response: 200 OK
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

### **Webhooks** (No Authentication - Signature Verified)

#### Stripe Webhook
```http
POST /webhook/stripe
stripe-signature: t=...,v1=...

Response: 200 OK
{
  "received": true
}
```

---

## 🧪 Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test:**
1. Sign in at http://localhost:3000/sign-in
2. Try creating a board → Should fail (no subscription)
3. Click Subscribe → Complete payment with test card: `4242 4242 4242 4242`
4. Create a board → Should succeed ✅
5. Click Billing → Cancel subscription
6. Try creating a board → Should fail again

---

## 📦 Database Schema

### **User Table**
```sql
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) DEFAULT 'Friend',
    email VARCHAR(255) UNIQUE NOT NULL,
    image VARCHAR(500),
    has_access BOOLEAN DEFAULT false,
    customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Board Table**
```sql
CREATE TABLE board (
    id SERIAL PRIMARY KEY,
    board_name VARCHAR(200) DEFAULT 'New Board',
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Better Auth Tables** (Auto-created)
- `session` - User sessions and JWT tokens
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

---

## 🔄 Migration from MongoDB to PostgreSQL

This project was migrated from a MongoDB-based architecture to PostgreSQL. Here's what changed:

### **Before (MongoDB)**
- Better Auth used MongoDB adapter
- User and Board models used Mongoose
- All data in MongoDB
- Session-based authentication

### **After (PostgreSQL)**
- Better Auth uses PostgreSQL adapter
- User and Board models use SQLModel
- All data in PostgreSQL (Neon)
- JWT-based authentication
- Better Auth tables auto-created

### **Migration Steps Taken**
1. ✅ Replaced `mongodbAdapter` with PostgreSQL adapter
2. ✅ Removed Mongoose models → Created SQLModel models
3. ✅ Added JWT plugin to Better Auth
4. ✅ Created backend API client with auto JWT attachment
5. ✅ Moved all business logic to FastAPI backend
6. ✅ Updated frontend components to call FastAPI

---

## 🚢 Production Deployment

### **Frontend (Vercel/Netlify)**

1. Set environment variables:
   ```
   DATABASE_URL=<production-postgres>
   BETTER_AUTH_SECRET=<strong-secret>
   NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
   GOOGLE_ID=<production-id>
   GOOGLE_SECRET=<production-secret>
   RESEND_KEY=<production-key>
   ```

2. Deploy:
   ```bash
   npm run build
   npm run start
   # Or push to GitHub → Auto-deploy on Vercel
   ```

### **Backend (Railway/Render/Fly.io)**

1. Set environment variables:
   ```
   DATABASE_URL=<production-postgres>
   BETTER_AUTH_SECRET=<same-as-frontend>
   SB_STRIPE_SECRET_KEY=sk_live_...
   SB_PRODUCT_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. Deploy:
   ```bash
   # Example for Railway
   railway up
   
   # Or Docker
   docker build -t backend .
   docker run -p 8000:8000 backend
   ```

### **Stripe Webhook Configuration**

1. Go to: Stripe Dashboard → Webhooks → Add endpoint
2. Set URL: `https://api.yourdomain.com/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copy webhook secret → Add to Backend environment variables
5. Test webhook with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

### **Database (Neon PostgreSQL)**

- Create production database
- Copy connection string
- Tables auto-created on first backend startup
- Enable connection pooling for better performance

### **Security Checklist**

- [ ] Use strong `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Enable HTTPS on all endpoints
- [ ] Set proper CORS origins (not `*`)
- [ ] Use production Stripe keys (`sk_live_...`)
- [ ] Verify webhook signatures
- [ ] Rate limit API endpoints (optional)
- [ ] Monitor error logs
- [ ] Regular security audits

---

## 🛠️ Development Tips

### **Code Style Matches TypeScript**

Python backend code mirrors TypeScript structure:

| TypeScript Concept | Python Equivalent |
|-------------------|-------------------|
| `interface User` | `class User(SQLModel)` |
| `async/await` | `async def` |
| `try/catch` | `try/except` |
| `Promise<T>` | `-> T` (type hints) |
| `.json()` | `dict` |
| `NextResponse.json()` | `return {...}` |

### **Adding New Features**

1. **Frontend:**
   - Add component in `app/components/`
   - Create route in `app/`
   - Call backend via `backendApi.post()`

2. **Backend:**
   - Add route in `src/routes/`
   - Add service in `src/services/`
   - Add model in `src/models/` (if needed)
   - Register router in `main.py`

### **Debugging**

**Frontend:**
```javascript
// Check JWT token
const session = await authClient.getSession();
console.log('Token:', session.data.token);

// Check API calls
// Open DevTools → Network → Look for requests to localhost:8000
```

**Backend:**
```python
# Add logging
import logging
logging.info(f"User email: {user_email}")

# Check database
from src.config.db import engine
from sqlmodel import Session, select
with Session(engine) as session:
    users = session.exec(select(User)).all()
    print(users)
```

---

## 📖 Documentation

- **Frontend Setup:** [Frontend/SETUP.md](Frontend/SETUP.md)
- **Backend Setup:** [Backend/SETUP.md](Backend/SETUP.md)
- **Testing Guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **API Docs:** http://localhost:8000/docs (when running)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Better Auth** - Modern authentication for Next.js
- **FastAPI** - High-performance Python web framework
- **SQLModel** - SQL databases in Python with type safety
- **Stripe** - Payment processing platform
- **Neon** - Serverless PostgreSQL

---

## 📧 Support

For issues and questions:
- Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for troubleshooting
- Review environment variable configuration
- Verify database connection
- Check Stripe webhook logs
- Review backend API logs

---

**Built with ❤️ using Next.js, FastAPI, PostgreSQL, and Stripe**