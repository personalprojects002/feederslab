# Board API Documentation - FastAPI Implementation

This document explains the FastAPI implementation of the Board API, converted from Next.js API routes to a clean, organized FastAPI structure.

---

## 📁 File Structure

```
src/
├── config/
│   ├── db.py              # Database connection and session management
│   └── settings.py        # Environment variables
│
├── models/
│   ├── user.py           # User table model
│   └── board.py          # Board table model
│
├── routes/
│   ├── boards.py         # Board API endpoints (routes)
│   └── schemas.py        # Request/Response schemas (Pydantic)
│
├── services/
│   └── board_service.py  # Board business logic
│
└── middlewares/
    └── auth.py           # Authentication dependency

main.py                   # FastAPI app entry point
```

---

## 🔄 Request Flow

### Next.js vs FastAPI Comparison

**Next.js (Original):**

```
Request → API Route → Auth Check → Business Logic → Database → Response
```

**FastAPI (New):**

```
Request → Router → Auth Middleware → Service Layer → Database → Response
```

### Detailed Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. REQUEST ARRIVES                                           │
│     POST /boards                                              │
│     Body: { "boardName": "My Project" }                      │
│     Header: Authorization: Bearer <token>                    │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  2. ROUTER (src/routes/boards.py)                            │
│     @router.post("/")                                         │
│     def create_board(...)                                    │
│                                                               │
│     ✓ Receives request                                       │
│     ✓ Validates request body with Pydantic                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  3. AUTH MIDDLEWARE (src/middlewares/auth.py)                │
│     get_current_user_email()                                 │
│                                                               │
│     ✓ Checks Authorization header                           │
│     ✓ Validates session/token                               │
│     ✓ Extracts user email                                   │
│     ✓ Returns email or raises 401                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  4. DEPENDENCY INJECTION                                      │
│     session: Session = Depends(get_session)                  │
│     user_email: str = Depends(get_current_user_email)       │
│                                                               │
│     ✓ Database session injected                             │
│     ✓ User email from auth injected                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  5. SERVICE LAYER (src/services/board_service.py)           │
│     BoardService.create_board()                              │
│                                                               │
│     ✓ Validate board name                                   │
│     ✓ Find user by email                                    │
│     ✓ Check user exists                                     │
│     ✓ Create new board                                      │
│     ✓ Link to user (via user_id foreign key)               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  6. DATABASE (config/db.py)                                  │
│     PostgreSQL via SQLModel                                  │
│                                                               │
│     ✓ session.add(new_board)                                │
│     ✓ session.commit()                                       │
│     ✓ session.refresh(new_board)                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  7. RESPONSE                                                  │
│     Status: 201 Created                                      │
│     Body: {                                                  │
│       "id": 1,                                               │
│       "board_name": "My Project",                           │
│       "user_id": 1,                                          │
│       "created_at": "2026-02-04T10:30:00",                  │
│       "updated_at": "2026-02-04T10:30:00"                   │
│     }                                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 Code Breakdown

### 1. Schemas (Request/Response Models)

**File: `src/routes/schemas.py`**

```python
from pydantic import BaseModel, Field

class BoardCreateRequest(BaseModel):
    board_name: str = Field(min_length=1, max_length=200, alias="boardName")

    class Config:
        populate_by_name = True  # Allows both "board_name" and "boardName"
```

**What this does:**

- Defines the structure of incoming requests
- `alias="boardName"` → Accepts JSON field as "boardName" but converts to "board_name"
- Pydantic automatically validates min_length and max_length
- Equivalent to Next.js interface: `interface BoardRequestBody { boardName: string }`

### 2. Authentication Middleware

**File: `src/middlewares/auth.py`**

```python
def get_current_user_email(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")

    # TODO: Validate token and extract email
    # This is where you implement your auth logic

    return email
```

**What this does:**

- Extracts Authorization header from request
- Validates the token/session
- Returns user email if valid
- Raises 401 if unauthorized
- Equivalent to Next.js: `await auth.api.getSession({ headers: await headers() })`

