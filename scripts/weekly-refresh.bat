@echo off
REM Weekly Environment Refresh Automation Script
REM Executes comprehensive weekly refresh of all environments

echo 🔄 Weekly Environment Refresh
echo ==============================
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

echo 📋 Starting comprehensive weekly refresh...
echo ⚠️  This process may take several hours
echo.

REM Execute weekly refresh
npx tsx lib/environment-management/automation/weekly-refresh.ts run

if %errorlevel% equ 0 (
    echo.
    echo ✅ Weekly refresh completed successfully!
) else (
    echo.
    echo ❌ Weekly refresh failed!
    echo Check the logs above for details
)

echo.
pause