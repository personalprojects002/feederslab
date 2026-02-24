@echo off
setlocal
REM ============================================================
REM Complete Project Startup Script
REM Starts: Stripe Webhook Listener + Backend + Frontend
REM ============================================================

echo.
echo ============================================================
echo    STARTING STRIPE INTEGRATION - COMPLETE SETUP
echo ============================================================
echo.

REM Get the root project directory (parent of scripts folder)
cd /d "%~dp0.."

if not exist "Backend\main.py" (
	echo ❌ Backend folder not found. Expected: Backend\main.py
	pause
	exit /b 1
)

if not exist "Frontend\package.json" (
	echo ❌ Frontend folder not found. Expected: Frontend\package.json
	pause
	exit /b 1
)

where stripe >nul 2>&1
if errorlevel 1 (
	echo ❌ Stripe CLI is not installed or not in PATH.
	echo Install from: https://stripe.com/docs/stripe-cli
	pause
	exit /b 1
)

if exist ".venv\Scripts\python.exe" (
	set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
	where python >nul 2>&1
	if errorlevel 1 (
		echo ❌ Python not found and .venv\Scripts\python.exe does not exist.
		pause
		exit /b 1
	)
	set "PYTHON_EXE=python"
)

echo Step 1: Starting Stripe Webhook Listener...
echo.
start "Stripe CLI - Webhook Listener" cmd /k "cd /d %CD% && stripe listen --forward-to http://localhost:8000/webhook/stripe"

timeout /t 2 /nobreak

echo.
echo Step 2: Starting Backend (FastAPI)...
echo.
start "Backend - FastAPI on Port 8000" cmd /k "cd /d %CD%\Backend && %PYTHON_EXE% -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak

echo.
echo Step 3: Starting Frontend (Next.js on Port 3000)...
echo.
start "Frontend - Next.js on Port 3000" cmd /k "cd /d %CD%\Frontend && npm run dev"

timeout /t 2 /nobreak

echo.
echo ============================================================
echo     ✅ All services started!
echo ============================================================
echo.
echo 📍 Stripe CLI:  Listening and forwarding webhooks
echo 📍 Backend:     Running on http://localhost:8000
echo 📍 Frontend:    Running on http://localhost:3000
echo.
echo ⚠️  DO NOT CLOSE ANY OF THESE WINDOWS!
echo.
echo Open your browser and go to: http://localhost:3000
echo.
echo To stop everything, close all the windows above.
echo.
pause
