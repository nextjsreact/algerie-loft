@echo off
REM Development Environment Quick Setup Script
REM Creates a fast development environment for coding

echo ⚡ Development Environment Quick Setup
echo =====================================
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

echo 📋 Choose setup mode:
echo 1. Default - Standard development setup with sample data
echo 2. Minimal - Fastest setup with minimal data
echo 3. Custom  - Use custom configuration file
echo.

set /p mode="Enter choice (1-3): "

if "%mode%"=="1" (
    set setup_mode=default
) else if "%mode%"=="2" (
    set setup_mode=minimal
) else if "%mode%"=="3" (
    set setup_mode=custom
    set /p config_path="Enter config file path: "
) else (
    echo Invalid choice. Using default mode.
    set setup_mode=default
)

echo.
echo 🚀 Starting development environment setup in %setup_mode% mode...

REM Execute development environment setup
if "%setup_mode%"=="custom" (
    npx tsx lib/environment-management/automation/development-environment-setup.ts %setup_mode% "%config_path%"
) else (
    npx tsx lib/environment-management/automation/development-environment-setup.ts %setup_mode%
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Development environment setup completed successfully!
    echo 🚀 You can now start developing with: npm run dev
) else (
    echo.
    echo ❌ Development environment setup failed!
    echo Check the logs above for details
)

echo.
pause