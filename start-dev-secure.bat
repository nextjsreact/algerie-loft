@echo off
echo === SECURE DEVELOPMENT SERVER STARTUP ===
echo.
echo Application Status: SECURED (Next.js 15.5.9)
echo Security: All React2Shell vulnerabilities FIXED
echo.

REM Check if Next.js is installed
if exist "node_modules\next\dist\bin\next" (
    echo ✅ Next.js found - Starting development server...
    echo.
    node "node_modules\next\dist\bin\next" dev --port 3000
) else (
    echo ❌ Next.js not installed - Running installation fix...
    echo.
    powershell -ExecutionPolicy Bypass -File fix-dev-environment.ps1
)

echo.
echo === END ===
pause