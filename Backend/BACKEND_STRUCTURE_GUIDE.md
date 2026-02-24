# Backend Structure Guide - Complete Documentation

> 📚 **Purpose**: This guide explains every folder and file in the Backend project so newbies can understand the complete structure and how to use each component.

---

## 📁 Root Level Files

### **main.py**
This is the **entry point** of the entire application. It creates and configures the FastAPI app. When you start the server, Python runs this file first. It sets up:
- CORS (allows frontend to talk to backend)
- Database tables creation
- All API routes (boards, billing, webhooks)
- Application metadata (title, description, version)

**How to use**: Don't modify this unless adding new routers or middleware. Run it with `uvicorn main:app --reload` to start the server.

---

### **pyproject.toml**
This is the **project configuration file** for Python. It tells Python:
- Project name and version
- Minimum Python version needed (3.12)
- All packages (dependencies) the project needs
- Package versions to install

**How to use**: When you add new packages, they get listed here automatically if using `uv` or `pip`. Other developers run `pip install` to get the same packages. Don't edit manually unless you know what you're doing.

---

### **uv.lock**
This is the **dependency lock file** created by the `uv` package manager. It stores the exact versions of all installed packages and their sub-dependencies. We use it to make sure all team members get identical package versions. If we don't use it, different people may get different versions and the project may break.

**How to use**: Let `uv` create and update it automatically. Never edit manually. Commit it to git so everyone has the same environment.

---

### **.gitignore**
This file tells **Git which files to ignore** and not track. It prevents uploading unnecessary files like:
- `__pycache__/` (Python compiled bytecode)
- `.venv` (virtual environment folder)
- `*.pyc` (compiled Python files)
- Build files and distributions

**How to use**: Add patterns for files you don't want in version control. Examples: API keys, local config files, temp files.

---

### **.python-version**
This file specifies **which Python version** the project uses. It contains just `3.12`, telling tools like `pyenv` or `uv` to use Python 3.12 for this project.

**How to use**: Make sure you have Python 3.12 installed. Some tools read this file automatically to switch Python versions.

---

### **README.md**
The main **project documentation file**. Currently empty, but should contain:
- Project overview
- Setup instructions
- How to run the project
- Important notes for developers

**How to use**: Read it first when joining the project. Update it when you add features or change setup steps.

---

## 📁 Root Level Folders

### **venv/** and **.venv/**
These are **virtual environment folders**. A virtual environment is an isolated Python installation for this project only. It contains all the packages listed in `pyproject.toml` without affecting your system Python.

**How to use**: 
- Activate with `.venv\Scripts\activate.bat` (Windows) or `source .venv/bin/activate` (Mac/Linux)
- Install packages while activated
- Deactivate with `deactivate`
- Don't commit to Git (already in `.gitignore`)

---

### **__pycache__/**
This folder contains **compiled Python bytecode**. Python automatically creates it to make your code run faster on subsequent runs. It's like a cache.

**How to use**: Ignore it completely. Python manages it automatically. It's in `.gitignore` so it won't be committed to Git.

---

## 📁 migrations/

This folder contains **database migration scripts**. Migrations modify the database structure (add tables, change columns, etc.) without losing data.

### **migrate_user_id.sql**
This SQL script changes the `board.user_id` column from INTEGER to TEXT type. It:
1. Drops the foreign key constraint
2. Changes the column type
3. Re-adds the foreign key constraint

**How to use**: Run migrations when the database structure needs to change. Use the scripts in `/scripts` folder to execute them safely.

---

## 📁 scripts/

This folder contains **helper scripts** to automate common tasks.

### **run_backend.bat**
This is a **Windows batch file** to start the backend server easily. Instead of typing long commands, just double-click this file.

**What it does**:
- Activates the virtual environment
- Starts the FastAPI server with hot-reload
- Shows status messages

**How to use**: Double-click on Windows. The server starts automatically. Press Ctrl+C to stop.

---

### **run_migration.py**
This Python script runs **database migrations** programmatically. It changes `board.user_id` from INTEGER to TEXT type.

**What it does**:
- Connects to database
- Executes SQL commands in transaction
- Shows progress messages
- Handles errors gracefully

**How to use**: Run with `python scripts/run_migration.py` when you need to update the database schema.

---

### **run_stripe_migration.py**
Similar to `run_migration.py` but specifically for **Stripe-related database changes**.

**How to use**: Run when Stripe payment features need database updates.

---

## 📁 tests/

This folder contains **automated tests** to verify the code works correctly.

### **conftest.py**
This is the **pytest configuration file**. It sets up test fixtures - reusable components for tests. It creates:
- A test database (separate from production)
- A test session for each test
- A test client to make fake HTTP requests
- Automatic cleanup after tests

**How to use**: pytest reads this automatically. Write your tests in other files and use the `client` and `session` fixtures it provides.

---

### **test_routeName.py**
This file contains **test cases for API routes**. Tests verify that endpoints work correctly by:
- Sending requests
- Checking responses
- Validating data

