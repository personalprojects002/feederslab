# Complete Backend Development Guide: Building Production-Level APIs with UV, FastAPI, and SQLModel

**Technology Stack:** UV (Package Manager) + FastAPI (Web Framework) + SQLModel (Database ORM) + PostgreSQL (Database) + Pytest (Testing)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding the Technology Stack](#understanding-the-technology-stack)
3. [Step-by-Step Project Setup](#step-by-step-project-setup)
4. [Project Structure Explained](#project-structure-explained)
5. [Understanding the Backend Flow](#understanding-the-backend-flow)
6. [Database Configuration Deep Dive](#database-configuration-deep-dive)
7. [Building API Endpoints](#building-api-endpoints)
8. [Complete Working Examples](#complete-working-examples)

---

## Introduction

This guide is designed for complete beginners who want to understand how a production-level backend works. You'll learn step-by-step how to build a REST API that handles requests, processes data, stores it in a database, and returns responses to users.

Think of a backend as a waiter in a restaurant:

- **Request comes in** → Customer (frontend) orders food (data)
- **Processing** → Waiter takes order to kitchen (backend processes)
- **Database** → Chef stores recipe and ingredients (database stores data)
- **Response** → Waiter brings food back (response sent to frontend)

---

## Understanding the Technology Stack

### What is UV?

UV is a modern Python package manager (like npm for JavaScript). It's super fast and manages all the tools your project needs.

**Why UV?**

- ⚡ Much faster than pip
- 📦 Manages Python versions
- 🔒 Locks dependencies for consistency
- 🎯 Simple commands to install packages

### What is FastAPI?

FastAPI is a web framework that helps you create REST APIs (services that respond to requests from the internet).

**Why FastAPI?**

- 🚀 Very fast performance
- 📚 Auto-generates API documentation
- ✅ Built-in data validation
- 🔄 Supports async/concurrent requests

### What is SQLModel?

SQLModel combines SQL databases with Python objects. It lets you define your data structure once and use it everywhere.

**Why SQLModel?**

- 🔗 Works perfectly with FastAPI
- 📊 Type hints for data validation
- 🎯 Same code for API and database
- 🛡️ Prevents SQL injection attacks

### What is PostgreSQL?

PostgreSQL is a database that stores your actual data (users, posts, messages, etc.).

**Why PostgreSQL?**

- 🔐 Very secure and reliable
- 📈 Handles millions of records
- 🎯 Industry standard for production

### What is Pytest?

Pytest is a testing framework that checks if your code works correctly before you deploy it.

**Why Pytest?**

- ✅ Easy to write tests
- 🔍 Catches bugs early
- 📊 Provides detailed reports

---

## Step-by-Step Project Setup

### Step 1: Create Your Project Folder

```powershell
# Open PowerShell and create a new folder
mkdir MyBackendProject
cd MyBackendProject
```

### Step 2: Install UV (If Not Already Installed)

```powershell
# Download and install UV from Python
pip install uv
```

### Step 3: Initialize the Project with UV

```powershell
# This creates the basic project structure
uv init
```

This command creates:

- `pyproject.toml` - Configuration file for your project
- `.python-version` - Specifies which Python version to use
- `src/` folder (if chosen) - Where your code goes

### Step 4: Create the Complete Folder Structure

```powershell
# Create all necessary folders
mkdir src
mkdir src\config
mkdir src\models
mkdir src\routes
mkdir src\services
mkdir src\middlewares
mkdir src\utils
mkdir tests
mkdir docs
mkdir bin
```

### Step 5: Add Required Dependencies Using UV

```powershell
# Add each package one by one
uv add fastapi
uv add uvicorn
uv add sqlmodel
uv add sqlalchemy
uv add psycopg2-binary
uv add python-dotenv
uv add pytest
```

After these commands, your `pyproject.toml` will automatically contain all dependencies.

---

## Project Structure Explained

Here's what each folder does in your project:

```
MyBackendProject/
├── pyproject.toml           # Project configuration (Python version, dependencies)
├── main.py                  # Entry point - starts the FastAPI app
├── .env                     # Secret configurations (database URL, API keys)
├── README.md                # Documentation for your project
├──
├── src/                     # Your main source code
│   ├── config/              # Configuration files
│   │   ├── db.py           # Database connection setup
│   │   └── settings.py      # Environment variables (DATABASE_URL, etc.)
│   │
│   ├── models/              # Data structure definitions
│   │   ├── user.py         # User data structure
│   │   ├── post.py         # Post data structure
│   │   └── __init__.py      # Makes this folder a Python package
│   │
│   ├── routes/              # API endpoints (URLs)
│   │   ├── users.py        # /users endpoints
│   │   ├── posts.py        # /posts endpoints
│   │   └── __init__.py
│   │
│   ├── services/            # Business logic
│   │   ├── user_service.py # User-related operations
│   │   ├── post_service.py # Post-related operations
│   │   └── __init__.py
│   │
│   ├── middlewares/         # Request/response interceptors
│   │   ├── auth.py         # Authentication logic
│   │   └── __init__.py
│   │
│   └── utils/               # Helper functions
│       ├── validators.py    # Data validation functions
│       ├── helpers.py       # General utility functions
│       └── __init__.py
│
├── tests/                   # Test files
│   ├── conftest.py         # Test configuration and fixtures
│   ├── test_users.py       # Tests for user routes
│   └── test_posts.py       # Tests for post routes
│
├── docs/                    # Project documentation
│   └── API_DOCUMENTATION.md
│
└── bin/                     # Scripts (if needed)
    └── init_db.py          # Database initialization script
```

### What Each Part Does:

| Folder         | Purpose                  | Example                        |
| -------------- | ------------------------ | ------------------------------ |
| `config/`      | Settings and connections | Database URL, API keys         |
| `models/`      | Data definitions         | User has name, email, password |
| `routes/`      | API endpoints            | GET /users, POST /users        |
| `services/`    | Business logic           | Hash password, validate email  |
| `middlewares/` | Request processing       | Check authentication token     |
| `utils/`       | Helper functions         | Validate email format          |
| `tests/`       | Automated testing        | Check if endpoints work        |

---

## Understanding the Backend Flow

When a user interacts with your API, here's exactly what happens:

### Flow Diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST ARRIVES (from Frontend)               │
│                    Example: GET /users/123                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. FASTAPI ROUTER (routes/users.py)                              │
│    ✓ Receives the request                                        │
│    ✓ Validates URL parameters (123 must be a number)            │
│    ✓ Checks if endpoint exists                                  │
│                                                                   │
│    Example Code:                                                 │
│    @router.get("/users/{user_id}")                              │
│    def get_user(user_id: int):                                  │
│        return service.fetch_user(user_id)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE (middlewares/auth.py) - Optional                  │
│    ✓ Checks authentication token                                │
│    ✓ Validates user permissions                                 │
│    ✓ Logs the request                                           │
│                                                                   │
│    Example Code:                                                 │
│    def verify_token(token: str):                                │
│        if not token.is_valid():                                 │
│            raise HTTPException(status_code=401)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER (services/user_service.py)                     │
│    ✓ Contains business logic                                    │
│    ✓ Processes data                                             │
│    ✓ Calls database queries                                     │
│                                                                   │
│    Example Code:                                                 │
│    def fetch_user(user_id: int):                               │
│        user = db.query(User).filter(User.id == user_id).first()│
│        if not user:                                              │
│            raise ValueError("User not found")                   │
│        return user                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DATABASE LAYER (config/db.py)                                │
│    ✓ Connects to PostgreSQL                                     │
│    ✓ Executes SQL queries                                       │
│    ✓ Returns data to service                                    │
│                                                                   │
│    Example Database Query:                                      │
│    SELECT * FROM users WHERE id = 123;                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE SENT BACK (to Frontend)                              │
│                                                                   │
│    Example Response:                                             │
│    {                                                             │
│        "id": 123,                                                │
│        "name": "John Doe",                                       │
│        "email": "john@example.com"                              │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Real-World Example: Creating a New User

Let's trace through creating a new user:

**Step 1: Request Arrives**

```
POST /users
Body: {
    "name": "Alice",
    "email": "alice@example.com",
    "password": "secret123"
}
```

**Step 2: Route Handler (routes/users.py)**

```python
@router.post("/users")
def create_user(user_data: UserCreate):
    # ✓ Receives data
    # ✓ Checks that email is a valid format
    # ✓ Passes to service layer
    return user_service.create_user(user_data)
```

**Step 3: Service Layer (services/user_service.py)**

```python
def create_user(user_data: UserCreate):
    # ✓ Hash the password for security
    hashed_password = hash_password(user_data.password)

    # ✓ Create a User object
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password
    )

    # ✓ Save to database
    db.add(new_user)
    db.commit()

    # ✓ Return the created user
    return new_user
```

**Step 4: Database (PostgreSQL)**

```sql
INSERT INTO users (name, email, password)
VALUES ('Alice', 'alice@example.com', 'hashed_password_here');
```

**Step 5: Response Back**

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "created_at": "2026-02-04T10:30:00"
}
```

---

## Database Configuration Deep Dive

### What Your Database Configuration Does

The database configuration is the bridge between your Python code and PostgreSQL. It:

1. **Connects** to the database
2. **Creates sessions** (connections) when needed
3. **Closes sessions** after use
4. **Handles errors** gracefully

### Your Current Code Explained:

**File: `src/config/settings.py`**

```python
from starlette.config import Config
from starlette.datastructures import Secret

try:
    config = Config(".env")
except FileNotFoundError:
    config = Config()

DATABASE_URL = config("DATABASE_URL", cast=Secret)
TEST_DATABASE_URL = config("TEST_DATABASE_URL", cast=Secret)
```

**What This Does:**

- `from starlette.config import Config` → Imports the config reader tool
- `from starlette.datastructures import Secret` → Imports Secret (hides sensitive data in logs)
- `config = Config(".env")` → Reads `.env` file (contains your database password)
- `DATABASE_URL` → The connection string to your real database
- `TEST_DATABASE_URL` → The connection string to your test database
- `cast=Secret` → Hides the URL in logs and error messages (for security)

**Your .env File Should Look Like:**

```
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/mydatabase
TEST_DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/test_mydatabase
```

---

**File: `src/config/db.py`**

```python
from sqlmodel import Session, create_engine
from settings import DATABASE_URL

connection_string = str(DATABASE_URL).replace("postgresql://", "postgresql+psycopg2://")
engine = create_engine(
    connection_string, connect_args={"sslmode": "require"}, pool_recycle=300
)

def get_session():
    with Session(engine) as session:
        yield session
```

**What This Does (Line by Line):**

1. **`from sqlmodel import Session, create_engine`**
   - `Session` → A connection to the database (temporary)
   - `create_engine` → Creates the main connection pool (permanent)

2. **`connection_string = str(DATABASE_URL).replace(...)`**
   - PostgreSQL has two driver formats
   - `postgresql://` → Basic format
   - `postgresql+psycopg2://` → With psycopg2 driver (what we need)
   - This line converts it

3. **`engine = create_engine(...)`**
   - Creates a persistent connection pool to PostgreSQL
   - `sslmode="require"` → Requires secure connection (HTTPS)
   - `pool_recycle=300` → Refreshes connections every 300 seconds (prevents timeout)

4. **`def get_session():`**
   - A generator function that provides database sessions

5. **`with Session(engine) as session:`**
   - Opens a temporary connection from the pool
   - `with` → Context manager (auto-closes when done)

6. **`yield session`**
   - Pauses and gives the session to whoever requested it
   - After use, automatically closes the connection

### The `with` Statement and `yield` Explained:

Think of it like borrowing a book from a library:

```
# AUTOMATIC WAY (What your code does):
def get_session():
    with Session(engine) as session:  # ← Borrow book (open connection)
        yield session                 # ← Use book temporarily
                                      # ← Return book (auto closes connection)

# MANUAL WAY (What happens behind the scenes):
def get_session_manual():
    session = Session(engine)          # ← Open connection
    try:
        yield session                  # ← Use connection
    finally:
        session.close()                # ← ALWAYS close connection
```

The `with` statement guarantees the connection closes even if an error occurs!

---

## Building API Endpoints

### Structure of an API Endpoint

Every endpoint follows this pattern:

```python
# 1. Import what you need
from fastapi import APIRouter, HTTPException
from sqlmodel import Session
from src.config.db import get_session
from src.models.user import User
from src.services.user_service import UserService

# 2. Create a router
router = APIRouter(prefix="/users", tags=["users"])

# 3. Define endpoints
@router.get("/")
def list_all_users(session: Session = Depends(get_session)):
    """
    Get all users from database
    """
    service = UserService(session)
    users = service.get_all_users()
    return users

@router.get("/{user_id}")
def get_user_by_id(user_id: int, session: Session = Depends(get_session)):
    """
    Get a specific user by ID
    """
    service = UserService(session)
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/")
def create_new_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Create a new user
    """
    service = UserService(session)
    new_user = service.create_user(user_data)
    return new_user
```

### What Each Part Does:

| Code                                      | Purpose                       |
| ----------------------------------------- | ----------------------------- |
| `APIRouter`                               | Groups related endpoints      |
| `@router.get()`                           | HTTP GET request              |
| `@router.post()`                          | HTTP POST request             |
| `session: Session = Depends(get_session)` | Auto-injects database session |
| `HTTPException`                           | Returns error to client       |

---

## Complete Working Examples

### Example 1: User Model (Data Definition)

**File: `src/models/user.py`**

```python
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

# This is the data structure for a user
class User(SQLModel, table=True):
    """
    User Model - Defines how user data is structured in the database

    table=True means this will be a table in PostgreSQL
    Each attribute below becomes a database column
    """

    # Primary Key - Unique identifier (auto-incremented by database)
    id: Optional[int] = Field(default=None, primary_key=True)

    # User's name (required, max 100 characters)
    name: str = Field(max_length=100)

    # User's email (required, unique across all users)
    email: str = Field(unique=True, max_length=100)

    # Hashed password (required, not returned in API responses)
    password: str = Field(max_length=255)

    # When user was created (automatically set)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Whether user email is verified
    is_verified: bool = Field(default=False)


# This is for receiving data from the client (no ID or timestamp)
class UserCreate(SQLModel):
    """
    UserCreate Schema - What the client sends when creating a user

    Note: No id (auto-generated), no created_at (auto-added)
    This prevents the client from manually setting these values
    """

    name: str = Field(max_length=100)
    email: str = Field(max_length=100)
    password: str = Field(max_length=255)


# This is what we return to the client (no password)
class UserRead(SQLModel):
    """
    UserRead Schema - What we send back to the client

    Note: No password! This prevents exposing sensitive data
    """

    id: int
    name: str
    email: str
    is_verified: bool
    created_at: datetime
```

**What This Does:**

When you define a model, you're creating a blueprint:

- The database knows what columns to create
- FastAPI knows how to validate incoming data
- Python knows what fields to expect

Think of it like a restaurant menu template:

```
User Model = Template
├── id (auto-assigned table number)
├── name (customer name)
├── email (contact)
├── password (secure info - not shared)
├── created_at (when registered)
└── is_verified (if verified)
```

---

### Example 2: Service Layer (Business Logic)

**File: `src/services/user_service.py`**

```python
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from src.models.user import User, UserCreate
from src.utils.security import hash_password


class UserService:
    """
    User Service - Contains all business logic for user operations

    Separating logic from routes keeps code organized and testable
    """

    def __init__(self, session: Session):
        """
        Initialize service with a database session

        session: The database connection
        """
        self.session = session

    def get_all_users(self) -> list[User]:
        """
        Fetch all users from database

        Returns:
            list[User]: List of all users
        """
        # Create a select query
        statement = select(User)

        # Execute it and get results
        users = self.session.exec(statement).all()

        return users

    def get_user(self, user_id: int) -> User | None:
        """
        Fetch a specific user by ID

        Args:
            user_id: The user's ID

        Returns:
            User: The user if found, None otherwise
        """
        # Query: SELECT * FROM user WHERE id = user_id LIMIT 1
        statement = select(User).where(User.id == user_id)
        user = self.session.exec(statement).first()

        return user

    def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user with password hashing

        Args:
            user_data: The data from the client (name, email, password)

        Returns:
            User: The newly created user

        Raises:
            ValueError: If email already exists
        """

        try:
            # Hash the password for security
            hashed_password = hash_password(user_data.password)

            # Create a new User object
            new_user = User(
                name=user_data.name,
                email=user_data.email,
                password=hashed_password  # Store hashed, not plain text!
            )

            # Add to database
            self.session.add(new_user)

            # Commit changes (write to database)
            self.session.commit()

            # Refresh to get auto-generated ID and timestamp
            self.session.refresh(new_user)

            return new_user

        except IntegrityError:
            # This happens if email already exists (unique constraint)
            self.session.rollback()  # Undo the transaction
            raise ValueError(f"Email {user_data.email} already exists")

    def delete_user(self, user_id: int) -> bool:
        """
        Delete a user by ID

        Args:
            user_id: The user's ID

        Returns:
            bool: True if deleted, False if user didn't exist
        """

        user = self.get_user(user_id)

        if not user:
            return False

        # Remove from database
        self.session.delete(user)

        # Commit the change
        self.session.commit()

        return True

    def update_user(self, user_id: int, updated_data: dict) -> User | None:
        """
        Update a user's information

        Args:
            user_id: The user's ID
            updated_data: Dictionary of fields to update

        Returns:
            User: The updated user, or None if user doesn't exist
        """

        user = self.get_user(user_id)

        if not user:
            return None

        # Update each field
        for key, value in updated_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        # Save changes
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        return user
```

**What This Does:**

The service layer is where all the thinking happens:

- `get_all_users()` → Fetches all users
- `get_user()` → Fetches one user by ID
- `create_user()` → Creates a new user (with password hashing)
- `delete_user()` → Removes a user
- `update_user()` → Modifies user data

Each method:

1. ✓ Validates inputs
2. ✓ Performs database operations
3. ✓ Handles errors gracefully
4. ✓ Returns data to the route

---

### Example 3: Route/Endpoint (API Interface)

**File: `src/routes/users.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from src.config.db import get_session
from src.models.user import User, UserCreate, UserRead
from src.services.user_service import UserService


# Create a router for user-related endpoints
# prefix="/users" means all routes start with /users
# tags=["users"] is for API documentation grouping
router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def list_users(session: Session = Depends(get_session)) -> list[UserRead]:
    """
    Get all users

    Endpoint: GET /users

    Returns:
        list[UserRead]: List of all users (without passwords)

    Example Response:
    [
        {
            "id": 1,
            "name": "Alice",
            "email": "alice@example.com",
            "is_verified": true,
            "created_at": "2026-02-04T10:30:00"
        }
    ]
    """

    # Create service instance with the session
    service = UserService(session)

    # Get all users
    users = service.get_all_users()

    return users


@router.get("/{user_id}")
def get_user(user_id: int, session: Session = Depends(get_session)) -> UserRead:
    """
    Get a specific user by ID

    Endpoint: GET /users/1

    Args:
        user_id: The ID of the user to fetch

    Returns:
        UserRead: The user's information (without password)

    Raises:
        HTTPException: 404 if user not found

    Example Response:
    {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com",
        "is_verified": true,
        "created_at": "2026-02-04T10:30:00"
    }
    """

    service = UserService(session)
    user = service.get_user(user_id)

    # If user doesn't exist, return 404 error
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    return user


@router.post("/")
def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session)
) -> UserRead:
    """
    Create a new user

    Endpoint: POST /users

    Args:
        user_data: The user's information (name, email, password)

    Returns:
        UserRead: The newly created user

    Raises:
        HTTPException: 400 if email already exists

    Example Request Body:
    {
        "name": "Bob",
        "email": "bob@example.com",
        "password": "secret123"
    }

    Example Response:
    {
        "id": 2,
        "name": "Bob",
        "email": "bob@example.com",
        "is_verified": false,
        "created_at": "2026-02-04T10:31:00"
    }
    """

    service = UserService(session)

    try:
        # Create the user (password gets hashed in service)
        new_user = service.create_user(user_data)
        return new_user

    except ValueError as e:
        # Email already exists
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """
    Delete a user by ID

    Endpoint: DELETE /users/1

    Args:
        user_id: The ID of the user to delete

    Returns:
        dict: Success message

    Raises:
        HTTPException: 404 if user not found

    Example Response:
    {
        "message": "User with id 1 successfully deleted"
    }
    """

    service = UserService(session)
    deleted = service.delete_user(user_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    return {"message": f"User with id {user_id} successfully deleted"}


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    updated_data: dict,
    session: Session = Depends(get_session)
) -> UserRead:
    """
    Update a user's information

    Endpoint: PATCH /users/1

    Args:
        user_id: The ID of the user to update
        updated_data: Fields to update

    Returns:
        UserRead: The updated user

    Raises:
        HTTPException: 404 if user not found

    Example Request Body:
    {
        "name": "Bob Updated",
        "is_verified": true
    }

    Example Response:
    {
        "id": 2,
        "name": "Bob Updated",
        "email": "bob@example.com",
        "is_verified": true,
        "created_at": "2026-02-04T10:31:00"
    }
    """

    service = UserService(session)
    user = service.update_user(user_id, updated_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    return user
```

**What This Does:**

Routes are the **entry points** to your API:

- Each `@router.get()`, `@router.post()` etc. is an HTTP endpoint
- The function is called when a client makes a request
- `Depends(get_session)` automatically injects a database session
- The return value is automatically converted to JSON

---

### Example 4: Main Application Setup

**File: `main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel
from src.config.db import engine
from src.routes.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events

    This runs once when the app starts and once when it shuts down
    """

    # STARTUP: Run when app starts
    print("🚀 Starting up application...")
    print("📊 Creating database tables...")

    # Create all tables defined in models
    # If tables already exist, this does nothing
    SQLModel.metadata.create_all(engine)

    print("✅ Database tables created successfully")
    print("🎯 Application is ready to receive requests\n")

    # Yield control to the app (app runs here)
    yield

    # SHUTDOWN: Run when app shuts down
    print("\n🛑 Shutting down application...")
    print("💾 Cleaning up resources...")
    # Add any cleanup code here if needed
    print("✅ Application shut down gracefully")


# Create the FastAPI application
app = FastAPI(
    title="User Management API",
    description="A production-level API for managing users",
    version="1.0.0",
    lifespan=lifespan
)


# Include all routers (group of endpoints)
app.include_router(users_router)


# Optional: Health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint - used by load balancers

    Returns:
        dict: Status of the application

    Endpoint: GET /health
    """
    return {
        "status": "healthy",
        "message": "API is running"
    }


# Run with: uvicorn main:app --reload
# The --reload flag auto-restarts when you make changes
```

**What This Does:**

1. **`lifespan` function**: Runs before and after your app
   - **Startup**: Creates database tables
   - **Shutdown**: Cleans up resources

2. **`app = FastAPI()`**: Creates your application
   - `title`, `description`, `version` → For API documentation

3. **`app.include_router()`**: Adds groups of endpoints
   - You can have multiple routers for different features

4. **`@app.get("/health")`**: A simple endpoint that checks if app is running
   - Used by deployment systems to verify app is alive

---

### Example 5: Security - Password Hashing

**File: `src/utils/security.py`**

```python
from passlib.context import CryptContext

# Create a password hashing context
# "bcrypt" is the algorithm - one of the most secure
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password for secure storage

    NEVER store plain text passwords in database!

    Args:
        password: The plain text password from user

    Returns:
        str: The hashed password to store in database

    Example:
        hash_password("secret123")
        → "$2b$12$abcdefghijklmnop..."
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify if a plain text password matches a hashed password

    Used when user logs in

    Args:
        plain_password: Password user entered in login form
        hashed_password: The hashed password from database

    Returns:
        bool: True if password matches, False otherwise

    Example:
        verify_password("secret123", "$2b$12$abcdefghijklmnop...")
        → True
    """
    return pwd_context.verify(plain_password, hashed_password)
```

**Why This Matters:**

```
WRONG WAY (Never do this):
┌──────────────────┐
│ User enters      │
│ password: "abc"  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Store in DB as "abc"     │  ❌ DANGEROUS
│ Anyone with DB access    │     can see password
│ can see the password!    │
└──────────────────────────┘

RIGHT WAY (What you should do):
┌──────────────────┐
│ User enters      │
│ password: "abc"  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ Hash with bcrypt               │
│ "abc" → "$2b$12$abcdef..."    │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Store in DB as "$2b$12$abcdef..."│  ✓ SAFE
│ Even if someone sees this, they  │    Cannot reverse
│ cannot figure out the original   │    to get password
│ password!                        │
└──────────────────────────────────┘
```

---

### Example 6: Testing Your API

**File: `tests/conftest.py`**

```python
import pytest
from sqlmodel import Session, create_engine
from sqlmodel import SQLModel
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from src.config.db import get_session
from main import app


@pytest.fixture(name="session")
def session_fixture():
    """
    Fixture that provides a test database session

    Creates a temporary in-memory database for each test
    Automatically rolls back changes after test completes
    """

    # Create an in-memory SQLite database for testing
    engine = create_engine(
        "sqlite://",  # In-memory database
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # For SQLite in-memory
    )

    # Create all tables
    SQLModel.metadata.create_all(engine)

    # Create a session
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Fixture that provides a test client for API testing

    Automatically uses the test database instead of real database
    """

    # Override the get_session dependency with test session
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    # Create test client
    client = TestClient(app)

    yield client

    # Cleanup
    app.dependency_overrides.clear()
```

**File: `tests/test_users.py`**

```python
import pytest
from fastapi.testclient import TestClient


def test_create_user(client: TestClient):
    """
    Test creating a new user

    This test:
    1. Sends a POST request with user data
    2. Checks the response status code (201 = created)
    3. Verifies the returned user data
    """

    # Prepare user data
    user_data = {
        "name": "Alice",
        "email": "alice@example.com",
        "password": "secret123"
    }

    # Send POST request to create user
    response = client.post("/users/", json=user_data)

    # Assert response is successful (201 = created)
    assert response.status_code == 201

    # Get response data
    data = response.json()

    # Assert user was created with correct data
    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"
    assert data["id"] is not None  # ID should be auto-generated
    assert "password" not in data  # Password should never be returned


def test_get_user(client: TestClient):
    """
    Test fetching a user by ID
    """

    # First create a user
    user_data = {
        "name": "Bob",
        "email": "bob@example.com",
        "password": "password123"
    }
    create_response = client.post("/users/", json=user_data)
    user_id = create_response.json()["id"]

    # Now fetch the user
    response = client.get(f"/users/{user_id}")

    # Assert successful response
    assert response.status_code == 200

    # Verify data
    data = response.json()
    assert data["id"] == user_id
    assert data["name"] == "Bob"
    assert data["email"] == "bob@example.com"


def test_list_users(client: TestClient):
    """
    Test fetching all users
    """

    # Create a few users
    for i in range(3):
        user_data = {
            "name": f"User{i}",
            "email": f"user{i}@example.com",
            "password": "password123"
        }
        client.post("/users/", json=user_data)

    # Fetch all users
    response = client.get("/users/")

    # Assert successful response
    assert response.status_code == 200

    # Verify we got 3 users
    data = response.json()
    assert len(data) == 3


def test_delete_user(client: TestClient):
    """
    Test deleting a user
    """

    # Create a user
    user_data = {
        "name": "ToDelete",
        "email": "delete@example.com",
        "password": "password123"
    }
    create_response = client.post("/users/", json=user_data)
    user_id = create_response.json()["id"]

    # Delete the user
    response = client.delete(f"/users/{user_id}")

    # Assert successful deletion
    assert response.status_code == 200

    # Verify user is gone
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 404  # Not found


def test_user_not_found(client: TestClient):
    """
    Test fetching a user that doesn't exist
    """

    # Try to get a user with invalid ID
    response = client.get("/users/9999")

    # Assert 404 error
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
```

**How to Run Tests:**

```powershell
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_users.py

# Run specific test function
pytest tests/test_users.py::test_create_user
```

---

## How to Run Your Application

### Step 1: Create `.env` File

Create a file named `.env` in your project root:

```
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/mydatabase
TEST_DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/test_mydatabase
```

### Step 2: Start the Application

```powershell
# The --reload flag restarts the server when you make code changes
uvicorn main:app --reload
```

### Step 3: Access the API

**Interactive API Docs:**

```
http://localhost:8000/docs
```

You'll see Swagger UI where you can:

- ✓ See all endpoints
- ✓ Test endpoints without writing code
- ✓ See request/response examples

**Alternative API Docs:**

```
http://localhost:8000/redoc
```

---

## Complete Quick Reference

### Command Cheat Sheet

```powershell
# Initialize project
uv init

# Add packages
uv add fastapi uvicorn sqlmodel psycopg2-binary python-dotenv pytest

# Run application
uvicorn main:app --reload

# Run tests
pytest
pytest -v
pytest tests/test_users.py

# Remove a package
uv remove package_name

# Show installed packages
uv pip list
```

### File Creation Checklist

```
✓ src/config/settings.py     → Load environment variables
✓ src/config/db.py           → Database connection
✓ src/models/user.py         → User data structure
✓ src/services/user_service.py → Business logic
✓ src/routes/users.py        → API endpoints
✓ src/utils/security.py      → Password hashing
✓ tests/conftest.py          → Test configuration
✓ tests/test_users.py        → API tests
✓ main.py                    → Application entry point
✓ .env                       → Environment secrets
```

### HTTP Methods Quick Reference

| Method   | Purpose             | Example                           |
| -------- | ------------------- | --------------------------------- |
| `GET`    | Fetch data          | `GET /users` - Get all users      |
| `POST`   | Create data         | `POST /users` - Create new user   |
| `PUT`    | Replace entire data | `PUT /users/1` - Replace user 1   |
| `PATCH`  | Update partial data | `PATCH /users/1` - Update user 1  |
| `DELETE` | Remove data         | `DELETE /users/1` - Delete user 1 |

### Status Codes

| Code  | Meaning                        | Example                    |
| ----- | ------------------------------ | -------------------------- |
| `200` | OK - Success                   | User fetched successfully  |
| `201` | Created - Resource created     | New user created           |
| `400` | Bad Request - Invalid data     | Email already exists       |
| `404` | Not Found - Resource missing   | User doesn't exist         |
| `500` | Server Error - Something broke | Database connection failed |

---

## Summary

You now understand:

1. **Technology Stack** → UV, FastAPI, SQLModel, PostgreSQL
2. **Project Structure** → How folders organize your code
3. **Backend Flow** → Request → Route → Service → Database → Response
4. **Database Configuration** → How to connect and manage sessions
5. **Building Endpoints** → Creating routes that handle requests
6. **Business Logic** → Service layer that processes data
7. **Data Models** → Defining data structures
8. **Security** → Password hashing and protection
9. **Testing** → Writing tests to verify everything works

This is a **production-ready** structure used by real companies. You can now build any type of API (social media, e-commerce, etc.) using this foundation!
