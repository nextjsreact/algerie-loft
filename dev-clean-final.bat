@echo off
title Loft Algerie - Clean Development Server
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    LOFT ALGERIE DEV SERVER                   ║
echo ║                  Console Ninja Free Environment             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM === CONSOLE NINJA ISOLATION ===
echo [1/5] Setting up Console Ninja isolation...
set DISABLE_CONSOLE_NINJA=true
set CONSOLE_NINJA_DISABLED=true
set CONSOLE_NINJA_DISABLE=true
set NO_CONSOLE_NINJA=true
set CONSOLE_NINJA_ENABLED=false

REM === NODE.JS OPTIMIZATION ===
echo [2/5] Configuring Node.js environment...
set NODE_OPTIONS=--no-warnings --max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=development

REM === CACHE CLEANUP ===
echo [3/5] Cleaning development cache...
if exist .next (
    echo     Removing .next directory...
    rmdir /s /q .next 2>nul
)
if exist node_modules\.cache (
    echo     Removing node_modules cache...
    rmdir /s /q node_modules\.cache 2>nul
)

REM === DEPENDENCY CHECK ===
echo [4/5] Checking critical dependencies...
if not exist node_modules\tailwindcss-animate (
    echo     ⚠️  tailwindcss-animate not found - server may have CSS issues
)
if not exist node_modules\bcryptjs (
    echo     ⚠️  bcryptjs not found - authentication may not work
)

REM === SERVER STARTUP ===
echo [5/5] Starting development server...
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │  Server will be available at: http://localhost:3000        │
echo │  Press Ctrl+C to stop the server                           │
echo │  Console Ninja isolation: ACTIVE                           │
echo └─────────────────────────────────────────────────────────────┘
echo.

npm run dev

echo.
echo Server stopped. Press any key to exit...
pause >nul