**How to use**: Run with `pytest` command. Add new test functions here when you create new routes.

---

## 📁 readme/

This folder contains **detailed documentation** about different aspects of the backend.

### **API_DOCUMENTATION.md**
Complete guide on **how all API endpoints work**. Explains request/response formats, authentication, and examples.

---

### **API_REFERENCE.md**
Quick **reference sheet** for all API endpoints. Like a cheat sheet for developers.

---

### **COMPLETE_BACKEND_GUIDE.md**
Comprehensive guide covering **everything about the backend** - architecture, setup, deployment, troubleshooting.

---

### **MODELS.md** and **MODELS_DOCUMENTATION.md**
Documentation about **database models** - what tables exist, their columns, relationships, and how to use them.

---

### **README.md**
Overview of the readme folder and index to other documentation files.

---

### **SETUP.md**
Step-by-step **installation and setup instructions** for new developers.

---

### **readme/root/** subfolder
Contains **Stripe payment integration documentation**:
- Setup guides
- Webhook configuration
- Troubleshooting webhooks
- Quick reference guides
- Implementation checklists

**Files include**:
- `STRIPE_SETUP_GUIDE.md` - How to set up Stripe
- `HOW_TO_VERIFY_STRIPE.md` - Testing Stripe integration
- `FIX_WEBHOOK_LOCALHOST.md` - Fixing webhook issues locally
- `WHY_WEBHOOKS_FAIL_EXPLAINED.md` - Understanding webhook failures
- And more Stripe-related guides

---

## 📁 src/

This is the **main source code folder**. All application logic lives here.

---

## 📁 src/config/

Contains **configuration files** for the application.

### **db.py**
This file handles **database connections**. It:
- Creates the database engine (connection pool)
- Converts the database URL to the correct format
- Provides `get_session()` function for database access
- Manages connection lifecycle (open, use, close)

**How to use**: Import `get_session` in your routes to access the database. Import `engine` when you need direct database access (migrations, etc.).

```python
from src.config.db import get_session

def my_route(session = Depends(get_session)):
    # Use session to query database
```

---

### **settings.py**
This file loads **environment variables** from the `.env` file. It provides:
- `DATABASE_URL` - Production database connection string
- `TEST_DATABASE_URL` - Test database connection string
- `BETTER_AUTH_SECRET` - Secret key for JWT tokens
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_PRICE_ID` - Stripe product price ID
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**How to use**: Import settings in other files to access configuration values. Never hardcode secrets - always use this file.

```python
from src.config.settings import STRIPE_SECRET_KEY
```

---

### **__pycache__/**
Python's compiled bytecode cache. Ignore it.

---

## 📁 src/middlewares/

Contains **middleware functions** - code that runs before/after each request.

### **auth.py**
This file handles **authentication middleware**. It:
- Verifies JWT tokens in requests
- Extracts user information from tokens
- Protects routes that require login
- Returns 401 Unauthorized if token is invalid

**How to use**: Add as a dependency to protected routes:

```python
from src.middlewares.auth import get_current_user

@router.get("/protected")
def protected_route(user = Depends(get_current_user)):
    # user is automatically extracted from token
```

---

## 📁 src/models/

Contains **database models** - Python classes that represent database tables.

### **__init__.py**
Makes this folder a Python package. May import models for easy access.

---

### **user.py**
Defines the **User model** - represents the `user` table in database. Contains fields like:
- `id` - User's unique identifier
- `name` - User's name
- `email` - User's email
- Created/updated timestamps
- Other user-related fields

**How to use**: Import and use in database queries:

```python
from src.models.user import User

def get_user(user_id: str, session: Session):
    return session.get(User, user_id)
```

---

### **board.py**
Defines the **Board model** - represents the `board` table. Contains fields like:
- `id` - Board's unique ID
- `user_id` - Owner's user ID (foreign key)
- `name` - Board name
- `content` - Board content/data
- Created/updated timestamps

**How to use**: Import for board-related database operations:

```python
from src.models.board import Board

def create_board(data: dict, session: Session):
    board = Board(**data)
    session.add(board)
    session.commit()
