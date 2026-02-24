# BUILD NOTES - Production Level Application Setup Guide

## Project Overview

This is a production-level full-stack application that uses Next.js for the frontend and FastAPI for the backend. The frontend is built with TypeScript, React 19, Tailwind CSS, and DaisyUI for styling. It uses Better Auth for authentication and Stripe for payments. The backend is built with Python, FastAPI, SQLAlchemy for database operations, and also integrates Stripe for payment processing. Both frontend and backend connect to a PostgreSQL database.

## How to Build This Project from Scratch

To build a production-level application like this, first create a main project folder (like "Converter"). Inside it, create three folders: "Frontend" for the Next.js application, "Backend" for the FastAPI application, and "scripts" for startup scripts that run both servers together. For the frontend, go inside the Frontend folder and run `npx create-next-app@latest .` to install Next.js with TypeScript, then install all required packages using `npm install`. For the backend, go inside the Backend folder and use the UV package manager (which is a fast Python package manager) by running `uv init` to initialize the project, then add dependencies using `uv add fastapi uvicorn sqlalchemy` and other packages. The UV package manager creates a `.venv` folder automatically which stores all Python packages in an isolated environment. Create a `.env` file in both Frontend and Backend folders to store secret keys like database URLs, API keys, and Stripe keys. Finally, create batch or shell scripts in the "scripts" folder to start both frontend and backend servers together with one command. This structure keeps frontend and backend code separate, making it easier to maintain and deploy.

---

## FRONTEND STRUCTURE (Next.js)

### .next Folder

The `.next` folder is automatically created by Next.js when you run the `npm run dev` or `npm run build` command. This folder contains the compiled and optimized version of your application that the browser can actually run. Think of it like a translator folder - your code is written in TypeScript and JSX which browsers cannot understand directly, so Next.js converts it into plain JavaScript and HTML inside this `.next` folder. You should never edit files inside this folder manually because Next.js creates and updates it automatically. When you make changes to your code and save, Next.js rebuilds the necessary files in this folder. This folder should be added to `.gitignore` so it does not get uploaded to GitHub because it can be recreated anytime by running the build command.

### lib Folder

The `lib` folder is used to store utility files and helper functions that you use multiple times across your application. For example, if you need to connect to a database, format dates, or create reusable functions for authentication, you put them in this folder. The word "lib" is short for "library" which means a collection of useful code. Instead of writing the same code again and again in different files, you write it once in the `lib` folder and import it wherever needed. This makes your code cleaner and easier to maintain. In this project, the `lib` folder contains database connection setup, authentication configuration for Better Auth, and Stripe payment setup.

### scripts Folder (Frontend)

The `scripts` folder inside the Frontend contains custom scripts or automation files that help with specific tasks during development or deployment. These are not the main application code but helper scripts that perform special operations. For example, you might have a script to reset the database, seed initial data, or generate types automatically. These scripts are usually run manually when needed using commands like `node scripts/filename.js`. This folder keeps your automation and setup scripts separate from your main application code, making the project more organized.

### readme Folder

The `readme` folder is a custom folder created to store multiple README files that explain different parts of the frontend application. Instead of having one very long README file at the root, you can break it into smaller README files - one for authentication, one for database setup, one for API calls, one for Stripe integration, etc. This makes documentation easier to read and maintain. When someone new joins the project or you want to remember how something works, you can open the specific README file in this folder to understand that particular feature. It is especially helpful in large projects where explaining everything in one file becomes confusing.

### types Folder

The `types` folder is used to store TypeScript type definitions for your application. Types are like rules that tell TypeScript what kind of data a variable can hold - for example, a user object must have a name (string), email (string), and age (number). When you define types in this folder, you can use them throughout your application to catch errors before running the code. For example, if you accidentally try to assign a number to a variable that should be a string, TypeScript will show an error immediately. This folder typically contains files like `user.ts`, `product.ts`, or `api.ts` that define the shape of data used in your application. Using types makes your code safer and easier to understand.

---

## BACKEND STRUCTURE (FastAPI)

### .venv Folder

The `.venv` folder stands for "virtual environment" and it is a special folder that stores all the Python packages and libraries your backend needs to run. When you use the UV package manager and run `uv sync` or `uv add`, it automatically creates this folder and installs packages inside it. The reason we use a virtual environment is to keep this project's packages separate from other Python projects on your computer. Imagine you have Project A that needs version 1.0 of a package and Project B that needs version 2.0 of the same package - if you install packages globally, they will conflict. But with `.venv`, each project has its own isolated copy of packages, so there are no conflicts. This folder should be added to `.gitignore` because it contains thousands of files and can be recreated anytime by running `uv sync`. When you activate the virtual environment using `source .venv/bin/activate` (on Mac/Linux) or `.venv\Scripts\activate` (on Windows), your terminal will use the packages from this folder instead of the global Python installation.

