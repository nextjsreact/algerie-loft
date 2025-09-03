import { test, expect } from '@playwright/test';

test.describe('📊 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // Add your authentication logic here
    // For now, we'll assume user is authenticated
  });

  test('should display dashboard stats cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check stats cards are visible
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
    
    // Check individual stat cards
    await expect(page.locator('text=Total Lofts')).toBeVisible();
    await expect(page.locator('text=Réservations')).toBeVisible();
    await expect(page.locator('text=Revenus')).toBeVisible();
    await expect(page.locator('text=Propriétaires')).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check recent activities section
    await expect(page.locator('text=Activités Récentes')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
  });

  test('should display charts and analytics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check charts section
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="occupancy-chart"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Stats cards should stack vertically on mobile
    const statsCards = page.locator('[data-testid="stats-card"]');
    const firstCard = statsCards.first();
    const secondCard = statsCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Second card should be below first card on mobile
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
  });

  test('should navigate to detailed views from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on lofts stat card
    await page.click('[data-testid="lofts-stat-card"]');
    await expect(page).toHaveURL(/.*\/lofts/);
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Click on reservations stat card
    await page.click('[data-testid="reservations-stat-card"]');
    await expect(page).toHaveURL(/.*\/reservations/);
  });

  test('should display user greeting', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show personalized greeting
    await expect(page.locator('text=Bonjour')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  });

  test('should show notifications badge', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if notifications are visible in sidebar
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    
    // Badge should be visible if there are unread notifications
    if (await notificationBadge.isVisible()) {
      await expect(notificationBadge).toContainText(/\d+/);
    }
  });
});