# Complete Project Setup Guide - From Scratch

> **Purpose**: This guide will teach you how to build a complete project from the beginning. You will learn which software to install, how to create folders, and how to set up both Frontend and Backend. Follow every step in order.

---

## Step 1: Install Required Software (New Computer Setup)

You need to install software before you can start building. Software is a program that helps you write and run code.

### Install Node.js and npm

**Node.js** is software that runs JavaScript code on your computer. **npm** (Node Package Manager) is a tool that comes with Node.js. It helps you download and install packages. Packages are ready-made code that other developers wrote. Instead of writing everything yourself, you use packages to save time.

1. Go to: https://nodejs.org/
2. Download the **LTS version** (LTS means Long Term Support - it is stable and safe to use)
3. Run the installer file you downloaded
4. Click "Next" on all screens and finish installation
5. Open Command Prompt (search "cmd" in Windows start menu)
6. Type: `node --version` and press Enter (This checks if Node.js installed correctly)
7. Type: `npm --version` and press Enter (This checks if npm installed correctly)
8. If you see version numbers like "v20.11.0" and "10.2.4", installation worked correctly

### Install Python

**Python** is a programming language. We use it for the Backend. The Backend is the part of your project that handles data, databases, and business logic.

1. Go to: https://www.python.org/downloads/
2. Download **Python 3.12** or higher version
3. **IMPORTANT**: During installation, check the box that says "Add Python to PATH" - this is very important
4. Click "Install Now" and wait for completion
5. Open Command Prompt
6. Type: `python --version` and press Enter
7. If you see "Python 3.12.0" or similar, installation worked correctly

### Install uv (Python Package Manager)

**uv** is a modern tool for managing Python packages. It is faster than the old tool called pip. Package manager means it helps you install, update, and remove packages for your project.

1. Open Command Prompt
2. Type this command and press Enter:
   ```
   pip install uv
   ```
3. Wait for installation to complete
4. Type: `uv --version` and press Enter
5. If you see a version number, installation worked correctly

### Install Git (Optional but Recommended)

**Git** is version control software. Version control means it tracks all changes you make to your code. You can go back to old versions if something breaks. **GitHub** is a website where you can store your code online.

1. Go to: https://git-scm.com/downloads
2. Download and install Git for Windows
3. During installation, keep all default settings
4. After installation, open Command Prompt
5. Type: `git --version` and press Enter
6. If you see a version number, installation worked correctly

### Install Code Editor (VS Code)

**Code editor** is software where you write your code. VS Code (Visual Studio Code) is a popular free editor made by Microsoft.

1. Go to: https://code.visualstudio.com/
2. Download and install VS Code
3. Open VS Code after installation
4. Install these extensions (Extensions are tools that add extra features to VS Code):
   - **Python** (by Microsoft) - Helps you write Python code
   - **Pylance** (by Microsoft) - Makes Python coding easier
   - **ES7+ React/Redux/React-Native snippets** - Helps write React code faster
   - **Tailwind CSS IntelliSense** - Helps with Tailwind CSS styling

To install extensions: Click the square icon on left sidebar → Search extension name → Click Install

---

## Step 2: Create Project Root Folder Structure

Now you will create the main project folder and organize it properly. Proper structure means your project is clean and easy to understand.

### Create Main Project Folder

