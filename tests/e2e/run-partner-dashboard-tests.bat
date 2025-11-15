@echo off
REM Partner Dashboard Integration Tests Runner (Windows)
REM This script runs all integration and cross-browser tests for the partner dashboard improvements

echo.
echo ========================================
echo Partner Dashboard Integration Tests
echo ========================================
echo.

REM Check if environment variables are set
if "%TEST_PARTNER_EMAIL%"=="" (
    echo WARNING: TEST_PARTNER_EMAIL not set, using default
    set TEST_PARTNER_EMAIL=partner@test.com
)

if "%TEST_PARTNER_PASSWORD%"=="" (
    echo WARNING: TEST_PARTNER_PASSWORD not set, using default
    set TEST_PARTNER_PASSWORD=TestPassword123!
)

if "%BASE_URL%"=="" (
    echo WARNING: BASE_URL not set, using default
    set BASE_URL=http://localhost:3000
)

echo.
echo Test Configuration:
echo   Base URL: %BASE_URL%
echo   Test Email: %TEST_PARTNER_EMAIL%
echo.

set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

echo ========================================
echo Test Suite 1: Complete User Flows
echo ========================================
echo.

call npx playwright test tests/e2e/partner-dashboard-improvements.spec.ts --reporter=html,json
if %ERRORLEVEL% EQU 0 (
    echo [PASS] User Flow Tests
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] User Flow Tests
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1

echo.
echo ========================================
echo Test Suite 2: Cross-Browser Tests
echo ========================================
echo.

REM Chrome tests
call npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts --project=chromium --reporter=html,json
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Chrome Browser Tests
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Chrome Browser Tests
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1

REM Firefox tests
call npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts --project=firefox --reporter=html,json
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Firefox Browser Tests
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Firefox Browser Tests
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1

REM WebKit tests
call npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts --project=webkit --reporter=html,json
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Safari/WebKit Browser Tests
    set /a PASSED_TESTS+=1
) else (
    echo [FAIL] Safari/WebKit Browser Tests
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1

echo.
echo ========================================
echo Test Results Summary
echo ========================================
echo.
echo Total Test Suites: %TOTAL_TESTS%
echo Passed: %PASSED_TESTS%
echo Failed: %FAILED_TESTS%
echo.
echo HTML Report: playwright-report\index.html
echo JSON Report: test-results\results.json
echo.

if %FAILED_TESTS% EQU 0 (
    echo [SUCCESS] All tests passed!
    exit /b 0
) else (
    echo [ERROR] Some tests failed. Please review the reports.
    exit /b 1
)
