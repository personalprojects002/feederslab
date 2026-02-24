@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM Complete Project Stop Script
REM Stops: Stripe Webhook Listener + Backend + Frontend
REM ============================================================

echo.
echo ============================================================
echo    STOPPING ALL DEVELOPMENT SERVICES
echo ============================================================
echo.

REM Move to project root (parent of scripts folder)
cd /d "%~dp0.."

echo Step 1: Closing launcher windows...

taskkill /FI "WINDOWTITLE eq Stripe CLI - Webhook Listener*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend - FastAPI on Port 8000*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - Next.js on Port 3000*" /T /F >nul 2>&1

echo Step 2: Freeing required ports (8000, 3000)...

for %%P in (8000 3000) do (
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        set "PID=%%A"
        if not "!PID!"=="0" (
            taskkill /PID !PID! /T /F >nul 2>&1
        )
    )
)

echo Step 3: Stopping Stripe CLI process if still running...

taskkill /IM stripe.exe /T /F >nul 2>&1

echo.
echo ============================================================
echo    ✅ Stop command finished
echo ============================================================
echo.
echo If anything is still running, close remaining terminal windows manually.
echo.
pause