**How to use:**

```python
CurrentUser = Annotated[str, Depends(get_current_user_email)]

@router.post("/")
def create_board(user_email: CurrentUser):
    # user_email is automatically extracted from token
    pass
```

### 3. Service Layer (Business Logic)

**File: `src/services/board_service.py`**

```python
class BoardService:
    def __init__(self, session: Session):
        self.session = session

    def create_board(self, board_name: str, user_email: str) -> Board:
        # Find user
        user = self.session.exec(select(User).where(User.email == user_email)).first()

        if not user:
            raise ValueError("You are not allowed to create a board")

        # Create board
        new_board = Board(board_name=board_name, user_id=user.id)

        # Save to database
        self.session.add(new_board)
        self.session.commit()
        self.session.refresh(new_board)

        return new_board
```

**What this does:**

1. **Find user** → `User.findOne({ email })` in Mongoose
2. **Check exists** → If not found, raise error (403 Forbidden)
3. **Create board** → `Board.create({ boardName, user: user._id })`
4. **Auto-link** → Foreign key `user_id` automatically creates relationship
5. **Return** → Return the created board

**Key differences from Next.js:**

- No need to manually push to `user.boards` array
- Foreign key relationship handles the linking automatically
- SQLModel/SQLAlchemy manages the relationship

### 4. Router (API Endpoints)

**File: `src/routes/boards.py`**

```python
@router.post("/", response_model=BoardResponse, status_code=201)
def create_board(
    body: BoardCreateRequest,
    user_email: CurrentUser,
    session: Session = Depends(get_session)
):
    # Validate input
    if not body.board_name or body.board_name.strip() == "":
        raise HTTPException(status_code=400, detail="Board name is required")

    # Business logic
    service = BoardService(session)
    new_board = service.create_board(body.board_name, user_email)

    return new_board
```

**What this does:**

- `@router.post("/")` → Defines POST endpoint at /boards/
- `body: BoardCreateRequest` → Automatically validates and parses JSON
- `user_email: CurrentUser` → Automatically extracts from auth header
- `session: Session` → Automatically injects database session
- `response_model=BoardResponse` → Defines response structure
- `status_code=201` → Returns 201 Created on success

---

## 🔗 Next.js → FastAPI Mapping

| Next.js                                           | FastAPI                                       |
| ------------------------------------------------- | --------------------------------------------- |
| `export async function POST(request)`             | `@router.post("/")`                           |
| `await request.json()`                            | `body: BoardCreateRequest` (automatic)        |
| `await auth.api.getSession()`                     | `user_email: CurrentUser` (automatic)         |
| `await connectMongo()`                            | `session: Session = Depends(get_session)`     |
| `await User.findOne({ email })`                   | `session.exec(select(User).where(...))`       |
| `await Board.create(...)`                         | `Board(...); session.add(); session.commit()` |
| `user.boards.push(newBoard._id)`                  | Automatic via foreign key relationship        |
| `return NextResponse.json(data, { status: 201 })` | `return new_board` (automatic JSON)           |

---

## 📡 API Endpoints

### Create Board

**Endpoint:** `POST /boards`

**Request:**

```json
{
  "boardName": "My Project Board"
}
```

**Headers:**

```
Authorization: Bearer <your-token>
```

**Response (201 Created):**

```json
{
  "id": 1,
  "board_name": "My Project Board",
  "user_id": 1,
  "created_at": "2026-02-04T10:30:00",
  "updated_at": "2026-02-04T10:30:00"
}
```

**Error Responses:**

- `400` - Board name is required
- `401` - Not Authorized
- `403` - You are not allowed to create a board
- `500` - Internal server error

---

### Get All Boards

**Endpoint:** `GET /boards`

**Headers:**

