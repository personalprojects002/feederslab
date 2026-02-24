# Database Models Documentation

## Overview

The application uses **SQLModel** (combination of SQLAlchemy and Pydantic) for database models.

## Connection

```python
# src/config/db.py
from sqlmodel import create_engine, Session

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session
```

---

## User Model

Stores user account information and subscription status.

**Table Name:** `user`

**File:** `src/models/user.py`

### Schema

```python
class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    email_verified: bool = Field(default=False)
    name: str
    image: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    has_access: bool = Field(default=False)
    stripe_customer_id: Optional[str] = Field(default=None)
```

### Fields

| Field                | Type     | Nullable | Default | Description                         |
| -------------------- | -------- | -------- | ------- | ----------------------------------- |
| `id`                 | String   | No       | -       | Primary key (UUID from Better Auth) |
| `email`              | String   | No       | -       | User email (unique, indexed)        |
| `email_verified`     | Boolean  | No       | `False` | Email verification status           |
| `name`               | String   | No       | -       | User display name                   |
| `image`              | String   | Yes      | `None`  | Profile image URL                   |
| `created_at`         | DateTime | No       | `now()` | Account creation timestamp          |
| `updated_at`         | DateTime | No       | `now()` | Last update timestamp               |
| `has_access`         | Boolean  | No       | `False` | Subscription status                 |
| `stripe_customer_id` | String   | Yes      | `None`  | Stripe customer ID                  |

### Indexes

- `email` - Unique index for fast lookups

### Relationships

- One-to-many with `Board` (user owns multiple boards)

### Usage

```python
# Find user by email
user = session.exec(
    select(User).where(User.email == email)
).first()

# Create new user
user = User(
    id=uuid4(),
    email="user@example.com",
    name="John Doe",
    email_verified=True
)
session.add(user)
session.commit()

# Update subscription status
user.has_access = True
user.stripe_customer_id = "cus_xxx"
session.add(user)
session.commit()
```

### Access Control

- `has_access = True` - User can create/manage boards
- `has_access = False` - User cannot create boards (free tier)

Updated by Stripe webhooks when subscription changes.

---

## Board Model

Stores feedback boards created by users.

**Table Name:** `board`

**File:** `src/models/board.py`

### Schema

```python
class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    board_name: str = Field(index=True)
    board_id: str = Field(unique=True, index=True)
    owner_email: str = Field(foreign_key="user.email")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

### Fields

| Field         | Type     | Nullable | Default | Description                  |
| ------------- | -------- | -------- | ------- | ---------------------------- |
| `id`          | Integer  | No       | Auto    | Primary key (auto-increment) |
| `board_name`  | String   | No       | -       | Display name of board        |
| `board_id`    | String   | No       | -       | Unique identifier (slug)     |
| `owner_email` | String   | No       | -       | Foreign key to user.email    |
| `created_at`  | DateTime | No       | `now()` | Creation timestamp           |
| `updated_at`  | DateTime | No       | `now()` | Last update timestamp        |

### Indexes

- `board_id` - Unique index for lookups
- `board_name` - Regular index for searching
- `owner_email` - Foreign key index

### Foreign Keys

- `owner_email` → `user.email` (CASCADE on delete recommended)

### Usage

```python
# Create board
board = Board(
    board_name="Product Feedback",
    board_id=generate_board_id(),
    owner_email="user@example.com"
)
session.add(board)
session.commit()

# Get user's boards
boards = session.exec(
    select(Board).where(Board.owner_email == email)
).all()

# Update board
board.board_name = "Updated Name"
board.updated_at = datetime.now(timezone.utc)
session.add(board)
session.commit()

# Delete board
session.delete(board)
session.commit()
```

### Board ID Generation

```python
import random
import string

def generate_board_id():
    return ''.join(random.choices(
        string.ascii_lowercase + string.digits,
        k=10
    ))
```

---

## Session Model (Better Auth)

Managed by Better Auth, not directly modified by app.

**Table Name:** `session`

### Schema (Reference Only)

```python
class Session(SQLModel, table=True):
    id: str = Field(primary_key=True)
    userId: str = Field(foreign_key="user.id")
    token: str = Field(unique=True, index=True)
    expiresAt: datetime
    ipAddress: Optional[str]
    userAgent: Optional[str]
```

### Fields

| Field       | Type     | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| `id`        | String   | Session ID                                   |
| `userId`    | String   | Foreign key to user                          |
| `token`     | String   | Session token (sent in Authorization header) |
| `expiresAt` | DateTime | Expiration timestamp                         |
| `ipAddress` | String   | Client IP address                            |
| `userAgent` | String   | Client user agent                            |

### Usage

Only queried by authentication middleware:

```python
# Validate session
query = text("""
    SELECT s.*, u.email, u.name
    FROM session s
    JOIN "user" u ON s."userId" = u.id
    WHERE s.token = :token
    AND s."expiresAt" > NOW()
    LIMIT 1
""")
result = session.execute(query, {"token": token}).fetchone()
```

---

## Database Migrations

### Initial Setup

Tables auto-created on application start:

```python
# main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield
```

### Manual Migrations

For schema changes, use Alembic:

```bash
# Install Alembic
pip install alembic

# Initialize
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

### Migration Script Example

```python
# run_migration.py
from sqlmodel import SQLModel
from src.config.db import engine

SQLModel.metadata.create_all(engine)
print("✅ Tables created successfully")
```

---

## Querying Patterns

### Select All

```python
from sqlmodel import select

boards = session.exec(select(Board)).all()
```

### Filter

```python
boards = session.exec(
    select(Board).where(Board.owner_email == email)
).all()
```

### Get One

```python
board = session.exec(
    select(Board).where(Board.board_id == board_id)
).first()
```

### Join

```python
from sqlalchemy import text

result = session.exec(text("""
    SELECT b.*, u.name
    FROM board b
    JOIN user u ON b.owner_email = u.email
    WHERE b.board_id = :board_id
"""), {"board_id": board_id}).first()
```

### Count

```python
count = session.exec(
    select(func.count(Board.id)).where(Board.owner_email == email)
).one()
```

### Order By

```python
boards = session.exec(
    select(Board)
    .where(Board.owner_email == email)
    .order_by(Board.created_at.desc())
).all()
```

---

## Best Practices

### 1. Always use context manager

```python
with Session(engine) as session:
    # Your queries
    session.commit()
```

### 2. Handle exceptions

```python
try:
    session.add(board)
    session.commit()
except IntegrityError:
    session.rollback()
    raise HTTPException(400, "Board ID already exists")
```

### 3. Use transactions

```python
session.begin()
try:
    # Multiple operations
    session.add(board)
    session.add(user)
    session.commit()
except:
    session.rollback()
    raise
```

### 4. Index frequently queried fields

```python
email: str = Field(unique=True, index=True)
```

### 5. Use UTC for timestamps

```python
from datetime import datetime, timezone

created_at = datetime.now(timezone.utc)
```

---

## Environment-Specific Databases

### Development

```env
DATABASE_URL=postgresql://localhost:5432/feederslab_dev
```

### Testing

```env
DATABASE_URL=postgresql://localhost:5432/feederslab_test
```

### Production

```env
DATABASE_URL=postgresql://user:pass@host:5432/feederslab?sslmode=require
```

---

## Database Tools

### View Data

- **pgAdmin**: PostgreSQL GUI
- **DBeaver**: Universal database tool
- **TablePlus**: Modern database client

### Backup

```bash
pg_dump -U user -d feederslab > backup.sql
```

### Restore

```bash
psql -U user -d feederslab < backup.sql
```
