@echo off
REM Simple batch file to run the backend
REM Just double-click this file to start the backend every time!

echo.
echo ===================================
echo Starting FastAPI Backend...
echo ===================================
echo.

REM Activate virtual environment and run uvicorn
call ..\.venv\Scripts\activate.bat
python -m uvicorn main:app --reload

pause
