@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%.."
pushd "%BACKEND_DIR%"

echo.
echo ===================================
echo Starting FastAPI Backend...
echo ===================================
echo.

if not exist ".venv\Scripts\python.exe" (
	echo ERROR: Backend virtual environment not found at Backend\.venv\Scripts\python.exe
	echo Create the environment and install dependencies, then retry.
	popd
	pause
	exit /b 1
)

set "UVICORN_RELOAD_FLAG="
if /I "%FEEDERS_BACKEND_RELOAD%"=="1" (
	set "UVICORN_RELOAD_FLAG=--reload"
	echo Backend reload mode: ON
) else (
	echo Backend reload mode: OFF (set FEEDERS_BACKEND_RELOAD=1 to enable)
)

.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --no-access-log %UVICORN_RELOAD_FLAG%

popd
endlocal
pause
