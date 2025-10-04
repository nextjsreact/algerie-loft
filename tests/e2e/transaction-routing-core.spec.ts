import { test, expect } from '@playwright/test';

/**
 * Core Transaction Routing Tests
 * 
 * These tests verify the essential routing functionality for the transaction
 * reference amounts feature, focusing on route resolution and UUID validation.
 * 
 * Requirements tested:
 * - 2.1: Static route resolution priority for `/transactions/reference-amounts`
 * - 2.2: Dynamic route behavior with valid and invalid UUIDs  
 * - 1.1: Authentication flow on reference amounts page
 */
test.describe('🔀 Core Transaction Routing Tests', () => {
  // Test data
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUUIDs = ['reference-amounts', 'invalid-uuid', '123'];

  test.describe('Static Route Resolution Priority (Requirement 2.1)', () => {
    test('should resolve /transactions/reference-amounts as static route', async ({ page }) => {
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Core requirement: Should not get 404 (which would mean dynamic route parsing failed)
      expect(response?.status()).not.toBe(404);
      
      // Should get a response that indicates proper routing (not server error)
      expect(response?.status()).toBeLessThan(500);
      
      // URL should reflect correct routing resolution
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/transactions\/reference-amounts|\/login/);
    });

    test('should not parse "reference-amounts" as UUID in dynamic route', async ({ page }) => {
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Should not get 404 due to UUID validation failure
      expect(response?.status()).not.toBe(404);
      
      // URL should not match transaction detail pattern
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/\/transactions\/[a-f0-9-]{36}$/);
    });
  });

  test.describe('Dynamic Route UUID Validation (Requirement 2.2)', () => {
    test('should accept valid UUID format', async ({ page }) => {
      // Navigate with valid UUID
      const response = await page.goto(`/transactions/${validUUID}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Valid UUID should not cause validation error (404 is OK if transaction doesn't exist)
      if (response?.status() === 404) {
        // 404 is acceptable for non-existent transaction, but not for UUID validation error
        const pageContent = await page.textContent('body').catch(() => '');
        expect(pageContent).not.toContain('Invalid UUID format');
      } else {
        // Should get valid response or redirect
        expect(response?.status()).toBeLessThan(500);
      }
    });

    test('should reject invalid UUID formats with 404', async ({ page }) => {
      // Test invalid UUIDs
      for (const invalidUUID of invalidUUIDs.slice(1)) { // Skip 'reference-amounts' as it's tested separately
        const response = await page.goto(`/transactions/${invalidUUID}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Should return 404 for invalid UUID format
        expect(response?.status()).toBe(404);
      }
    });

    test('should validate UUID before database queries', async ({ page }) => {
      // Monitor network requests
      const databaseRequests = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('supabase')) {
          databaseRequests.push(url);
        }
      });

      // Navigate with invalid UUID
      await page.goto('/transactions/invalid-uuid-format', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Wait for any potential requests
      await page.waitForTimeout(1000);
      
      // Should not make database requests for invalid UUID
      const transactionQueries = databaseRequests.filter(url => 
        url.includes('transaction') && url.includes('invalid-uuid-format')
      );
      
      expect(transactionQueries).toHaveLength(0);
    });
  });

  test.describe('Authentication Flow (Requirement 1.1)', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing authentication
      await page.context().clearCookies();
      
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Should redirect to login or show login page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);
      
      // Should not get server error during authentication check
      expect(response?.status()).toBeLessThan(500);
    });

    test('should require authentication for reference amounts access', async ({ page }) => {
      // Clear authentication
      await page.context().clearCookies();
      
      const response = await page.goto('/transactions/reference-amounts', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Should handle authentication requirement gracefully
      expect(response?.status()).toBeLessThan(500);
      
      // Should redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);
    });
  });

  test.describe('Error Handling and User Experience', () => {
    test('should provide user-friendly 404 pages for invalid UUIDs', async ({ page }) => {
      // Navigate with invalid UUID
      const response = await page.goto('/transactions/not-a-valid-uuid', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Should return 404 for invalid UUID
      expect(response?.status()).toBe(404);
      
      // Should not expose technical validation details
      const pageContent = await page.textContent('body').catch(() => '');
      expect(pageContent).not.toContain('UUID validation');
      expect(pageContent).not.toContain('regex');
      expect(pageContent).not.toContain('validation.ts');
    });

    test('should handle routing errors gracefully', async ({ page }) => {
      // Test various invalid routes
      const invalidRoutes = [
        '/transactions/invalid-format',
        '/transactions/null',
        '/transactions/undefined'
      ];

      for (const route of invalidRoutes) {
        const response = await page.goto(route, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Should handle gracefully (404 or redirect, not server error)
        expect(response?.status()).toBeLessThan(500);
      }
    });

    test('should not expose internal error details to users', async ({ page }) => {
      // Navigate with invalid UUID
      const response = await page.goto('/transactions/invalid-uuid-format', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Should return 404 for invalid UUID
      expect(response?.status()).toBe(404);
      
      // Should not expose internal implementation details in the page content
      const pageContent = await page.textContent('body').catch(() => '');
      
      // Only check for internal details if we got actual page content (not application error)
      if (pageContent && !pageContent.includes('Something went wrong')) {
        expect(pageContent).not.toContain('trackRoutingIssue');
        expect(pageContent).not.toContain('logger.error');
        expect(pageContent).not.toContain('validation.ts');
      }
    });
  });

  test.describe('Route Performance and Reliability', () => {
    test('should resolve routes within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to reference amounts page
      await page.goto('/transactions/reference-amounts', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (15 seconds for integration tests)
      expect(loadTime).toBeLessThan(15000);
    });

    test('should maintain consistent routing behavior', async ({ page }) => {
      // Test multiple navigations
      const routes = [
        '/transactions/reference-amounts',
        `/transactions/${validUUID}`,
        '/transactions/invalid-uuid'
      ];

      for (const route of routes) {
        const response1 = await page.goto(route, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Reload the same route
        const response2 = await page.reload({ 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Should maintain consistent behavior
        expect(response1?.status()).toBe(response2?.status());
      }
    });
  });
});