### bin Folder

The `bin` folder (short for "binary") typically contains executable scripts or helper programs that your backend needs to run certain operations. These might be small utility programs, database migration scripts, or command-line tools that perform specific tasks. For example, you might have a script to initialize the database schema, run cleanup tasks, or perform scheduled jobs. This folder is not part of your main application code but contains supporting executable files that help manage and maintain the backend.

### docs Folder

The `docs` folder is used to store documentation files for your backend API. When you build a FastAPI application, it is important to document what each API endpoint does, what data it expects, and what it returns. This folder can contain markdown files, API specifications, architecture diagrams, or detailed explanations of how the backend works. Good documentation helps other developers (or your future self) understand how to use the API without reading all the code. FastAPI also generates automatic interactive documentation at `/docs` endpoint, but this folder is for additional custom documentation that explains business logic, database schema, or deployment instructions.

### readme Folder (Backend)

Just like the frontend readme folder, the backend readme folder stores multiple README files that explain different parts of the backend application. You might have separate README files for database setup, authentication flow, Stripe webhook configuration, API endpoint explanations, or deployment instructions. Breaking documentation into smaller files makes it much easier to find information quickly. For example, if you want to understand how authentication works, you open the authentication README instead of searching through a giant single file.

### src Folder

The `src` folder (short for "source") is where all your main backend application code lives. This is the heart of your backend. Inside this folder, you organize your code into smaller folders like `routes` (for API endpoints), `models` (for database table definitions), `services` (for business logic), `utils` (for helper functions), and `config` (for configuration settings). The `src` folder keeps your main code separate from tests, documentation, and configuration files. When you want to add a new feature or fix a bug, you work inside the `src` folder. This structure makes the codebase clean and easy to navigate because everything is organized by its purpose.

### tests Folder

The `tests` folder contains test files that automatically check if your backend code works correctly. Testing means writing code that calls your functions and API endpoints with different inputs and verifies that the outputs are correct. For example, you might write a test that creates a new user and checks if the user is saved in the database properly. Running tests regularly helps catch bugs before they reach production (live users). Python uses frameworks like `pytest` to run these tests automatically. Good projects have tests for all important functions because it gives confidence that new changes do not break existing features. The tests folder structure often mirrors the src folder structure, so if you have `src/routes/user.py`, you would have `tests/test_user.py`.

### venv Folder

The `venv` folder is similar to the `.venv` folder - it is also a virtual environment folder that stores Python packages. Some projects use `venv` as the folder name while others use `.venv` (with a dot at the start, which makes it a hidden folder). In your project, you have both, which might mean one was created manually and the other by the UV package manager. Generally, you only need one virtual environment folder per project. The UV package manager typically creates `.venv` automatically. This folder serves the same purpose - keeping all Python packages isolated for this project only. You should use only one of them to avoid confusion and add the other to `.gitignore`.

---

## ADDITIONAL FOLDERS

### scripts Folder (Root Level)

The `scripts` folder at the root level (outside Frontend and Backend) contains startup scripts that run both the frontend and backend servers together with a single command. For example, `start-all.bat` is a Windows batch script that opens two command prompts - one runs `npm run dev` in the Frontend folder to start the Next.js development server, and another runs `uv run uvicorn main:app --reload` in the Backend folder to start the FastAPI server. This is very convenient during development because instead of manually opening two terminals and running two commands, you just double-click one script file and both servers start automatically. The `.sh` files are shell scripts for Mac and Linux users that do the same thing. These scripts save time and make the development workflow smoother.

---

## Key Technologies Used

**Frontend:**
- Next.js 16 (React framework for building web applications)
- React 19 (JavaScript library for building user interfaces)
- TypeScript (JavaScript with type safety)
- Tailwind CSS + DaisyUI (styling and UI components)
- Better Auth (authentication system)
- Stripe (payment processing)
- Axios (making API calls to backend)
- PostgreSQL (database connection from frontend)

**Backend:**
- FastAPI (Python web framework for building APIs)
- Python 3.12+ (programming language)
- UV Package Manager (fast Python package installer)
- SQLAlchemy + SQLModel (database ORM to work with PostgreSQL)
- PostgreSQL (database)
- JWT (JSON Web Tokens for authentication)
- Stripe (payment processing)
- Uvicorn (server to run FastAPI)
- Pytest (testing framework)

---

## Quick Start Commands

**Frontend Setup:**
```
cd Frontend
npm install
npm run dev
```

**Backend Setup:**
```
cd Backend
uv sync
uv run uvicorn main:app --reload
```

**Run Both Together:**
```
cd scripts
start-all.bat  (on Windows)
./start-dev.sh (on Mac/Linux)
```

---

This structure helps you build a professional, maintainable, and scalable full-stack application where frontend and backend are completely separated but work together smoothly.