# Partner Dashboard Improvements - Integration Testing Documentation

## Overview

This directory contains comprehensive integration and end-to-end tests for the Partner Dashboard improvements. The tests cover all requirements from the specification and ensure the system works correctly across different browsers, languages, and scenarios.

## Test Files

### 1. `partner-dashboard-improvements.spec.ts`
**Purpose:** Complete user flow testing  
**Coverage:** Task 13.1 - Test complete user flows

**Test Suites:**
- User Flow 1: Partner Login and Dashboard Access
- User Flow 2: Navigation Between Dashboard Sections
- User Flow 3: Language Switching Functionality
- User Flow 4: Data Loading and Error Scenarios
- User Flow 5: Responsive Design and Mobile
- User Flow 6: Accessibility Compliance
- User Flow 7: Data Security and Isolation

**Requirements Covered:**
- 1.1, 1.2, 1.3, 1.4, 1.5: Language consistency
- 2.1-2.5: Dashboard header improvements
- 3.1-3.5: Logout button consolidation
- 4.1-4.5: Dashboard features
- 5.1-5.5: Translation system
- 6.1-6.5: Sidebar navigation
- 7.1-7.5: Data accuracy and security
- 8.1-8.2: Code quality

### 2. `partner-dashboard-cross-browser.spec.ts`
**Purpose:** Cross-browser compatibility testing  
**Coverage:** Task 13.2 - Perform cross-browser testing

**Test Suites:**
- Chrome Browser Tests
- Firefox Browser Tests
- WebKit (Safari) Browser Tests
- Translation Consistency Across Browsers
- Responsive Behavior Across Browsers
- CSS and Styling Consistency
- JavaScript Functionality Across Browsers
- Performance Across Browsers
- Browser-Specific Issue Detection

**Requirements Covered:**
- 1.1, 1.3: Language consistency across browsers
- 5.1: Translation display in all browsers
- 8.1: Browser compatibility

### 3. `partner-dashboard-uat-guide.md`
**Purpose:** User Acceptance Testing guide  
**Coverage:** Task 13.3 - Conduct user acceptance testing

**Contents:**
- Comprehensive test scenarios
- Step-by-step testing instructions
- Expected results for each test
- Usability feedback forms
- Issue tracking templates
- Sign-off documentation

**Requirements Covered:** All requirements validation

## Running the Tests

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install
   ```

3. **Set Environment Variables**
   ```bash
   # Linux/Mac
   export TEST_PARTNER_EMAIL="partner@test.com"
   export TEST_PARTNER_PASSWORD="TestPassword123!"
   export BASE_URL="http://localhost:3000"

   # Windows (PowerShell)
   $env:TEST_PARTNER_EMAIL="partner@test.com"
   $env:TEST_PARTNER_PASSWORD="TestPassword123!"
   $env:BASE_URL="http://localhost:3000"

   # Windows (CMD)
   set TEST_PARTNER_EMAIL=partner@test.com
   set TEST_PARTNER_PASSWORD=TestPassword123!
   set BASE_URL=http://localhost:3000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Running All Tests

**Linux/Mac:**
```bash
chmod +x tests/e2e/run-partner-dashboard-tests.sh
./tests/e2e/run-partner-dashboard-tests.sh
```

**Windows:**
```cmd
tests\e2e\run-partner-dashboard-tests.bat
```

### Running Individual Test Suites

**User Flow Tests:**
```bash
npx playwright test tests/e2e/partner-dashboard-improvements.spec.ts
```

**Cross-Browser Tests:**
```bash
# All browsers
npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts

# Specific browser
npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts --project=chromium
npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts --project=firefox
npx playwright test tests/e2e/partner-dashboard-cross-browser.spec.ts --project=webkit
```

**Specific Test:**
```bash
npx playwright test tests/e2e/partner-dashboard-improvements.spec.ts -g "should allow partner to login"
```

### Running Tests in Different Modes

**Headed Mode (see browser):**
```bash
npx playwright test --headed
```

**Debug Mode:**
```bash
npx playwright test --debug
```

**UI Mode (interactive):**
```bash
npx playwright test --ui
```

**Specific Locale:**
```bash
npx playwright test --grep "French"
```

## Test Reports

### HTML Report
After running tests, view the HTML report:
```bash
npx playwright show-report
```

The report includes:
- Test results summary
- Screenshots of failures
- Video recordings of failures
- Detailed error messages
- Test execution timeline

### JSON Report
Located at: `test-results/results.json`

Use for:
- CI/CD integration
- Custom reporting
- Metrics tracking

### JUnit Report
Located at: `test-results/results.xml`

Use for:
- Jenkins integration
- Azure DevOps integration
- Other CI systems

## Test Data Setup

### Test Partner Accounts

Create test partner accounts in your test database:

```sql
-- Partner with properties and bookings
INSERT INTO users (email, role, verification_status) 
VALUES ('partner@test.com', 'partner', 'approved');

-- Partner with no data (empty state testing)
INSERT INTO users (email, role, verification_status) 
VALUES ('partner-empty@test.com', 'partner', 'approved');

-- Partner pending approval
INSERT INTO users (email, role, verification_status) 
VALUES ('partner-pending@test.com', 'partner', 'pending');
```

### Test Properties

```sql
INSERT INTO lofts (name, partner_id, status, price_per_night)
VALUES 
  ('Loft Moderne', 'partner-id', 'available', 15000),
  ('Appartement Vue Mer', 'partner-id', 'occupied', 20000),
  ('Studio Centre-ville', 'partner-id', 'maintenance', 12000);
```

