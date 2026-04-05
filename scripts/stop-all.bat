@echo off
setlocal

echo Stopping FeedersLab processes and freeing ports...

taskkill /F /FI "WINDOWTITLE eq Feeders-Frontend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Feeders-Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Feeders-Webhook*" >nul 2>&1

taskkill /F /IM stripe.exe >nul 2>&1

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)

echo Done.
endlocal
