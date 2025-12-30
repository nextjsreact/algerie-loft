@echo off
echo ========================================
echo  Clean Development Server (Ninja-Free)
echo ========================================
echo.
echo Starting Next.js development server with Console Ninja filtering...
echo This will provide clean, readable output without obfuscated code.
echo.
echo Press Ctrl+C to stop the server
echo.

REM Clear any existing cache
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Set environment variables to disable Console Ninja
set DISABLE_CONSOLE_NINJA=true
set CONSOLE_NINJA_DISABLE=true
set NODE_OPTIONS=--no-warnings
set NEXT_TELEMETRY_DISABLED=1

REM Start the filtered development server
node scripts/dev-clean-filtered.js

pause