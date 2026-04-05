@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

echo Starting FeedersLab stack...
echo.

set "UVICORN_RELOAD_FLAG="
if /I "%FEEDERS_BACKEND_RELOAD%"=="1" (
    set "UVICORN_RELOAD_FLAG=--reload"
    echo Backend reload mode: ON
) else (
    echo Backend reload mode: OFF (set FEEDERS_BACKEND_RELOAD=1 to enable)
)

start "Feeders-Frontend" cmd /k "cd /d ""%ROOT_DIR%\Frontend"" && npm run dev"
start "Feeders-Backend" cmd /k "cd /d ""%ROOT_DIR%\Backend"" && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --no-access-log %UVICORN_RELOAD_FLAG%"

where stripe >nul 2>&1
if %errorlevel%==0 (
    start "Feeders-Webhook" cmd /k "cd /d ""%ROOT_DIR%"" && stripe listen --events checkout.session.completed,customer.subscription.deleted --forward-to http://localhost:8000/webhook/stripe"
) else (
    echo Stripe CLI not found. Skipping webhook listener.
    echo Install Stripe CLI to enable local webhook forwarding.
)

echo.
echo Started. Use scripts\stop-all.bat to stop everything.
endlocal
