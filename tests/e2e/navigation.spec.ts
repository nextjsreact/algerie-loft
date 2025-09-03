import { test, expect } from '@playwright/test';

test.describe('🧭 Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for navigation tests
    await page.goto('/');
    
    // Add authentication cookie/session mock here
    // This would depend on your auth implementation
  });

  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements
    await expect(page.locator('h1')).toContainText('Loft Algérie');
    await expect(page.locator('text=Système de gestion immobilière')).toBeVisible();
    
    // Check navigation cards
    await expect(page.locator('text=Gestion des Lofts')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('text=Rapports PDF')).toBeVisible();
    await expect(page.locator('text=Propriétaires')).toBeVisible();
  });

  test('should navigate to different sections from homepage', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to lofts
    await page.click('text=Voir les Lofts');
    await expect(page).toHaveURL(/.*\/lofts/);
    
    // Go back to homepage
    await page.goto('/');
    
    // Test navigation to transactions
    await page.click('text=Voir Transactions');
    await expect(page).toHaveURL(/.*\/transactions/);
    
    // Go back to homepage
    await page.goto('/');
    
    // Test navigation to reports
    await page.click('text=Générer Rapports');
    await expect(page).toHaveURL(/.*\/reports/);
  });

  test('should display responsive navigation', async ({ page }) => {
    // Test desktop navigation
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/dashboard');
    
    // Should show sidebar on desktop
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should show mobile header with menu button
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-button"]')).toBeVisible();
    
    // Should hide sidebar on mobile
    await expect(page.locator('[data-testid="sidebar"]')).toBeHidden();
  });

  test('should open mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Click menu button
    await page.click('[data-testid="menu-button"]');
    
    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('should display language selector', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show language selector
    await expect(page.locator('[data-testid="language-selector"]')).toBeVisible();
    
    // Click language selector
    await page.click('[data-testid="language-selector"]');
    
    // Should show language options
    await expect(page.locator('text=Français')).toBeVisible();
    await expect(page.locator('text=English')).toBeVisible();
    await expect(page.locator('text=العربية')).toBeVisible();
  });

  test('should change language', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click language selector
    await page.click('[data-testid="language-selector"]');
    
    // Select English
    await page.click('text=English');
    
    // Page should reload with English
    await page.waitForLoadState('networkidle');
    
    // Check if language changed (this would depend on your i18n implementation)
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});