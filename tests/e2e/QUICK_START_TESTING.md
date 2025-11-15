# Partner Dashboard Tests - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install & Setup
```bash
# Install dependencies
npm install

# Install browsers
npx playwright install

# Set test credentials
export TEST_PARTNER_EMAIL="partner@test.com"
export TEST_PARTNER_PASSWORD="TestPassword123!"
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Run Tests
```bash
# All tests
./tests/e2e/run-partner-dashboard-tests.sh

# Or specific suite
npx playwright test tests/e2e/partner-dashboard-improvements.spec.ts
```

### 4. View Results
```bash
npx playwright show-report
```

---

## 📋 Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `partner-dashboard-improvements.spec.ts` | User flows | 32 |
| `partner-dashboard-cross-browser.spec.ts` | Browser compatibility | 38 |
| `partner-dashboard-uat-guide.md` | Manual testing | 60+ |

---

## 🎯 Common Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test partner-dashboard-improvements.spec.ts

# Run specific test
npx playwright test -g "should allow partner to login"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Debug mode
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# UI mode (interactive)
npx playwright test --ui
```

---

## 🔧 Environment Variables

```bash
# Required
TEST_PARTNER_EMAIL="partner@test.com"
TEST_PARTNER_PASSWORD="TestPassword123!"

# Optional
BASE_URL="http://localhost:3000"  # Default
```

---

## 📊 Test Coverage

- ✅ 70 automated tests
- ✅ 60+ manual test scenarios
- ✅ 4 browsers (Chrome, Firefox, Safari, Edge)
- ✅ 3 languages (FR, EN, AR)
- ✅ 3 device sizes (Desktop, Tablet, Mobile)
- ✅ 100% requirements coverage

---

## 🐛 Troubleshooting

### Tests timeout?
```bash
# Increase timeout in playwright.config.ts
# Or check if dev server is running
```

### Authentication fails?
```bash
# Verify test account exists in database
# Check credentials are correct
```

### Browser not found?
```bash
npx playwright install
```

---

## 📚 Full Documentation

See `PARTNER_DASHBOARD_TESTS_README.md` for complete documentation.

---

## ✅ Success Criteria

All tests should pass with:
- ✅ 70/70 automated tests passing
- ✅ No console errors
- ✅ All browsers working
- ✅ All languages displaying correctly
- ✅ Responsive design working
- ✅ Accessibility compliant

---

## 🎉 Ready to Test!

You're all set! Run the tests and verify everything works correctly.

For detailed information, see:
- `PARTNER_DASHBOARD_TESTS_README.md` - Complete guide
- `INTEGRATION_TESTING_SUMMARY.md` - Implementation summary
- `partner-dashboard-uat-guide.md` - Manual testing guide
