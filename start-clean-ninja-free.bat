@echo off
echo ========================================
echo   CONSOLE NINJA FREE DEVELOPMENT SERVER
echo ========================================
echo.

REM Clear any existing Console Ninja environment variables
set DISABLE_CONSOLE_NINJA=true
set CONSOLE_NINJA_DISABLED=true
set CONSOLE_NINJA_DISABLE=true
set NO_CONSOLE_NINJA=true

REM Additional Node.js flags to prevent injection
set NODE_OPTIONS=--no-warnings --max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1

REM Clear cache to ensure clean start
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next 2>nul
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul

echo.
echo Starting development server without Console Ninja...
echo Server will be available at: http://localhost:3000
echo.

REM Start the development server
npm run dev

pause