1. Open File Explorer (the folder icon in Windows taskbar)
2. Go to location where you want to create project (Example: `D:\Projects\`)
3. Right-click empty space → New → Folder
4. Name it after your project (Example: `MyWebApp` or `EcommerceSite`)
5. Open this folder

### Create Standard Folders

Inside your main project folder, create these 4 items. This is the standard structure used by professional developers.

1. **Frontend** folder - This will contain all website display code (what users see)
2. **Backend** folder - This will contain all server code (data handling, database, security)
3. **scripts** folder - This will contain helper files (files that automate tasks)
4. **README.md** file - This will explain what your project does

To create folders: Right-click → New → Folder → Type folder name
To create README.md: Right-click → New → Text Document → Rename to `README.md` (delete .txt extension)

**Your folder structure now looks like this:**
```
MyWebApp/
├── Frontend/
├── Backend/
├── scripts/
└── README.md
```

### Write Basic README.md

Open README.md file in any text editor and write this:

```
# Project Name

Write a short description of what your project does.

## Folders

- **Frontend**: Website display code built with Next.js
- **Backend**: Server code built with FastAPI (Python)
- **scripts**: Helper files for automation

## Setup

Read FRONTEND_SETUP.md and BACKEND_SETUP.md for installation instructions.
```

Save and close the file. This README helps anyone understand your project structure.

---

## Step 3: Set Up Frontend with Next.js

Now you will set up the Frontend folder. Frontend means the part users see in their web browser - buttons, forms, images, etc.

### Initialize Next.js Project

**Next.js** is a framework (pre-built structure) for building websites with React. React is a JavaScript library for building user interfaces.

1. Open Command Prompt or Terminal
2. Navigate to your project folder by typing:
   ```
   cd D:\Projects\MyWebApp
   ```
   (Replace `D:\Projects\MyWebApp` with your actual project path)
3. Navigate into Frontend folder:
   ```
   cd Frontend
   ```
4. Create a new Next.js project with TypeScript. Type this command:
   ```
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
   ```

Let me explain this command:
- `npx` = Run a package without installing it permanently
- `create-next-app@latest` = Create newest version of Next.js
- `.` = Create in current folder (Frontend folder)
- `--typescript` = Use TypeScript (TypeScript is JavaScript with type checking - catches errors early)
- `--tailwind` = Include Tailwind CSS (Tailwind is a styling tool for making websites look good)
- `--app` = Use App Router (newest Next.js structure)
- `--no-src-dir` = Don't create extra src folder

5. The installer will ask questions. Answer like this:
   - Would you like to use ESLint? → **Yes** (ESLint checks your code for mistakes)
   - Would you like to use Turbopack? → **No** (Turbopack is experimental)
   - Would you like to customize the default import alias? → **No**

6. Wait for installation to complete (may take 2-5 minutes)

### Install Required Frontend Packages

Now you need to install additional packages that your project needs. Each package adds specific features to your project.

1. Make sure you are still in Frontend folder (in Command Prompt)
2. Install all packages at once with this command:
   ```
   npm install axios react-hot-toast better-auth @better-auth/client @daveyplate/better-auth-ui stripe dotenv is-disposable-email pg
   ```

Let me explain what each package does:
- **axios** = Makes HTTP requests to Backend (sends and receives data)
- **react-hot-toast** = Shows notification messages to users (success, error messages)
- **better-auth** = Handles user login and signup (authentication)
- **@better-auth/client** = Client-side authentication code
- **@daveyplate/better-auth-ui** = Pre-built login/signup forms
- **stripe** = Handles payments (credit card processing)
- **dotenv** = Loads environment variables (secret keys and settings)
- **is-disposable-email** = Checks if email is fake/temporary
- **pg** = Connects to PostgreSQL database

3. Wait for installation (takes 1-3 minutes)

4. Install development packages (dev packages help during development but are not needed in production):
   ```
   npm install --save-dev daisyui @types/node @types/react @types/react-dom @types/pg
   ```

What these dev packages do:
- **daisyui** = Component library for Tailwind (pre-made buttons, cards, etc.)
- **@types/node** = TypeScript types for Node.js
- **@types/react** = TypeScript types for React
- **@types/react-dom** = TypeScript types for React DOM
- **@types/pg** = TypeScript types for PostgreSQL

### Configure Tailwind with DaisyUI

DaisyUI adds pre-made components to Tailwind. You need to configure it.

1. Open `tailwind.config.ts` file in Frontend folder
2. Find the line that says `plugins: []`
3. Change it to:
   ```typescript
   plugins: [require('daisyui')]
   ```
4. Save the file

### Create Frontend Folder Structure

Inside Frontend folder, create these folders if they don't exist:

1. **lib/** - Put helper functions here (utility code you use repeatedly)
2. **types/** - Put TypeScript type definitions here (defines data shapes)
3. **app/** - Already created by Next.js (contains pages and routes)
4. **public/** - Already created by Next.js (contains images, icons, static files)
5. **scripts/** - Put automation scripts here

Your Frontend folder structure now looks like this:
```
Frontend/
├── app/              (Pages and routing)
├── lib/              (Helper functions)
├── types/            (TypeScript types)
├── public/           (Images and static files)
├── scripts/          (Automation scripts)
├── node_modules/     (Installed packages - don't touch)
├── package.json      (Lists all packages)
├── tailwind.config.ts (Tailwind settings)
└── tsconfig.json     (TypeScript settings)
```

### Create Environment Variables File

Environment variables store secret information like API keys, database passwords, etc. Never share this file publicly.

1. In Frontend folder, create a new file named `.env.local`
2. Open it and add these lines (replace values with your actual keys):
   ```
   BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   ```

**Important**: Keep this file secret. Add `.env.local` to your `.gitignore` file so it doesn't upload to GitHub.

### Test Frontend Setup

1. In Command Prompt (inside Frontend folder), type:
   ```
   npm run dev
   ```
2. Open web browser and go to: `http://localhost:3000`
3. If you see the Next.js welcome page, setup worked correctly
4. Press `Ctrl + C` in Command Prompt to stop the server

---

## Step 4: Set Up Backend with Python and uv

Now you will set up the Backend folder. Backend handles data storage, business logic, security, and communication with databases.

### Initialize Backend with uv

**uv** will create a Python project structure and manage packages for you.

1. Open Command Prompt
2. Navigate to your project folder:
   ```
   cd D:\Projects\MyWebApp
   ```
3. Navigate to Backend folder:
   ```
   cd Backend
   ```
4. Initialize a new Python project with uv:
   ```
   uv init
   ```
5. This creates basic files: `pyproject.toml` (project config) and a sample Python file

### Install Required Backend Packages

Now install all packages your Backend needs.

1. Install all packages at once with this command:
   ```
   uv add fastapi uvicorn sqlmodel psycopg2-binary python-dotenv stripe pyjwt python-multipart pytest sqlalchemy
   ```

Let me explain what each package does:
- **fastapi** = Web framework for building APIs (API means Application Programming Interface - how Frontend talks to Backend)
- **uvicorn** = Server that runs FastAPI
- **sqlmodel** = Handles database operations (creates tables, saves data)
- **psycopg2-binary** = Connects Python to PostgreSQL database
- **python-dotenv** = Loads environment variables from .env file
- **stripe** = Handles payment processing with Stripe
- **pyjwt** = Creates and verifies JWT tokens (tokens verify user identity)
- **python-multipart** = Handles file uploads
- **pytest** = Runs automated tests
- **sqlalchemy** = Database toolkit (works with sqlmodel)

2. Wait for installation to complete

### Create Backend Folder Structure

Inside Backend folder, create this exact structure. This is the professional standard structure for Python APIs.

```
Backend/
├── src/
│   ├── config/          (Configuration files)
│   ├── models/          (Database table definitions)
│   ├── routes/          (API endpoint handlers)
│   ├── services/        (Business logic functions)
│   ├── middlewares/     (Request/response processing)
│   └── utils/           (Helper functions)
├── tests/               (Test files)
├── migrations/          (Database migration scripts)
├── scripts/             (Automation scripts)
├── readme/              (Documentation)
├── main.py              (Entry point - starts the server)
├── pyproject.toml       (Already created - package list)
└── .env                 (Environment variables - create this)
```

**How to create this structure:**

1. Create `src` folder in Backend
2. Inside `src`, create these folders: `config`, `models`, `routes`, `services`, `middlewares`, `utils`
3. In Backend root, create: `tests`, `migrations`, `scripts`, `readme` folders
4. In Backend root, create these files: `main.py`, `.env`

**In each src subfolder, create `__init__.py` file** (empty file that tells Python it's a package):
- `src/config/__init__.py`
- `src/models/__init__.py`
- `src/routes/__init__.py`
- `src/services/__init__.py`
- `src/middlewares/__init__.py`
- `src/utils/__init__.py`

### Create Basic Backend Files

Now create the essential files to make Backend work.

#### Create main.py

This is the entry point - the file that starts your server. Create `main.py` in Backend root folder and add:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from src.config.db import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(
    title="Your Project API",
    description="Backend API for your project",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow Frontend to communicate with Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}
```

#### Create src/config/settings.py

This file loads environment variables. Create this file:

```python
from starlette.config import Config
from starlette.datastructures import Secret

try:
    config = Config(".env")
except FileNotFoundError:
    config = Config()

DATABASE_URL = config("DATABASE_URL", cast=Secret)
BETTER_AUTH_SECRET = config("BETTER_AUTH_SECRET", cast=str)
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", cast=str)
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", cast=str)
```

#### Create src/config/db.py

This file manages database connections. Create this file:

```python
from sqlmodel import Session, create_engine
from src.config.settings import DATABASE_URL

connection_string = str(DATABASE_URL).replace(
    "postgresql://", "postgresql+psycopg2://"
)

engine = create_engine(
    connection_string,
    connect_args={"sslmode": "require"},
    pool_recycle=300
)

def get_session():
    with Session(engine) as session:
        yield session
```

### Create Environment Variables File

In Backend root folder, create `.env` file and add:

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Important**: Replace these with your actual values. Keep this file secret.

### Create Virtual Environment

Virtual environment is an isolated Python installation for this project only. It keeps packages separate from other projects.

1. In Backend folder, run:
   ```
   uv venv
   ```
2. This creates `.venv` folder
3. Activate it:
   - **Windows**: `.venv\Scripts\activate.bat`
   - **Mac/Linux**: `source .venv/bin/activate`
4. When activated, you'll see `(.venv)` at the start of your command prompt line

### Test Backend Setup

1. Make sure virtual environment is activated (you see `.venv` in prompt)
2. Run the server:
   ```
   uvicorn main:app --reload
   ```
3. Open web browser and go to: `http://localhost:8000`
4. If you see `{"message": "Backend is running!"}`, setup worked correctly
5. Go to `http://localhost:8000/docs` to see interactive API documentation
6. Press `Ctrl + C` in Command Prompt to stop the server

---

## Step 5: Create Helper Scripts

Now create scripts that make running your project easier.

### Frontend Start Script (Windows)

Create `scripts/start_frontend.bat` in main project folder:

```batch
@echo off
echo Starting Frontend...
cd Frontend
npm run dev
```

Double-click this file to start Frontend instead of typing commands.

### Backend Start Script (Windows)

Create `scripts/start_backend.bat` in main project folder:

```batch
@echo off
echo Starting Backend...
cd Backend
call .venv\Scripts\activate.bat
uvicorn main:app --reload
```

Double-click this file to start Backend instead of typing commands.

### For Mac/Linux Users

Create `scripts/start_frontend.sh`:

```bash
#!/bin/bash
echo "Starting Frontend..."
cd Frontend
npm run dev
```

Create `scripts/start_backend.sh`:

```bash
#!/bin/bash
echo "Starting Backend..."
cd Backend
source .venv/bin/activate
uvicorn main:app --reload
```

Make them executable:
```
chmod +x scripts/start_frontend.sh
chmod +x scripts/start_backend.sh
```

---

## Step 6: Environment Variables Setup Summary

You need environment variables in two places:

### Frontend (.env.local file)
```
BETTER_AUTH_SECRET=your-secret-key-minimum-32-chars
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Backend (.env file)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BETTER_AUTH_SECRET=your-secret-key-minimum-32-chars
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**How to get these values:**

1. **DATABASE_URL**: Get from your database provider (NeonDB, Supabase, ElephantSQL, etc.)
2. **BETTER_AUTH_SECRET**: Generate random 32+ character string
3. **STRIPE keys**: Get from https://dashboard.stripe.com/test/apikeys
4. **STRIPE_WEBHOOK_SECRET**: Get from Stripe webhook settings

---

## Step 7: Final Project Structure

Your complete project structure should now look like this:

```
MyWebApp/
├── Frontend/
│   ├── app/
│   ├── lib/
│   ├── types/
│   ├── public/
│   ├── scripts/
│   ├── node_modules/
│   ├── .env.local
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   ├── settings.py
│   │   │   └── db.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── routes/
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   └── __init__.py
│   │   ├── middlewares/
│   │   │   └── __init__.py
│   │   └── utils/
│   │       └── __init__.py
│   ├── tests/
│   ├── migrations/
│   ├── scripts/
│   ├── readme/
│   ├── .venv/
│   ├── .env
│   ├── main.py
│   └── pyproject.toml
├── scripts/
│   ├── start_frontend.bat
│   └── start_backend.bat
└── README.md
```

---

## Step 8: Verify Everything Works

Follow these steps to make sure everything is set up correctly:

### Check Frontend

1. Open Command Prompt
2. Go to Frontend folder: `cd D:\Projects\MyWebApp\Frontend`
3. Start development server: `npm run dev`
4. Open browser: `http://localhost:3000`
5. You should see Next.js welcome page
6. Stop server: Press `Ctrl + C`

### Check Backend

1. Open Command Prompt
2. Go to Backend folder: `cd D:\Projects\MyWebApp\Backend`
3. Activate virtual environment: `.venv\Scripts\activate.bat`
4. Start server: `uvicorn main:app --reload`
5. Open browser: `http://localhost:8000`
6. You should see: `{"message": "Backend is running!"}`
7. Check API docs: `http://localhost:8000/docs`
8. Stop server: Press `Ctrl + C`

### Check Both Running Together

1. Open TWO Command Prompt windows
2. In first window: Start Frontend (port 3000)
3. In second window: Start Backend (port 8000)
4. Both should run without errors
5. Frontend on port 3000, Backend on port 8000

---

## Common Problems and Solutions

### Problem: "node is not recognized"
**Solution**: Node.js not installed or not in PATH. Reinstall Node.js and check "Add to PATH" option.

### Problem: "python is not recognized"
**Solution**: Python not installed or not in PATH. Reinstall Python and check "Add Python to PATH" option.

### Problem: "npm install" fails
**Solution**: Delete `node_modules` folder and `package-lock.json` file. Run `npm install` again.

### Problem: "Port 3000 already in use"
**Solution**: Another program using port 3000. Close it or change port by running: `npm run dev -- -p 3001`

### Problem: "Port 8000 already in use"
**Solution**: Another program using port 8000. Change port: `uvicorn main:app --reload --port 8001`

### Problem: Backend can't connect to database
**Solution**: Check DATABASE_URL in .env file. Make sure database exists and credentials are correct.

### Problem: "Module not found" error
**Solution**: Package not installed. Go to correct folder and run `npm install` or `uv add package-name`.

---

## Next Steps After Setup

Now that your project is set up, here's what to do next:

1. **Create your first database model** in `Backend/src/models/`
2. **Create your first API route** in `Backend/src/routes/`
3. **Create your first page** in `Frontend/app/`
4. **Test the connection** between Frontend and Backend
5. **Read the documentation** in readme folders
6. **Start building features** one by one

---

## Important Reminders

1. **Never commit .env files to Git** - They contain secrets
2. **Always activate virtual environment** before running Backend commands
3. **Keep packages updated** regularly for security
4. **Test your code** before adding new features
5. **Read error messages carefully** - They tell you what's wrong
6. **Use Git** to track changes and backup your code
7. **Ask for help** when stuck - Don't waste hours on one problem

---

**Congratulations! Your project is now fully set up and ready for development.**