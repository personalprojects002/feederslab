# FeedersLab Stop Script
# This script stops all running services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FeedersLab - Stopping All Services" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Try to read saved process IDs
$pidsFile = "$projectRoot\pids.json"
if (Test-Path $pidsFile) {
    $pids = Get-Content $pidsFile | ConvertFrom-Json

    Write-Host "Stopping services..." -ForegroundColor Yellow

    if ($pids.stripe) {
        try {
            Stop-Process -Id $pids.stripe -Force -ErrorAction SilentlyContinue
            Write-Host "✓ Stripe Webhook Listener stopped" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not stop Stripe Webhook Listener" -ForegroundColor Yellow
        }
    }

    if ($pids.backend) {
        try {
            Stop-Process -Id $pids.backend -Force -ErrorAction SilentlyContinue
            Write-Host "✓ Backend API stopped" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not stop Backend API" -ForegroundColor Yellow
        }
    }

    if ($pids.frontend) {
        try {
            Stop-Process -Id $pids.frontend -Force -ErrorAction SilentlyContinue
            Write-Host "✓ Frontend Application stopped" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not stop Frontend Application" -ForegroundColor Yellow
        }
    }

    Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No process IDs file found. Stopping all Node and Python processes..." -ForegroundColor Yellow

    # Stop all npm processes
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✓ Stopped Node processes" -ForegroundColor Green

    # Stop all Python processes running uvicorn
    Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force
    Write-Host "✓ Stopped Python processes" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Services Stopped" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