```
Authorization: Bearer <your-token>
```

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "board_name": "My Project",
    "user_id": 1,
    "created_at": "2026-02-04T10:30:00",
    "updated_at": "2026-02-04T10:30:00"
  },
  {
    "id": 2,
    "board_name": "Work Tasks",
    "user_id": 1,
    "created_at": "2026-02-04T11:00:00",
    "updated_at": "2026-02-04T11:00:00"
  }
]
```

---

### Get Board by ID

**Endpoint:** `GET /boards/{board_id}`

**Example:** `GET /boards/1`

**Response (200 OK):**

```json
{
  "id": 1,
  "board_name": "My Project",
  "user_id": 1,
  "created_at": "2026-02-04T10:30:00",
  "updated_at": "2026-02-04T10:30:00"
}
```

**Error Responses:**

- `403` - Not authorized to access this board
- `404` - Board not found

---

### Update Board

**Endpoint:** `PATCH /boards/{board_id}`

**Request:**

```json
{
  "boardName": "Updated Board Name"
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "board_name": "Updated Board Name",
  "user_id": 1,
  "created_at": "2026-02-04T10:30:00",
  "updated_at": "2026-02-04T12:00:00"
}
```

---

### Delete Board

**Endpoint:** `DELETE /boards/{board_id}`

**Response (200 OK):**

```json
{
  "message": "Board with id 1 successfully deleted"
}
```

**Error Responses:**

- `403` - Not authorized to delete this board
- `404` - Board not found

---

## 🚀 How to Run

### 1. Start the server

```powershell
uvicorn main:app --reload
```

### 2. Access API Documentation

```
http://localhost:8000/docs
```

### 3. Test the API

Using curl:

```bash
# Create a board
curl -X POST http://localhost:8000/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"boardName": "My Project"}'

# Get all boards
curl -X GET http://localhost:8000/boards \
  -H "Authorization: Bearer your-token"
```

Using Python requests:

```python
import requests

headers = {"Authorization": "Bearer your-token"}
data = {"boardName": "My Project"}

response = requests.post(
    "http://localhost:8000/boards",
    json=data,
    headers=headers
)

print(response.json())
```

---

## 🔑 Key Concepts

### 1. Dependency Injection

FastAPI uses dependency injection to automatically provide:

- Database sessions
- Authentication data
- Configuration

**Example:**

```python
def create_board(
    body: BoardCreateRequest,          # Auto-parsed from JSON
    user_email: CurrentUser,           # Auto-extracted from auth
    session: Session = Depends(...)    # Auto-injected DB session
):
    pass
```

### 2. Automatic Validation

Pydantic models automatically validate:

- Required fields
- Data types
- Min/max lengths
- Custom validators

**Example:**

```python
class BoardCreateRequest(BaseModel):
    board_name: str = Field(min_length=1, max_length=200)
    # If client sends empty string or > 200 chars, automatic 422 error
```

### 3. Separation of Concerns

**Router** → Handles HTTP
**Service** → Contains business logic
**Model** → Defines data structure
**Middleware** → Cross-cutting concerns (auth, logging)

This makes code:

- Easier to test
- Easier to maintain
- Easier to understand

---

## ⚠️ TODO: Implement Authentication

The current auth middleware is a placeholder. You need to implement actual authentication:

### Option 1: JWT (Recommended)

```python
from jose import JWTError, jwt

def get_current_user_email(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not Authorized")

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Option 2: Session-based

```python
from fastapi import Request

def get_current_user_email(request: Request) -> str:
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not Authorized")

    # Validate session in Redis/Database
    user_email = validate_session(session_id)
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid session")

    return user_email
```

---

## 📊 Summary

**What you have:**

- ✅ Clean, organized file structure
- ✅ Separation of concerns (routes, services, models)
- ✅ Automatic validation with Pydantic
- ✅ Dependency injection for auth and database
- ✅ Type-safe code with Python type hints
- ✅ API documentation auto-generated at /docs
- ✅ Same functionality as Next.js implementation

**Next steps:**

1. Implement authentication (JWT or session)
2. Add environment variables for database URL
3. Add error handling middleware
4. Add logging
5. Add rate limiting
6. Add CORS configuration for frontend
7. Write tests with pytest

You now have a production-ready FastAPI structure! 🎉