### Test Bookings

```sql
INSERT INTO reservations (loft_id, guest_name, check_in, check_out, status)
VALUES 
  ('loft-id', 'Jean Dupont', '2024-02-01', '2024-02-05', 'confirmed'),
  ('loft-id', 'Marie Martin', '2024-02-10', '2024-02-15', 'pending');
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Partner Dashboard Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run tests
        env:
          TEST_PARTNER_EMAIL: ${{ secrets.TEST_PARTNER_EMAIL }}
          TEST_PARTNER_PASSWORD: ${{ secrets.TEST_PARTNER_PASSWORD }}
          BASE_URL: ${{ secrets.TEST_BASE_URL }}
        run: ./tests/e2e/run-partner-dashboard-tests.sh
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Common Issues

#### 1. Tests Timeout
**Problem:** Tests fail with timeout errors  
**Solution:**
- Increase timeout in playwright.config.ts
- Check if dev server is running
- Verify network connectivity
- Check if test data exists

#### 2. Authentication Fails
**Problem:** Cannot login with test credentials  
**Solution:**
- Verify test account exists in database
- Check password is correct
- Verify partner status is 'approved'
- Check Supabase auth configuration

#### 3. Translation Tests Fail
**Problem:** Translation assertions fail  
**Solution:**
- Verify translation files exist (messages/fr.json, messages/en.json, messages/ar.json)
- Check translation keys match the spec
- Verify next-intl configuration
- Clear browser cache

#### 4. Browser Not Found
**Problem:** Playwright cannot find browser  
**Solution:**
```bash
npx playwright install
```

#### 5. Flaky Tests
**Problem:** Tests pass sometimes, fail other times  
**Solution:**
- Add explicit waits for elements
- Use waitForLoadState()
- Increase timeout for slow operations
- Check for race conditions

### Debug Tips

**1. Take Screenshots:**
```typescript
await page.screenshot({ path: 'debug.png' });
```

**2. Pause Execution:**
```typescript
await page.pause();
```

**3. Console Logs:**
```typescript
page.on('console', msg => console.log(msg.text()));
```

**4. Network Requests:**
```typescript
page.on('request', request => console.log(request.url()));
page.on('response', response => console.log(response.status()));
```

**5. Slow Motion:**
```bash
npx playwright test --headed --slow-mo=1000
```

## Test Coverage

### Requirements Coverage Matrix

| Requirement | Test File | Test Name | Status |
|-------------|-----------|-----------|--------|
| 1.1 | improvements.spec.ts | should allow partner to login in French | ✓ |
| 1.2 | improvements.spec.ts | should allow partner to login in English | ✓ |
| 1.3 | improvements.spec.ts | should allow partner to login in Arabic | ✓ |
| 1.4 | improvements.spec.ts | should switch from French to English | ✓ |
| 1.5 | improvements.spec.ts | should maintain session after language switch | ✓ |
| 2.1 | improvements.spec.ts | should display single dashboard title | ✓ |
| 3.1 | improvements.spec.ts | should display only one logout button | ✓ |
| 4.1-4.5 | improvements.spec.ts | Dashboard features tests | ✓ |
| 5.1-5.5 | cross-browser.spec.ts | Translation consistency tests | ✓ |
| 6.1-6.5 | improvements.spec.ts | Sidebar navigation tests | ✓ |
| 7.1-7.5 | improvements.spec.ts | Data loading and security tests | ✓ |
| 8.1-8.2 | cross-browser.spec.ts | Browser compatibility tests | ✓ |

### Code Coverage

To generate code coverage report:
```bash
npx playwright test --coverage
```

## Best Practices

### Writing Tests

1. **Use Descriptive Test Names**
   ```typescript
   test('should display dashboard in French when locale is fr', async ({ page }) => {
     // Test implementation
   });
   ```

2. **Use Page Object Model**
   ```typescript
   class DashboardPage {
     constructor(private page: Page) {}
     
     async goto(locale: string) {
       await this.page.goto(`/${locale}/partner/dashboard`);
     }
     
     async getTitle() {
       return this.page.locator('h1').textContent();
     }
   }
   ```

3. **Use Fixtures for Common Setup**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await loginAsPartner(page, 'fr');
   });
   ```

4. **Handle Async Properly**
   ```typescript
   await expect(page.locator('h1')).toBeVisible();
   ```

5. **Use Appropriate Selectors**
   - Prefer data-testid attributes
   - Use semantic selectors (role, label)
   - Avoid CSS selectors that may change

### Maintaining Tests

1. **Keep Tests Independent**
   - Each test should be able to run alone
   - Don't rely on test execution order
   - Clean up after tests

2. **Update Tests with Code Changes**
   - Update tests when UI changes
   - Update selectors when markup changes
   - Update assertions when behavior changes

3. **Review Test Failures**
   - Investigate all failures
   - Don't ignore flaky tests
   - Fix root causes, not symptoms

## Contributing

When adding new tests:

1. Follow existing test structure
2. Add descriptive comments
3. Update this README
4. Ensure tests pass locally
5. Add to appropriate test suite
6. Update requirements coverage matrix

## Support

For questions or issues:
- Check troubleshooting section
- Review Playwright documentation
- Contact QA team
- Create issue in project tracker

## References

- [Playwright Documentation](https://playwright.dev/)
- [Partner Dashboard Spec](.kiro/specs/partner-dashboard-improvements/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)
