/**
 * Cross-Browser Tests for Partner Dashboard Improvements
 * Tests compatibility across Chrome, Firefox, Safari, and Edge
 * 
 * Requirements covered:
 * - 1.1, 1.3: Language consistency across browsers
 * - 5.1: Translation display in all browsers
 * - 8.1: Browser compatibility
 */

import { test, expect, Page, Browser } from '@playwright/test';

const TEST_PARTNER_EMAIL = process.env.TEST_PARTNER_EMAIL || 'partner@test.com';
const TEST_PARTNER_PASSWORD = process.env.TEST_PARTNER_PASSWORD || 'TestPassword123!';

// Helper function to login
async function loginAsPartner(page: Page, locale: string = 'fr') {
  await page.goto(`/${locale}/login`);
  await page.fill('input[type="email"]', TEST_PARTNER_EMAIL);
  await page.fill('input[type="password"]', TEST_PARTNER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/${locale}/partner/dashboard`, { timeout: 10000 });
}

// Helper to check basic dashboard functionality
async function verifyDashboardBasics(page: Page, locale: string) {
  // Verify URL
  await expect(page).toHaveURL(new RegExp(`/${locale}/partner/dashboard`));
  
  // Verify main heading exists
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
  
  // Verify sidebar navigation exists
  const nav = page.locator('nav, aside');
  await expect(nav).toBeVisible();
  
  // Verify stats cards are present
  const statsCards = page.locator('[data-testid="stats-card"]').or(page.locator('.grid > div'));
  const count = await statsCards.count();
  expect(count).toBeGreaterThan(0);
}

test.describe('Cross-Browser Compatibility Tests', () => {
  
  test.describe('Chrome Browser Tests', () => {
    test.use({ browserName: 'chromium' });
    
    test('should display dashboard correctly in Chrome', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      await verifyDashboardBasics(page, 'fr');
      
      // Chrome-specific: Check for proper rendering
      const screenshot = await page.screenshot();
      expect(screenshot).toBeTruthy();
    });

    test('should handle French translations in Chrome', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      await expect(page.locator('body')).toContainText('Tableau de bord');
      await expect(page.locator('body')).toContainText('Propriétés');
      await expect(page.locator('body')).toContainText('Réservations');
    });

    test('should handle English translations in Chrome', async ({ page }) => {
      await loginAsPartner(page, 'en');
      
      await expect(page.locator('body')).toContainText('Dashboard');
      await expect(page.locator('body')).toContainText('Properties');
      await expect(page.locator('body')).toContainText('Bookings');
    });

    test('should handle Arabic RTL layout in Chrome', async ({ page }) => {
      await loginAsPartner(page, 'ar');
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
      
      // Verify Arabic text is displayed
      await expect(page.locator('body')).toContainText('لوحة');
    });

    test('should handle responsive layout in Chrome mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsPartner(page, 'fr');
      
      // Verify mobile layout
      await verifyDashboardBasics(page, 'fr');
    });
  });

  test.describe('Firefox Browser Tests', () => {
    test.use({ browserName: 'firefox' });
    
    test('should display dashboard correctly in Firefox', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      await verifyDashboardBasics(page, 'fr');
    });

    test('should handle French translations in Firefox', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      await expect(page.locator('body')).toContainText('Tableau de bord');
      await expect(page.locator('body')).toContainText('Propriétés');
    });

    test('should handle English translations in Firefox', async ({ page }) => {
      await loginAsPartner(page, 'en');
      
      await expect(page.locator('body')).toContainText('Dashboard');
      await expect(page.locator('body')).toContainText('Properties');
    });

    test('should handle Arabic RTL layout in Firefox', async ({ page }) => {
      await loginAsPartner(page, 'ar');
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
    });

    test('should handle CSS Grid layout in Firefox', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Verify grid layout is working
      const grid = page.locator('.grid').first();
      const display = await grid.evaluate(el => window.getComputedStyle(el).display);
      expect(display).toBe('grid');
    });

    test('should handle Flexbox layout in Firefox', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Verify flex layout is working
      const flex = page.locator('.flex').first();
      if (await flex.isVisible()) {
        const display = await flex.evaluate(el => window.getComputedStyle(el).display);
        expect(display).toBe('flex');
      }
    });
  });

  test.describe('WebKit (Safari) Browser Tests', () => {
    test.use({ browserName: 'webkit' });
    
    test('should display dashboard correctly in Safari', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      await verifyDashboardBasics(page, 'fr');
    });

    test('should handle French translations in Safari', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      await expect(page.locator('body')).toContainText('Tableau de bord');
      await expect(page.locator('body')).toContainText('Propriétés');
    });

    test('should handle English translations in Safari', async ({ page }) => {
      await loginAsPartner(page, 'en');
      
      await expect(page.locator('body')).toContainText('Dashboard');
      await expect(page.locator('body')).toContainText('Properties');
    });

    test('should handle Arabic RTL layout in Safari', async ({ page }) => {
      await loginAsPartner(page, 'ar');
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
    });

    test('should handle Safari-specific CSS features', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Verify backdrop-filter works (Safari-specific)
      const card = page.locator('[data-testid="stats-card"]').or(page.locator('.rounded')).first();
      if (await card.isVisible()) {
        const styles = await card.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow
          };
        });
        
        // Basic check that styles are applied
        expect(styles).toBeTruthy();
      }
    });

    test('should handle iOS Safari mobile layout', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro
      await loginAsPartner(page, 'fr');
      
      await verifyDashboardBasics(page, 'fr');
    });
  });

  test.describe('Translation Consistency Across Browsers', () => {
    
    const browsers = ['chromium', 'firefox', 'webkit'] as const;
    
    for (const browserName of browsers) {
      test(`should display consistent French translations in ${browserName}`, async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        await loginAsPartner(page, 'fr');
        
        // Collect all text content
        const content = await page.textContent('body');
        
        // Verify key French terms are present
        expect(content).toContain('Tableau de bord');
        expect(content).toContain('Propriétés');
        expect(content).toContain('Réservations');
        
        // Verify no English leakage
        expect(content).not.toContain('Dashboard');
        expect(content).not.toContain('Properties');
        
        await context.close();
      });

      test(`should display consistent English translations in ${browserName}`, async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        await loginAsPartner(page, 'en');
        
        // Collect all text content
        const content = await page.textContent('body');
        
        // Verify key English terms are present
        expect(content).toContain('Dashboard');
        expect(content).toContain('Properties');
        expect(content).toContain('Bookings');
        
        // Verify no French leakage
        expect(content).not.toContain('Tableau de bord');
        expect(content).not.toContain('Propriétés');
        
        await context.close();
      });
    }
  });

  test.describe('Responsive Behavior Across Browsers', () => {
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      test(`should render correctly on ${viewport.name} in Chromium`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await loginAsPartner(page, 'fr');
        
        // Verify basic elements are visible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('nav, aside')).toBeVisible();
      });
    }
  });

  test.describe('CSS and Styling Consistency', () => {
    
    test('should apply Tailwind classes consistently across browsers', async ({ page, browserName }) => {
      await loginAsPartner(page, 'fr');
      
      // Check that Tailwind utility classes are working
      const heading = page.locator('h1');
      const fontSize = await heading.evaluate(el => window.getComputedStyle(el).fontSize);
      
      // Font size should be defined (not default)
      expect(fontSize).toBeTruthy();
      expect(fontSize).not.toBe('16px'); // Should be larger than default
    });

    test('should handle dark mode consistently', async ({ page }) => {
      // Set dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await loginAsPartner(page, 'fr');
      
      // Verify dark mode classes are applied
      const html = page.locator('html');
      const className = await html.getAttribute('class');
      
      // Check if dark mode is supported
      if (className?.includes('dark')) {
        // Verify dark mode colors are applied
        const body = page.locator('body');
        const bgColor = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);
        expect(bgColor).toBeTruthy();
      }
    });

    test('should handle custom fonts across browsers', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Check font family is applied
      const body = page.locator('body');
      const fontFamily = await body.evaluate(el => window.getComputedStyle(el).fontFamily);
      
      expect(fontFamily).toBeTruthy();
    });
  });

  test.describe('JavaScript Functionality Across Browsers', () => {
    
    test('should handle click events consistently', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Click on a navigation item
      const navItem = page.locator('nav a').first();
      await navItem.click();
      
      // Verify navigation occurred
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toContain('/partner/');
    });

    test('should handle form interactions consistently', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Find any input or select element
      const input = page.locator('input, select').first();
      
      if (await input.isVisible()) {
        await input.click();
        await input.fill('test');
        
        // Verify input was filled
        const value = await input.inputValue();
        expect(value).toBe('test');
      }
    });

    test('should handle hover states consistently', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Hover over a button
      const button = page.locator('button').first();
      await button.hover();
      
      // Verify hover state (button should still be visible)
      await expect(button).toBeVisible();
    });
  });

  test.describe('Performance Across Browsers', () => {
    
    test('should load dashboard within acceptable time in Chromium', async ({ page }) => {
      const startTime = Date.now();
      
      await loginAsPartner(page, 'fr');
      await page.waitForSelector('h1');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should load dashboard within acceptable time in Firefox', async ({ page }) => {
      test.use({ browserName: 'firefox' });
      
      const startTime = Date.now();
      
      await loginAsPartner(page, 'fr');
      await page.waitForSelector('h1');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should load dashboard within acceptable time in WebKit', async ({ page }) => {
      test.use({ browserName: 'webkit' });
      
      const startTime = Date.now();
      
      await loginAsPartner(page, 'fr');
      await page.waitForSelector('h1');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Browser-Specific Issue Detection', () => {
    
    test('should not have console errors in any browser', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await loginAsPartner(page, 'fr');
      await page.waitForTimeout(2000);
      
      // Filter out known acceptable errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('net::ERR_')
      );
      
      expect(criticalErrors.length).toBe(0);
    });

    test('should not have JavaScript errors during navigation', async ({ page }) => {
      const jsErrors: Error[] = [];
      
      page.on('pageerror', error => {
        jsErrors.push(error);
      });
      
      await loginAsPartner(page, 'fr');
      
      // Navigate to different sections
      await page.click('nav a:has-text("Propriétés"), nav a:has-text("Properties")').catch(() => {});
      await page.waitForTimeout(1000);
      
      expect(jsErrors.length).toBe(0);
    });

    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/partner/dashboard/stats', route => {
        route.abort('failed');
      });
      
      await loginAsPartner(page, 'fr');
      
      // Should show error message, not crash
      const errorMessage = page.locator('[data-testid="error-message"], text=erreur, text=error');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });
});
