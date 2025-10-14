@echo off
REM Daily Environment Refresh Automation Script
REM Executes daily refresh of test and training environments

echo 🔄 Daily Environment Refresh
echo ============================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Check if tsx is available
npx tsx --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ tsx is not available
    echo Installing tsx...
    npm install -g tsx
)

echo 📋 Starting daily environment refresh...
echo.

REM Execute daily refresh
npx tsx lib/environment-management/automation/daily-refresh.ts run

if %errorlevel% equ 0 (
    echo.
    echo ✅ Daily refresh completed successfully!
) else (
    echo.
    echo ❌ Daily refresh failed!
    echo Check the logs above for details
)

echo.
pause