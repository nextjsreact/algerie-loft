# Clean Development Server (Ninja-Free)
# PowerShell script to start Next.js development server with Console Ninja filtering

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Clean Development Server (Ninja-Free)" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Next.js development server with Console Ninja filtering..." -ForegroundColor Green
Write-Host "This will provide clean, readable output without obfuscated code." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Clear any existing cache
if (Test-Path ".next") {
    Write-Host "🧹 Clearing .next cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

if (Test-Path "node_modules\.cache") {
    Write-Host "🧹 Clearing node_modules cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

# Set environment variables to disable Console Ninja
$env:DISABLE_CONSOLE_NINJA = "true"
$env:CONSOLE_NINJA_DISABLE = "true"
$env:NODE_OPTIONS = "--no-warnings"
$env:NEXT_TELEMETRY_DISABLED = "1"

# Start the filtered development server
try {
    node scripts/dev-clean-filtered.js
} catch {
    Write-Host "❌ Error starting development server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}