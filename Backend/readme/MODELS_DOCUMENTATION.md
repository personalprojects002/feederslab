# User and Board Models - Complete Documentation

## Overview

This document explains the User and Board models converted from Mongoose (MongoDB) to SQLModel (PostgreSQL). It includes detailed explanations of relationships, schemas, and usage examples.

---

## Table of Contents

1. [Model Structure](#model-structure)
2. [Mongoose vs SQLModel Comparison](#mongoose-vs-sqlmodel-comparison)
3. [Database Relationships](#database-relationships)
4. [Model Definitions](#model-definitions)
5. [Usage Examples](#usage-examples)

---

## Model Structure

### Files Created

```
src/models/
├── __init__.py       # Package initialization and exports
├── user.py          # User model and schemas
└── board.py         # Board model and schemas
```

### What Each Model Contains

Each model file has:

1. **Database Model** (with `table=True`) → The actual table in PostgreSQL
2. **Create Schema** → For creating new records (request body)
3. **Read Schema** → For returning data to client (response body)
4. **Read with Relationship Schema** → For returning data with related objects
5. **Update Schema** → For updating existing records (request body)

---

## Mongoose vs SQLModel Comparison

### User Model Comparison

| Feature        | Mongoose (MongoDB)                   | SQLModel (PostgreSQL)                 |
| -------------- | ------------------------------------ | ------------------------------------- |
| **ID Type**    | `ObjectId` (string)                  | `int` (auto-increment)                |
| **Name Field** | `String, default: "Friend"`          | `str, default: "Friend"`              |
| **Email**      | `String, unique, required`           | `str, unique=True, index=True`        |
| **Image**      | `String, optional`                   | `Optional[str]`                       |
| **Timestamps** | `timestamps: true`                   | Explicit `created_at`, `updated_at`   |
| **Boards Ref** | `[{ type: ObjectId, ref: "Board" }]` | `Relationship(back_populates="user")` |

### Board Model Comparison

| Feature            | Mongoose (MongoDB)                       | SQLModel (PostgreSQL)                       |
| ------------------ | ---------------------------------------- | ------------------------------------------- |
| **ID Type**        | `ObjectId` (string)                      | `int` (auto-increment)                      |
| **Board Name**     | `String, default: "New Board", max: 200` | `str, default: "New Board", max_length=200` |
| **User Reference** | `ObjectId, ref: "User", required`        | `user_id: int, foreign_key="user.id"`       |
| **Timestamps**     | `timestamps: true`                       | Explicit `created_at`, `updated_at`         |
| **User Ref**       | `ref: "User"`                            | `Relationship(back_populates="boards")`     |

---

## Database Relationships

### One-to-Many Relationship (User → Boards)

```
┌─────────────────────┐
│      USER           │
│  id: 1              │
│  name: "John"       │
│  email: "john@..."  │
└─────────┬───────────┘
          │
          │ ONE User has MANY Boards
          │
          ├────────────┬────────────┬────────────┐
          ▼            ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ BOARD 1 │  │ BOARD 2 │  │ BOARD 3 │  │ BOARD 4 │
    │ id: 1   │  │ id: 2   │  │ id: 3   │  │ id: 4   │
    │user_id:1│  │user_id:1│  │user_id:1│  │user_id:1│
    └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

### How It Works in Code

**In User Model:**

```python
# User can have multiple boards
boards: List["Board"] = Relationship(back_populates="user")
```

**In Board Model:**

```python
# Board has a foreign key to user
user_id: int = Field(foreign_key="user.id")

# Board can access its user
user: Optional["User"] = Relationship(back_populates="boards")
```

### Database Schema (PostgreSQL)

```sql
-- User Table
CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) DEFAULT 'Friend',
    email VARCHAR(255) UNIQUE NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Board Table
CREATE TABLE board (
    id SERIAL PRIMARY KEY,
    board_name VARCHAR(200) DEFAULT 'New Board',
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Index on user.email for faster lookups
CREATE INDEX idx_user_email ON user(email);
```

---

## Model Definitions

### User Model (`src/models/user.py`)

#### Database Model: `User`

```python
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Friend", max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    image: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    boards: List["Board"] = Relationship(back_populates="user", ...)
```

**What each field does:**

- `id` → Auto-generated unique identifier (like MongoDB's `_id`)
- `name` → User's display name (default: "Friend")
- `email` → Unique email address (indexed for fast queries)
- `image` → Optional profile picture URL
- `created_at` → When user was created (auto-set)
- `updated_at` → When user was last modified (auto-set)
- `boards` → List of boards owned by this user (relationship)

#### API Schemas

**UserCreate** - For creating a new user

```python
class UserCreate(SQLModel):
    name: str = Field(default="Friend", max_length=100)
    email: str = Field(max_length=255)
    image: Optional[str] = Field(default=None, max_length=500)
```

**UserRead** - For returning user data

```python
class UserRead(SQLModel):
    id: int
    name: str
    email: str
    image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
```

**UserReadWithBoards** - User data with their boards

```python
class UserReadWithBoards(UserRead):
    boards: List["BoardRead"] = []
```

**UserUpdate** - For updating user data

```python
class UserUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
```

---

### Board Model (`src/models/board.py`)

#### Database Model: `Board`

```python
class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    board_name: str = Field(default="New Board", max_length=200)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional["User"] = Relationship(back_populates="boards")
```

**What each field does:**

- `id` → Auto-generated unique identifier
- `board_name` → Name of the board (max 200 chars, default: "New Board")
- `user_id` → Foreign key linking to the User table
- `created_at` → When board was created (auto-set)
- `updated_at` → When board was last modified (auto-set)
- `user` → The user who owns this board (relationship)

#### API Schemas

**BoardCreate** - For creating a new board

```python
class BoardCreate(SQLModel):
    board_name: str = Field(default="New Board", max_length=200)
    user_id: int = Field(...)
```

**BoardRead** - For returning board data

```python
class BoardRead(SQLModel):
    id: int
    board_name: str
    user_id: int
    created_at: datetime
    updated_at: datetime
```

**BoardReadWithUser** - Board data with user information

```python
class BoardReadWithUser(BoardRead):
    user: Optional["UserRead"] = None
```

**BoardUpdate** - For updating board data

```python
class BoardUpdate(SQLModel):
    board_name: Optional[str] = None
```

---

## Usage Examples

### Example 1: Create a User

```python
from sqlmodel import Session
from src.models import User, UserCreate
from src.config.db import engine

# Prepare user data
user_data = UserCreate(
    name="John Doe",
    email="john@example.com",
    image="https://example.com/john.jpg"
)

# Create user in database
with Session(engine) as session:
    # Convert UserCreate to User model
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        image=user_data.image
    )

    # Add to database
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    print(f"User created with ID: {new_user.id}")
    # Output: User created with ID: 1
```

### Example 2: Create a Board for a User

```python
from sqlmodel import Session
from src.models import Board, BoardCreate
from src.config.db import engine

# Prepare board data
board_data = BoardCreate(
    board_name="My Project Board",
    user_id=1  # The user we created above
)

# Create board in database
with Session(engine) as session:
    new_board = Board(
        board_name=board_data.board_name,
        user_id=board_data.user_id
    )

    session.add(new_board)
    session.commit()
    session.refresh(new_board)

    print(f"Board created with ID: {new_board.id}")
    # Output: Board created with ID: 1
```

### Example 3: Fetch User with All Their Boards

```python
from sqlmodel import Session, select
from src.models import User

with Session(engine) as session:
    # Query user by email
    statement = select(User).where(User.email == "john@example.com")
    user = session.exec(statement).first()

    if user:
        print(f"User: {user.name}")
        print(f"Email: {user.email}")
        print(f"Number of boards: {len(user.boards)}")

        # Access all boards
        for board in user.boards:
            print(f"  - {board.board_name}")
```

**Output:**

```
User: John Doe
Email: john@example.com
Number of boards: 1
  - My Project Board
```

### Example 4: Fetch Board with User Information

```python
from sqlmodel import Session, select
from src.models import Board

with Session(engine) as session:
    # Query board by ID
    statement = select(Board).where(Board.id == 1)
    board = session.exec(statement).first()

    if board:
        print(f"Board: {board.board_name}")
        print(f"Owner: {board.user.name}")
        print(f"Owner Email: {board.user.email}")
```

**Output:**

```
Board: My Project Board
Owner: John Doe
Owner Email: john@example.com
```

### Example 5: Get All Boards for a Specific User

```python
from sqlmodel import Session, select
from src.models import Board

user_id = 1

with Session(engine) as session:
    # Query all boards for a user
    statement = select(Board).where(Board.user_id == user_id)
    boards = session.exec(statement).all()

    print(f"Found {len(boards)} boards")
    for board in boards:
        print(f"  - {board.board_name}")
```

### Example 6: Update a Board Name

```python
from sqlmodel import Session, select
from src.models import Board

board_id = 1

with Session(engine) as session:
    # Find the board
    statement = select(Board).where(Board.id == board_id)
    board = session.exec(statement).first()

    if board:
        # Update the name
        board.board_name = "Updated Project Board"
        board.updated_at = datetime.utcnow()  # Update timestamp

        session.add(board)
        session.commit()
        session.refresh(board)

        print(f"Board updated: {board.board_name}")
```

### Example 7: Delete a User (Cascades to Boards)

```python
from sqlmodel import Session, select
from src.models import User

user_id = 1

with Session(engine) as session:
    # Find the user
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()

    if user:
        print(f"Deleting user: {user.name}")
        print(f"This will also delete {len(user.boards)} boards")

        # Delete user (automatically deletes all their boards)
        session.delete(user)
        session.commit()

        print("User and all boards deleted")
```

---

## API Response Examples

### Creating a User (POST /users)

**Request:**

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "image": "https://example.com/alice.jpg"
}
```

**Response (UserRead):**

```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "image": "https://example.com/alice.jpg",
  "created_at": "2026-02-04T10:30:00",
  "updated_at": "2026-02-04T10:30:00"
}
```

### Creating a Board (POST /boards)

**Request:**

```json
{
  "board_name": "Design Tasks",
  "user_id": 1
}
```

**Response (BoardRead):**

```json
{
  "id": 1,
  "board_name": "Design Tasks",
  "user_id": 1,
  "created_at": "2026-02-04T10:35:00",
  "updated_at": "2026-02-04T10:35:00"
}
```

### Getting User with Boards (GET /users/1?include_boards=true)

**Response (UserReadWithBoards):**

```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "image": "https://example.com/alice.jpg",
  "created_at": "2026-02-04T10:30:00",
  "updated_at": "2026-02-04T10:30:00",
  "boards": [
    {
      "id": 1,
      "board_name": "Design Tasks",
      "user_id": 1,
      "created_at": "2026-02-04T10:35:00",
      "updated_at": "2026-02-04T10:35:00"
    },
    {
      "id": 2,
      "board_name": "Development Tasks",
      "user_id": 1,
      "created_at": "2026-02-04T10:36:00",
      "updated_at": "2026-02-04T10:36:00"
    }
  ]
}
```

### Getting Board with User (GET /boards/1?include_user=true)

**Response (BoardReadWithUser):**

```json
{
  "id": 1,
  "board_name": "Design Tasks",
  "user_id": 1,
  "created_at": "2026-02-04T10:35:00",
  "updated_at": "2026-02-04T10:35:00",
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "image": "https://example.com/alice.jpg",
    "created_at": "2026-02-04T10:30:00",
    "updated_at": "2026-02-04T10:30:00"
  }
}
```

---

## Key Differences from Mongoose

### 1. **ID Type**

- **Mongoose**: Uses `ObjectId` (24-character hex string)
- **SQLModel**: Uses integer auto-increment (or UUID if needed)

### 2. **Relationships**

- **Mongoose**: Uses `ref` and `populate()` to load related documents
- **SQLModel**: Uses `Relationship()` and foreign keys with auto-loading

### 3. **Timestamps**

- **Mongoose**: Automatic with `timestamps: true`
- **SQLModel**: Manual fields with `default_factory=datetime.utcnow`

### 4. **Schema Validation**

- **Mongoose**: Built into schema definition
- **SQLModel**: Uses Pydantic for validation + database constraints

### 5. **Cascade Delete**

- **Mongoose**: Requires middleware or manual deletion
- **SQLModel**: Built into relationship with `cascade="all, delete-orphan"`

### 6. **Unique Constraints**

- **Mongoose**: `unique: true` in schema
- **SQLModel**: `unique=True` in Field definition

---

## Summary

✅ **User Model** - Manages user accounts with profile information  
✅ **Board Model** - Manages boards owned by users  
✅ **One-to-Many Relationship** - User has many boards  
✅ **Foreign Key Constraint** - Ensures data integrity  
✅ **Cascade Delete** - Deleting user removes all their boards  
✅ **Separate Schemas** - Create, Read, Update schemas for clean API  
✅ **Timestamps** - Automatic tracking of creation and updates

Your models are now ready to use in a production FastAPI application!