```

---

## 📁 src/routes/

Contains **API route handlers** - functions that respond to HTTP requests.

### **boards.py**
Handles **board-related endpoints**:
- Create board
- Get boards
- Update board
- Delete board
- Get single board

**How to use**: These are automatically included in `main.py`. Make requests to `/boards/*` endpoints.

---

### **billing.py**
Handles **Stripe billing endpoints**:
- Create checkout session
- Get subscription status
- Manage subscriptions
- Customer portal access

**How to use**: Frontend calls these routes for payment features. Endpoints are at `/billing/*`.

---

### **webhook.py**
Handles **Stripe webhook events**. When Stripe sends events (payment succeeded, subscription canceled, etc.), this route processes them.

**How to use**: Configure Stripe to send webhooks to your `/webhook` endpoint. This route verifies and processes events automatically.

---

### **schemas.py**
Defines **Pydantic schemas** - data validation models for API requests/responses. Ensures data has correct format:
- Required fields are present
- Data types are correct
- Values are valid

**How to use**: Import schemas in route handlers to validate request data:

```python
from src.routes.schemas import CreateBoardRequest

@router.post("/boards")
def create_board(data: CreateBoardRequest):
    # data is automatically validated
```

---

## 📁 src/services/

Contains **business logic** - complex operations separated from routes.

### **board_service.py**
Contains **board-related business logic**:
- Board creation logic
- Validation
- Complex queries
- Data transformations

**Why separate from routes?**: Keeps routes clean and simple. Business logic can be reused and tested independently.

**How to use**: Import functions in routes:

```python
from src.services.board_service import create_board_for_user

@router.post("/boards")
def create_board_endpoint(data: dict, session: Session):
    return create_board_for_user(data, session)
```

---

### **stripe_service.py**
Contains **Stripe payment logic**:
- Creating checkout sessions
- Managing subscriptions
- Processing webhooks
- Handling Stripe API calls

**How to use**: Import in billing routes to handle payment operations.

---

## 📁 src/utils/

Contains **utility functions** - small helper functions used throughout the app.

### **jwt.py**
Contains **JWT token functions**:
- `create_token()` - Generate JWT tokens
- `verify_token()` - Verify and decode tokens
- `decode_token()` - Extract data from tokens

**How to use**: Import in auth middleware and routes:

```python
from src.utils.jwt import verify_token

token_data = verify_token(token_string)
```

---

### **__pycache__/**
Python's compiled bytecode cache. Ignore it.

---

## 🎯 How Everything Works Together

1. **Request arrives** → `main.py` receives it
2. **Middleware runs** → `auth.py` checks authentication
3. **Route handler** → Appropriate file in `routes/` processes request
4. **Business logic** → `services/` handles complex operations
5. **Database access** → `models/` + `config/db.py` interact with database
6. **Response sent** → Data validated by `schemas.py` and returned

---

## 🚀 Quick Start for Newbies

1. **Install Python 3.12**
2. **Create virtual environment**: `python -m venv .venv`
3. **Activate it**: `.venv\Scripts\activate.bat` (Windows)
4. **Install packages**: `pip install -e .`
5. **Create `.env` file** with your configuration
6. **Run migrations**: `python scripts/run_migration.py`
7. **Start server**: Double-click `scripts/run_backend.bat` OR run `uvicorn main:app --reload`
8. **Visit**: `http://localhost:8000/docs` to see API documentation

---

## 📝 Common Tasks

### Add a new API endpoint
1. Create function in appropriate `routes/*.py` file
2. Add route decorator (`@router.get()`, `@router.post()`, etc.)
3. Import router in `main.py` if it's new

### Add a new database table
1. Create model class in `src/models/`
2. Import model in `main.py` so it's created
3. Restart server - table is created automatically

### Add a new environment variable
1. Add to `src/config/settings.py`
2. Add to your `.env` file
3. Use it by importing from settings

### Run tests
```bash
pytest
```

### Check API documentation
Visit `http://localhost:8000/docs` when server is running

### Create a helper function
**Where to put helper functions?** We have two folders:

#### **src/utils/** - For general utility functions
Use this for reusable helper functions that don't contain business logic:
- Format dates/strings
- Validation helpers
- Data conversion
- Hash passwords
- Generate random strings
- File operations

**Example**: Create `src/utils/formatters.py`
```python
def format_phone_number(phone: str) -> str:
    """Format phone to (123) 456-7890"""
    return f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    return text.lower().replace(" ", "-")
```

**How to use**:
```python
from src.utils.formatters import format_phone_number

formatted = format_phone_number("1234567890")
```

#### **src/services/** - For business logic functions
Use this for functions with business rules and database operations:
- Process payments
- Create complex records
- Send notifications
- Calculate pricing
- Apply business rules

**Example**: Create `src/services/notification_service.py`
```python
from src.models.user import User

def send_welcome_email(user: User):
    """Send welcome email to new user"""
    # Business logic here
    pass

def notify_subscription_ending(user_id: str, days_left: int):
    """Notify user about subscription ending"""
    # Business logic here
    pass
```

**How to use**:
```python
from src.services.notification_service import send_welcome_email

@router.post("/register")
def register(user_data: dict):
    user = create_user(user_data)
    send_welcome_email(user)
    return user
```

**📝 Quick Rule**: 
- **utils/** = Simple helpers (like frontend's `lib/` folder)
- **services/** = Complex business operations

---

## ⚠️ Important Notes

- **Never commit `.env` file** - Contains secrets
- **Never edit `__pycache__` or lock files** - Auto-generated
- **Always activate virtual environment** before running commands
- **Read the `/readme` documentation** for detailed guides
- **Test your changes** before committing
- **Use migrations** for database changes - don't modify tables manually

---

## 🆘 Getting Help

1. Check `/readme` folder for detailed documentation
2. Read API docs at `/docs` endpoint
3. Look at existing code for examples
4. Ask team members
5. Check error messages carefully - they usually explain the problem

---

**Happy Coding! 🎉**