@echo off
REM Training Environment Setup Automation Script
REM Creates a complete training environment with sample data and users

echo 🎓 Training Environment Setup
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

echo 📋 Creating training environment...
echo ⚠️  This will create a new training environment with:
echo    • Sample data (lofts, reservations, transactions)
echo    • Training user accounts
echo    • Training scenarios
echo    • Documentation
echo.

set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled
    pause
    exit /b 0
)

echo.
echo 🚀 Starting training environment setup...

REM Execute training environment setup
npx tsx lib/environment-management/automation/training-environment-setup.ts

if %errorlevel% equ 0 (
    echo.
    echo ✅ Training environment setup completed successfully!
    echo 📚 Check the generated training guide for user accounts and instructions
) else (
    echo.
    echo ❌ Training environment setup failed!
    echo Check the logs above for details
)

echo.
pause