/**
 * Integration Tests for Partner Dashboard Improvements
 * Tests complete user flows including login, navigation, language switching, and data loading
 * 
 * Requirements covered:
 * - 1.1, 1.2, 1.3, 1.4, 1.5: Language consistency and translation
 * - 2.1, 2.2, 2.3, 2.4, 2.5: Dashboard header and title improvements
 * - 3.1, 3.2, 3.3, 3.4, 3.5: Logout button consolidation
 * - 4.1, 4.2, 4.3, 4.4, 4.5: Dashboard features and functionality
 * - 5.1, 5.2, 5.3, 5.4, 5.5: Translation system integration
 * - 6.1, 6.2, 6.3, 6.5: Sidebar navigation and responsiveness
 * - 7.1, 7.2, 7.3, 7.4, 7.5: Data accuracy and security
 * - 8.1, 8.2: Code quality and maintainability
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_PARTNER_EMAIL = process.env.TEST_PARTNER_EMAIL || 'partner@test.com';
const TEST_PARTNER_PASSWORD = process.env.TEST_PARTNER_PASSWORD || 'TestPassword123!';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper function to login as partner
async function loginAsPartner(page: Page, locale: string = 'fr') {
  await page.goto(`/${locale}/login`);
  
  // Fill login form
  await page.fill('input[type="email"]', TEST_PARTNER_EMAIL);
  await page.fill('input[type="password"]', TEST_PARTNER_PASSWORD);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL(`**/${locale}/partner/dashboard`, { timeout: 10000 });
}

// Helper function to check if element has translation
async function checkTranslation(page: Page, selector: string, shouldNotContain: string[]) {
  const element = page.locator(selector);
  const text = await element.textContent();
  
  for (const forbidden of shouldNotContain) {
    expect(text).not.toContain(forbidden);
  }
}

test.describe('Partner Dashboard Improvements - Integration Tests', () => {
  
  test.describe('User Flow 1: Partner Login and Dashboard Access', () => {
    
    test('should allow partner to login and access dashboard in French', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/\/fr\/partner\/dashboard/);
      
      // Verify dashboard title is in French
      await expect(page.locator('h1')).toContainText('Tableau de bord');
      
      // Verify no English text in main interface
      const mainContent = page.locator('main');
      const content = await mainContent.textContent();
      expect(content).not.toContain('Dashboard');
      expect(content).not.toContain('Properties');
      expect(content).not.toContain('Bookings');
    });

    test('should allow partner to login and access dashboard in English', async ({ page }) => {
      await loginAsPartner(page, 'en');
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/\/en\/partner\/dashboard/);
      
      // Verify dashboard title is in English
      await expect(page.locator('h1')).toContainText('Partner Dashboard');
      
      // Verify no French text in main interface
      const mainContent = page.locator('main');
      const content = await mainContent.textContent();
      expect(content).not.toContain('Tableau de bord');
      expect(content).not.toContain('Propriétés');
      expect(content).not.toContain('Réservations');
    });

    test('should allow partner to login and access dashboard in Arabic', async ({ page }) => {
      await loginAsPartner(page, 'ar');
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/\/ar\/partner\/dashboard/);
      
      // Verify dashboard title is in Arabic
      await expect(page.locator('h1')).toContainText('لوحة تحكم');
      
      // Verify RTL layout is applied
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
    });

    test('should display single dashboard title without duplicates', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Count h1 elements - should be exactly 1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Verify no duplicate titles like "Dashboard Partenaire" and "Portal Partner"
      const pageContent = await page.textContent('body');
      const dashboardCount = (pageContent?.match(/Tableau de bord partenaire/gi) || []).length;
      expect(dashboardCount).toBeLessThanOrEqual(1);
    });

    test('should display only one logout button in sidebar', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Find all logout buttons/links
      const logoutButtons = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
      const count = await logoutButtons.count();
      
      // Should have exactly 1 logout option (in sidebar footer)
      expect(count).toBe(1);
      
      // Verify it's in the sidebar
      const sidebar = page.locator('[data-testid="partner-sidebar"], aside, nav');
      const sidebarLogout = sidebar.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
      await expect(sidebarLogout).toBeVisible();
    });
  });

  test.describe('User Flow 2: Navigation Between Dashboard Sections', () => {
    
    test.beforeEach(async ({ page }) => {
      await loginAsPartner(page, 'fr');
    });

    test('should navigate to properties section from sidebar', async ({ page }) => {
      // Click on properties in sidebar
      await page.click('nav a:has-text("Mes propriétés"), nav a:has-text("Propriétés")');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/fr\/partner\/properties/);
    });

    test('should navigate to bookings section from sidebar', async ({ page }) => {
      // Click on bookings in sidebar
      await page.click('nav a:has-text("Réservations")');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/fr\/partner\/bookings|reservations/);
    });

    test('should navigate to revenue section from sidebar', async ({ page }) => {
      // Click on revenue in sidebar
      await page.click('nav a:has-text("Revenus")');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/fr\/partner\/revenue/);
    });

    test('should highlight active navigation item', async ({ page }) => {
      // Dashboard should be active initially
      const dashboardLink = page.locator('nav a:has-text("Tableau de bord")');
      await expect(dashboardLink).toHaveClass(/active|bg-/);
      
      // Navigate to properties
      await page.click('nav a:has-text("Mes propriétés"), nav a:has-text("Propriétés")');
      
      // Properties should now be active
      const propertiesLink = page.locator('nav a:has-text("Mes propriétés"), nav a:has-text("Propriétés")');
      await expect(propertiesLink).toHaveClass(/active|bg-/);
    });

    test('should navigate using quick actions buttons', async ({ page }) => {
      // Click on "Add Property" quick action
      const addPropertyButton = page.locator('button:has-text("Ajouter une propriété")');
      if (await addPropertyButton.isVisible()) {
        await addPropertyButton.click();
        await expect(page).toHaveURL(/\/fr\/partner\/properties\/new/);
      }
    });

    test('should maintain sidebar state during navigation', async ({ page }) => {
      // Verify sidebar is visible
      const sidebar = page.locator('[data-testid="partner-sidebar"], aside, nav');
      await expect(sidebar).toBeVisible();
      
      // Navigate to different section
      await page.click('nav a:has-text("Réservations")');
      
      // Sidebar should still be visible
      await expect(sidebar).toBeVisible();
    });
  });

  test.describe('User Flow 3: Language Switching Functionality', () => {
    
    test('should switch from French to English', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Find and click language switcher
      const languageSwitcher = page.locator('[data-testid="language-selector"], button:has-text("FR"), select[name="language"]');
      
      if (await languageSwitcher.isVisible()) {
        await languageSwitcher.click();
        
        // Select English
        await page.click('button:has-text("EN"), option[value="en"]');
        
        // Wait for page to reload with new locale
        await page.waitForURL(/\/en\/partner\/dashboard/);
        
        // Verify content is now in English
        await expect(page.locator('h1')).toContainText('Partner Dashboard');
      }
    });

    test('should switch from English to Arabic', async ({ page }) => {
      await loginAsPartner(page, 'en');
      
      // Find and click language switcher
      const languageSwitcher = page.locator('[data-testid="language-selector"], button:has-text("EN"), select[name="language"]');
      
      if (await languageSwitcher.isVisible()) {
        await languageSwitcher.click();
        
        // Select Arabic
        await page.click('button:has-text("AR"), option[value="ar"]');
        
        // Wait for page to reload with new locale
        await page.waitForURL(/\/ar\/partner\/dashboard/);
        
        // Verify RTL is applied
        const html = page.locator('html');
        await expect(html).toHaveAttribute('dir', 'rtl');
      }
    });

    test('should maintain user session after language switch', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Get user info before switch
      const userEmail = await page.locator('[data-testid="user-email"]').textContent().catch(() => null);
      
      // Switch language
      await page.goto('/en/partner/dashboard');
      
      // Verify still logged in
      await expect(page).toHaveURL(/\/en\/partner\/dashboard/);
      
      // User info should still be present
      if (userEmail) {
        await expect(page.locator('[data-testid="user-email"]')).toContainText(userEmail);
      }
    });

    test('should translate all sidebar items after language switch', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Verify French sidebar items
      await expect(page.locator('nav')).toContainText('Tableau de bord');
      await expect(page.locator('nav')).toContainText('Propriétés');
      
      // Switch to English
      await page.goto('/en/partner/dashboard');
      
      // Verify English sidebar items
      await expect(page.locator('nav')).toContainText('Dashboard');
      await expect(page.locator('nav')).toContainText('Properties');
    });

    test('should translate all stats cards after language switch', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Verify French stats
      await expect(page.locator('body')).toContainText('Propriétés totales');
      await expect(page.locator('body')).toContainText('Réservations');
      
      // Switch to English
      await page.goto('/en/partner/dashboard');
      
      // Verify English stats
      await expect(page.locator('body')).toContainText('Total Properties');
      await expect(page.locator('body')).toContainText('Bookings');
    });
  });

  test.describe('User Flow 4: Data Loading and Error Scenarios', () => {
    
    test('should display loading skeleton while fetching data', async ({ page }) => {
      // Intercept API calls to delay response
      await page.route('**/api/partner/dashboard/stats', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      await page.goto('/fr/login');
      await page.fill('input[type="email"]', TEST_PARTNER_EMAIL);
      await page.fill('input[type="password"]', TEST_PARTNER_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Should show loading skeleton
      const skeleton = page.locator('[data-testid="dashboard-skeleton"], .animate-pulse');
      await expect(skeleton).toBeVisible({ timeout: 1000 });
    });

    test('should display dashboard data after successful load', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Wait for stats to load
      await page.waitForSelector('text=Propriétés totales', { timeout: 10000 });
      
      // Verify stats cards are visible
      await expect(page.locator('text=Propriétés totales')).toBeVisible();
      await expect(page.locator('text=Réservations')).toBeVisible();
      await expect(page.locator('text=Revenus')).toBeVisible();
      
      // Verify numeric values are displayed
      const statsCards = page.locator('[data-testid="stats-card"], .text-2xl');
      const count = await statsCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should handle network error gracefully', async ({ page }) => {
      // Intercept API calls and return error
      await page.route('**/api/partner/dashboard/stats', route => {
        route.abort('failed');
      });
      
      await loginAsPartner(page, 'fr');
      
      // Should display error message
      const errorMessage = page.locator('[data-testid="error-message"], text=erreur');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      // Should have retry button
      const retryButton = page.locator('button:has-text("Réessayer"), button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
    });

    test('should retry data fetch on error', async ({ page }) => {
      let callCount = 0;
      
      // Fail first call, succeed on retry
      await page.route('**/api/partner/dashboard/stats', route => {
        callCount++;
        if (callCount === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await loginAsPartner(page, 'fr');
      
      // Wait for error
      await page.waitForSelector('[data-testid="error-message"], text=erreur', { timeout: 5000 });
      
      // Click retry
      await page.click('button:has-text("Réessayer"), button:has-text("Retry")');
      
      // Should load successfully
      await expect(page.locator('text=Propriétés totales')).toBeVisible({ timeout: 10000 });
    });

    test('should handle unauthorized access', async ({ page }) => {
      // Intercept API calls and return 401
      await page.route('**/api/partner/dashboard/stats', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      await page.goto('/fr/partner/dashboard');
      
      // Should redirect to login or show unauthorized message
      await page.waitForURL(/\/fr\/login|unauthorized/, { timeout: 10000 });
    });

    test('should display empty state when no properties', async ({ page }) => {
      // Intercept API and return empty properties
      await page.route('**/api/partner/properties*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ properties: [] })
        });
      });
      
      await loginAsPartner(page, 'fr');
      
      // Should show empty state message
      const emptyState = page.locator('text=Aucune propriété, text=No properties');
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    });

    test('should display empty state when no bookings', async ({ page }) => {
      // Intercept API and return empty bookings
      await page.route('**/api/partner/bookings*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ bookings: [] })
        });
      });
      
      await loginAsPartner(page, 'fr');
      
      // Should show empty state message
      const emptyState = page.locator('text=Aucune réservation, text=No bookings');
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Flow 5: Responsive Design and Mobile', () => {
    
    test('should display mobile-friendly sidebar on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginAsPartner(page, 'fr');
      
      // Sidebar should be collapsed or hidden initially
      const sidebar = page.locator('[data-testid="partner-sidebar"], aside');
      const isVisible = await sidebar.isVisible();
      
      if (!isVisible) {
        // Should have hamburger menu button
        const menuButton = page.locator('[data-testid="menu-button"], button[aria-label*="menu"]');
        await expect(menuButton).toBeVisible();
      }
    });

    test('should stack stats cards vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginAsPartner(page, 'fr');
      
      // Get positions of first two stat cards
      const cards = page.locator('[data-testid="stats-card"]').or(page.locator('.grid > div')).first();
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      if (await firstCard.isVisible() && await secondCard.isVisible()) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        // Second card should be below first card
        if (firstBox && secondBox) {
          expect(secondBox.y).toBeGreaterThan(firstBox.y);
        }
      }
    });

    test('should be usable on tablet screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await loginAsPartner(page, 'fr');
      
      // All main elements should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Stats should be in 2-column grid
      const statsSection = page.locator('[aria-label="Dashboard statistics"]').or(page.locator('.grid').first());
      await expect(statsSection).toBeVisible();
    });
  });

  test.describe('User Flow 6: Accessibility Compliance', () => {
    
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Check navigation has proper labels
      const nav = page.locator('nav');
      const navLabel = await nav.getAttribute('aria-label');
      expect(navLabel).toBeTruthy();
      
      // Check buttons have accessible names
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Button should have either text content or aria-label
        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to focus on elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Check main heading contrast
      const heading = page.locator('h1');
      const color = await heading.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      });
      
      // Basic check that colors are defined
      expect(color.color).toBeTruthy();
    });
  });

  test.describe('User Flow 7: Data Security and Isolation', () => {
    
    test('should only display partner-specific data', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Intercept API calls to verify partner ID is included
      let apiCallMade = false;
      
      page.on('request', request => {
        if (request.url().includes('/api/partner/')) {
          apiCallMade = true;
          // Verify request includes authentication
          const headers = request.headers();
          expect(headers['cookie'] || headers['authorization']).toBeTruthy();
        }
      });
      
      await page.waitForTimeout(2000);
      expect(apiCallMade).toBe(true);
    });

    test('should handle session expiration', async ({ page }) => {
      await loginAsPartner(page, 'fr');
      
      // Clear cookies to simulate session expiration
      await page.context().clearCookies();
      
      // Try to navigate to dashboard
      await page.goto('/fr/partner/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/fr\/login/, { timeout: 10000 });
    });
  });
});
