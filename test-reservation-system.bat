@echo off
echo ========================================
echo Reservation Data Consistency Test Suite
echo ========================================
echo.

echo 🔍 Checking test environment...

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available
    echo Please ensure npm is installed
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Check if vitest is available
npx vitest --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Vitest not found, installing...
    npm install --save-dev vitest
    if errorlevel 1 (
        echo ❌ Failed to install vitest
        pause
        exit /b 1
    )
)

echo ✅ Test environment ready
echo.

echo 🚀 Starting test execution...
echo.

REM Run the test runner
npx tsx scripts/run-reservation-tests.ts

if errorlevel 1 (
    echo.
    echo ❌ Some tests failed. Please check the report for details.
    echo 📄 Test report available in: test-reports/reservation-system-test-report.md
    echo.
    echo Press any key to view the report...
    pause >nul
    
    REM Try to open the report
    if exist "test-reports\reservation-system-test-report.md" (
        start "" "test-reports\reservation-system-test-report.md"
    )
) else (
    echo.
    echo 🎉 All tests passed successfully!
    echo 📄 Test report available in: test-reports/reservation-system-test-report.md
    echo.
    echo The reservation system is ready for deployment.
    echo.
    echo Press any key to view the report...
    pause >nul
    
    REM Try to open the report
    if exist "test-reports\reservation-system-test-report.md" (
        start "" "test-reports\reservation-system-test-report.md"
    )
)

echo.
echo Test execution completed.
pause