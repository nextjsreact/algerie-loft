@echo off
echo Restarting development server...
echo ================================

echo 1. Stopping any running processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Clearing Next.js cache...
if exist .next rmdir /s /q .next

echo 3. Starting development server...
echo.
echo Open http://localhost:3001/availability to test the fix
echo.
start http://localhost:3001/availability
npm run dev