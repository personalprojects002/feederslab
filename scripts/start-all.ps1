# FeedersLab Startup Script
# This script starts the entire application: Backend, Frontend, and Stripe Webhook

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "FeedersLab Startup Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-all.ps1"
    Write-Host ""
    Write-Host "This script will start:"
    Write-Host "  1. Stripe Webhook Listener (port 9000)"
    Write-Host "  2. Backend API (port 8000)"
    Write-Host "  3. Frontend Application (port 3000)"
    Write-Host ""
    Write-Host "To stop all services, run: .\stop-all.ps1"
    exit 0
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FeedersLab - Starting All Services" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the project root directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if .env files exist
Write-Host "Checking environment files..." -ForegroundColor Yellow
if (-not (Test-Path "$projectRoot\Backend\.env")) {
    Write-Host "ERROR: Backend\.env file not found!" -ForegroundColor Red
    Write-Host "Please create Backend\.env with required variables" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$projectRoot\Frontend\.env.local")) {
    Write-Host "ERROR: Frontend\.env.local file not found!" -ForegroundColor Red
    Write-Host "Please create Frontend\.env.local with required variables" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Environment files found" -ForegroundColor Green
Write-Host ""

# Start Stripe Webhook Listener
Write-Host "Starting Stripe Webhook Listener..." -ForegroundColor Yellow
$stripeProcess = Start-Process -FilePath "stripe" -ArgumentList "listen --forward-to http://localhost:8000/webhook/stripe" -PassThru -NoNewWindow
Write-Host "✓ Stripe Webhook Listener started (PID: $($stripeProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend API..." -ForegroundColor Yellow
Push-Location "$projectRoot\Backend"
$backendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -PassThru -NoNewWindow
Write-Host "✓ Backend API started (PID: $($backendProcess.Id))" -ForegroundColor Green
Pop-Location
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Application..." -ForegroundColor Yellow
Push-Location "$projectRoot\Frontend"
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -PassThru -NoNewWindow
Write-Host "✓ Frontend Application started (PID: $($frontendProcess.Id))" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Process IDs:" -ForegroundColor Yellow
Write-Host "  Stripe Webhook: $($stripeProcess.Id)" -ForegroundColor Cyan
Write-Host "  Backend:        $($backendProcess.Id)" -ForegroundColor Cyan
Write-Host "  Frontend:       $($frontendProcess.Id)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services, run: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""

# Save process IDs to a file for stopping later
@{
    stripe = $stripeProcess.Id
    backend = $backendProcess.Id
    frontend = $frontendProcess.Id
} | ConvertTo-Json | Out-File -FilePath "$projectRoot\scripts\pids.json" -Force

# Keep the script running
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow
while ($true) {
    Start-Sleep -Seconds 1
}
