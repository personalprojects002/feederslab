# Backend API - Feeder

FastAPI backend for managing boards, users, authentication, and Stripe payments.

## 🚀 Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL (via SQLModel)
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Authentication**: Better Auth (session-based)
- **Payments**: Stripe
- **Server**: Uvicorn (ASGI)

## 📁 Project Structure

```
Back/
├── src/
│   ├── config/              # Configuration
│   │   ├── db.py           # Database connection
│   │   └── settings.py     # Environment settings
│   ├── middlewares/        # Middleware
│   │   └── auth.py        # Authentication middleware
│   ├── models/            # Database models
│   │   ├── board.py       # Board model
│   │   └── user.py        # User model
│   ├── routes/            # API routes
│   │   ├── boards.py      # Board endpoints
│   │   ├── billing.py     # Stripe endpoints
│   │   ├── webhook.py     # Stripe webhooks
│   │   └── schemas.py     # Pydantic schemas
│   ├── services/          # Business logic
│   │   ├── board_service.py   # Board operations
│   │   └── stripe_service.py  # Stripe operations
│   └── utils/             # Utilities
│       └── jwt.py         # JWT helpers
├── tests/                 # Test files
├── docs/                  # Additional documentation
├── readme/               # Organized documentation
├── main.py              # FastAPI application
├── pyproject.toml       # Python dependencies
└── run_backend.bat      # Windows start script
```

## 🛠️ Installation

### Prerequisites

- Python 3.11 or higher
- PostgreSQL database
- Stripe account
- Virtual environment tool (venv/conda)

### Steps

1. **Create virtual environment**

   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Linux/Mac
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   # or
   uv sync
   ```

3. **Configure environment variables**

   Create `.env` file:

   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/feederslab

   # Stripe
   STRIPE_API_KEY=sk_test_...
   STRIPE_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Environment
   ENVIRONMENT=development
   ```

4. **Run database migrations**

   ```bash
   python run_migration.py
   ```

5. **Start server**

   ```bash
   python -m uvicorn main:app --reload
   # or
   python run_backend.bat
   ```

   Server runs at http://localhost:8000

## 📝 API Endpoints

### Health Check

```http
GET /
```

### Boards

```http
GET    /boards/           # Get all user boards
GET    /boards/{id}       # Get board by ID
POST   /boards/           # Create new board
PUT    /boards/{id}       # Update board
DELETE /boards/{id}       # Delete board
```

### Billing

```http
POST   /billing/create-checkout   # Create Stripe checkout
POST   /billing/create-portal     # Create customer portal
```

### Webhooks

```http
POST   /stripe/webhooks   # Stripe webhook handler
```

## 🔐 Authentication

### Session-Based Authentication

The backend validates Better Auth sessions from the database.

**Flow:**

1. Frontend sends request with `Authorization: Bearer <token>`
2. Middleware extracts token
3. Validates against `session` table
4. Checks expiration
5. Returns user email

**Middleware Usage:**

```python
from src.middlewares.auth import CurrentUser

@router.post("/boards/")
def create_board(
    user_email: CurrentUser,
    session: Session = Depends(get_session)
):
    # user_email contains authenticated email
    pass
```

### Protected Routes

All routes except webhooks require authentication:

- Extract user from `CurrentUser` dependency
- Validates session token
- Returns 401 if unauthorized

## 💾 Database Models

### User Model

```python
class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    email_verified: bool = Field(default=False)
    name: str
    image: Optional[str]
    created_at: datetime
    updated_at: datetime
    has_access: bool = Field(default=False)
    stripe_customer_id: Optional[str]
```

### Board Model

```python
class Board(SQLModel, table=True):
    id: Optional[int] = Field(primary_key=True)
    board_name: str
    board_id: str = Field(unique=True, index=True)
    owner_email: str = Field(foreign_key="user.email")
    created_at: datetime
    updated_at: datetime
```

## 💳 Stripe Integration

### Checkout Flow

1. Frontend calls `/billing/create-checkout` with `priceId`
2. Backend creates Stripe checkout session
3. Returns checkout URL
4. Frontend redirects to Stripe
5. User completes payment
6. Stripe sends webhook
7. Backend updates `has_access = true`

### Webhook Handling

```python
@router.post("/stripe/webhooks")
async def stripe_webhook(request: Request):
    # Verify signature
    # Handle events:
    # - checkout.session.completed
    # - customer.subscription.updated
    # - customer.subscription.deleted
    pass
```

### Customer Portal

Allows users to manage subscriptions:

```python
@router.post("/billing/create-portal")
def create_portal_session(user_email: CurrentUser):
    # Create Stripe portal session
    # Return portal URL
    pass
```

## 🎯 Services Layer

### BoardService

Handles all board operations:

```python
class BoardService:
    def create_board(email: str, board_name: str) -> Board
    def get_boards(email: str) -> List[Board]
    def get_board_by_id(email: str, board_id: str) -> Board
    def update_board(email: str, board_id: str, name: str) -> Board
    def delete_board(email: str, board_id: str) -> None
```

### StripeService

Manages Stripe operations:

```python
def create_checkout_session(email: str, price_id: str) -> str
def create_portal_session(email: str) -> str
def handle_webhook(payload: bytes, signature: str) -> None
```

## 🔧 Configuration

### Database Connection

```python
# src/config/db.py
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session
```

### CORS Settings

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

## 🐛 Common Issues

### Database Connection

- Verify `DATABASE_URL` format
- Check PostgreSQL is running
- Ensure database exists

### Stripe Webhooks

- Use ngrok for local testing
- Verify webhook secret
- Check Stripe dashboard for events

### Authentication Errors

- Verify session exists in database
- Check token expiration
- Ensure frontend sends Bearer token

## 🧪 Testing

### Run Tests

```bash
pytest tests/
```

### Manual Testing

```bash
# Test boards endpoint
curl -X GET http://localhost:8000/boards/ \
  -H "Authorization: Bearer <token>"
```

## 📊 API Documentation

### Auto-generated Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Request/Response Examples

See [API_REFERENCE.md](API_REFERENCE.md) for detailed examples.

## 🚀 Deployment

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Use production database
- [ ] Use production Stripe keys
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring/logging
- [ ] Configure webhook endpoints

### Hosting Options

- **Railway**: Python support, PostgreSQL add-on
- **Render**: Free tier available
- **Heroku**: Easy deployment
- **DigitalOcean**: VPS hosting
- **AWS**: EC2 + RDS

## 📚 Additional Documentation

- [API Reference](readme/API_REFERENCE.md)
- [Database Models](readme/MODELS.md)
- [Authentication Guide](readme/AUTHENTICATION.md)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Submit pull request

## 📄 License

MIT License
