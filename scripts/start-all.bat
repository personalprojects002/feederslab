@echo off
REM ============================================================
REM Complete Project Startup Script
REM Starts: Stripe Webhook Listener + Backend + Frontend
REM ============================================================

echo.
echo ============================================================
echo    STARTING STRIPE INTEGRATION - COMPLETE SETUP
echo ============================================================
echo.

REM Get the root project directory
cd /d "%~dp0"

echo Step 1: Starting Stripe Webhook Listener...
echo.
start "Stripe CLI - Webhook Listener" cmd /k "stripe listen --forward-to localhost:8000/webhook/stripe"

timeout /t 2 /nobreak

echo.
echo Step 2: Starting Backend (FastAPI)...
echo.
start "Backend - FastAPI on Port 8000" cmd /k "cd Back && ..\.venv\Scripts\activate.bat && python -m uvicorn main:app --reload"

timeout /t 3 /nobreak

echo.
echo Step 3: Starting Frontend (Next.js on Port 3000)...
echo.
start "Frontend - Next.js on Port 3000" cmd /k "cd Frontend && npm run dev"

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
