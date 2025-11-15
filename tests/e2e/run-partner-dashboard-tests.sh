#!/bin/bash

# Partner Dashboard Integration Tests Runner
# This script runs all integration and cross-browser tests for the partner dashboard improvements

echo "🚀 Starting Partner Dashboard Integration Tests"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment variables are set
if [ -z "$TEST_PARTNER_EMAIL" ]; then
    echo -e "${YELLOW}⚠️  TEST_PARTNER_EMAIL not set, using default${NC}"
    export TEST_PARTNER_EMAIL="partner@test.com"
fi

if [ -z "$TEST_PARTNER_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  TEST_PARTNER_PASSWORD not set, using default${NC}"
    export TEST_PARTNER_PASSWORD="TestPassword123!"
fi

if [ -z "$BASE_URL" ]; then
    echo -e "${YELLOW}⚠️  BASE_URL not set, using default${NC}"
    export BASE_URL="http://localhost:3000"
fi

echo ""
echo "Test Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Test Email: $TEST_PARTNER_EMAIL"
echo ""

# Function to run tests and capture results
run_test_suite() {
    local test_name=$1
    local test_file=$2
    local browsers=$3
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    
    if [ -z "$browsers" ]; then
        # Run on all browsers
        npx playwright test "$test_file" --reporter=html,json
    else
        # Run on specific browser
        npx playwright test "$test_file" --project="$browsers" --reporter=html,json
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        return 1
    fi
}

# Track overall results
total_tests=0
passed_tests=0
failed_tests=0

echo "================================================"
echo "Test Suite 1: Complete User Flows"
echo "================================================"
echo ""

run_test_suite "User Flow Tests" "tests/e2e/partner-dashboard-improvements.spec.ts"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "================================================"
echo "Test Suite 2: Cross-Browser Compatibility"
echo "================================================"
echo ""

# Run cross-browser tests on Chromium
run_test_suite "Chrome Browser Tests" "tests/e2e/partner-dashboard-cross-browser.spec.ts" "chromium"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Run cross-browser tests on Firefox
run_test_suite "Firefox Browser Tests" "tests/e2e/partner-dashboard-cross-browser.spec.ts" "firefox"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Run cross-browser tests on WebKit
run_test_suite "Safari/WebKit Browser Tests" "tests/e2e/partner-dashboard-cross-browser.spec.ts" "webkit"
if [ $? -eq 0 ]; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "================================================"
echo "Test Results Summary"
echo "================================================"
echo ""
echo "Total Test Suites: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $failed_tests${NC}"
echo ""

# Generate summary report
echo "Generating test report..."
echo ""
echo "HTML Report: playwright-report/index.html"
echo "JSON Report: test-results/results.json"
echo ""

# Exit with appropriate code
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the reports.${NC}"
    exit 1
fi
