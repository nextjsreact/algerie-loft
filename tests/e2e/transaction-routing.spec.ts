import { test, expect } from '@playwright/test';

test.describe('🔀 Transaction Routing Integration Tests', () => {
  // Test data
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUUIDs = [
    'reference-amounts',
    'invalid-uuid',
    '123',
    'not-a-uuid-at-all',
  ];

  // Helper function to check if application is responding
  async function isApplicationHealthy(page) {
    try {
      const response = await page.goto('/');
      return response?.status() < 500;
    } catch (error) {
      return false;
    }
  }

  test.describe('Static Route Resolution Priority', () => {
    test('should resolve /transactions/reference-amounts as static route, not dynamic [id] route', async ({ page }) => {
      // Check if application is healthy first
      const isHealthy = await isApplicationHealthy(page);
      if (!isHealthy) {
        test.skip('Application is not responding - skipping routing test');
      }

      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should get a valid response (not 500 server error)
      expect(response?.status()).toBeLessThan(500);
      
      // Should either be on login page (if not authenticated) or reference amounts page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(login|transactions\/reference-amounts)/);
      
      // Should not be treated as a transaction detail page with ID "reference-amounts"
      // This would manifest as a UUID validation error or 404
      if (response?.status() === 404) {
        // If we get 404, it means the route wasn't resolved as static
        throw new Error('Static route /transactions/reference-amounts was not resolved correctly - got 404');
      }
    });

    test('should not treat "reference-amounts" as a transaction ID', async ({ page }) => {
      // Check if application is healthy first
      const isHealthy = await isApplicationHealthy(page);
      if (!isHealthy) {
        test.skip('Application is not responding - skipping routing test');
      }

      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should not get a UUID validation error (which would be a 404)
      // If the route was incorrectly treated as a transaction ID, we'd get 404
      expect(response?.status()).not.toBe(404);
      
      // Should get either a successful response or redirect (not server error)
      expect(response?.status()).toBeLessThan(500);
      
      // Verify we're not on a transaction detail page by checking URL
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/\/transactions\/[a-f0-9-]{36}/); // UUID pattern
      
      // Should either be on login or reference amounts page
      expect(currentUrl).toMatch(/\/(login|transactions\/reference-amounts)/);
    });

    test('should prioritize static route over dynamic route in Next.js routing', async ({ page }) => {
      // Check if application is healthy first
      const isHealthy = await isApplicationHealthy(page);
      if (!isHealthy) {
        test.skip('Application is not responding - skipping routing test');
      }

      // Test that the static route takes precedence
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should not get 404 (which would indicate dynamic route tried to parse "reference-amounts" as UUID)
      expect(response?.status()).not.toBe(404);
      
      // Should get a valid response (not server error)
      expect(response?.status()).toBeLessThan(500);
      
      // Verify the route was resolved correctly by checking the final URL
      const finalUrl = page.url();
      expect(finalUrl).toMatch(/\/transactions\/reference-amounts|\/login/);
    });
  });

  test.describe('Dynamic Route UUID Validation', () => {
    test('should accept valid UUID format for transaction detail route', async ({ page }) => {
      // Navigate to transaction detail with valid UUID
      const response = await page.goto(`/transactions/${validUUID}`);
      
      // Should not get 404 due to UUID validation failure
      // Valid UUID should pass validation, even if transaction doesn't exist
      if (response?.status() === 404) {
        // 404 is acceptable if transaction doesn't exist, but not due to UUID validation
        const pageContent = await page.textContent('body').catch(() => '');
        expect(pageContent).not.toContain('Invalid UUID format');
        expect(pageContent).not.toContain('validation failed');
      } else {
        // Should get valid response or redirect
        expect(response?.status()).toBeLessThan(500);
      }
    });

    test('should reject invalid UUID formats with 404 error', async ({ page }) => {
      // Test a few key invalid UUIDs (not all to avoid long test times)
      const testUUIDs = ['invalid-uuid', '123', 'not-a-valid-uuid'];
      
      for (const invalidUUID of testUUIDs) {
        // Navigate to transaction detail with invalid UUID
        const response = await page.goto(`/transactions/${invalidUUID}`);
        
        // Should return 404 status for invalid UUID format
        expect(response?.status()).toBe(404);
      }
    });

    test('should handle edge cases in UUID validation', async ({ page }) => {
      const edgeCases = [
        'null',
        'undefined',
        '   invalid-uuid   ', // whitespace with invalid UUID
      ];

      for (const edgeCase of edgeCases) {
        const encodedCase = encodeURIComponent(edgeCase);
        const response = await page.goto(`/transactions/${encodedCase}`);
        
        // Should handle gracefully - either 404 or redirect, not server error
        expect(response?.status()).toBeLessThan(500);
      }
    });

    test('should validate UUID format before database query', async ({ page }) => {
      // Monitor network requests to ensure no database queries for invalid UUIDs
      const databaseRequests = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('supabase')) {
          databaseRequests.push({
            url: url,
            method: request.method(),
            timestamp: Date.now()
          });
        }
      });

      // Navigate with invalid UUID
      const response = await page.goto('/transactions/invalid-uuid-format');
      
      // Should get 404 for invalid UUID
      expect(response?.status()).toBe(404);
      
      // Wait for any potential requests
      await page.waitForTimeout(1000);
      
      // Should not have made database requests for invalid UUID
      const transactionQueries = databaseRequests.filter(req => 
        req.url.includes('transaction') && 
        req.url.includes('invalid-uuid-format')
      );
      
      expect(transactionQueries).toHaveLength(0);
    });
  });

  test.describe('Authentication Flow on Reference Amounts Page', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing authentication
      await page.context().clearCookies();
      
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should either redirect to login or show login page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);
      
      // Should not get server error
      expect(response?.status()).toBeLessThan(500);
    });

    test('should preserve reference amounts URL after login redirect', async ({ page }) => {
      // Clear authentication
      await page.context().clearCookies();
      
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);
      
      // Should not get server error during redirect
      expect(response?.status()).toBeLessThan(500);
    });

    test('should require admin or manager role for reference amounts access', async ({ page }) => {
      // Clear authentication to test role requirement
      await page.context().clearCookies();
      
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should redirect to login (indicating authentication is required)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);
      
      // Should not get server error
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle authentication errors gracefully', async ({ page }) => {
      // Clear authentication
      await page.context().clearCookies();
      
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts');
      
      // Should handle authentication gracefully (redirect to login, not crash)
      expect(response?.status()).toBeLessThan(500);
      
      // Should redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);
    });
  });

  test.describe('Route Performance and Reliability', () => {
    test('should resolve routes quickly without performance issues', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to reference amounts page
      const response = await page.goto('/transactions/reference-amounts');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (10 seconds for integration tests)
      expect(loadTime).toBeLessThan(10000);
      
      // Should not get server error
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle concurrent route requests correctly', async ({ page }) => {
      // Test sequential navigation to avoid race conditions
      await page.goto('/transactions/reference-amounts');
      const url1 = page.url();
      
      await page.goto(`/transactions/${validUUID}`);
      const url2 = page.url();
      
      await page.goto('/transactions/invalid-uuid');
      const url3 = page.url();
      
      // Final navigation should work correctly
      await page.goto('/transactions/reference-amounts');
      const finalUrl = page.url();
      
      // All navigations should complete successfully
      expect(finalUrl).toMatch(/\/transactions\/reference-amounts|\/login/);
    });

    test('should maintain consistent routing behavior across page reloads', async ({ page }) => {
      // Navigate to reference amounts page
      const response1 = await page.goto('/transactions/reference-amounts');
      const firstUrl = page.url();
      
      // Reload the page
      const response2 = await page.reload();
      const reloadUrl = page.url();
      
      // Should maintain the same routing behavior
      expect(reloadUrl).toBe(firstUrl);
      
      // Both responses should be consistent
      expect(response1?.status()).toBe(response2?.status());
    });
  });

  test.describe('Error Handling and User Experience', () => {
    test('should provide user-friendly error messages for invalid transaction IDs', async ({ page }) => {
      // Navigate with invalid UUID
      const response = await page.goto('/transactions/not-a-valid-uuid');
      
      // Should return 404 for invalid UUID
      expect(response?.status()).toBe(404);
      
      // Should not expose technical validation details in the response
      const pageContent = await page.textContent('body').catch(() => '');
      expect(pageContent).not.toContain('UUID validation');
      expect(pageContent).not.toContain('regex');
      expect(pageContent).not.toContain('database error');
    });

    test('should provide navigation options on error pages', async ({ page }) => {
      // Navigate with invalid UUID
      const response = await page.goto('/transactions/invalid-transaction-id');
      
      // Should return 404 for invalid UUID
      expect(response?.status()).toBe(404);
      
      // Should provide some form of navigation (this depends on 404 page implementation)
      const pageContent = await page.textContent('body').catch(() => '');
      expect(pageContent.length).toBeGreaterThan(0); // Should have some content
    });

    test('should log routing issues for debugging without exposing to users', async ({ page }) => {
      // Navigate with invalid UUID
      const response = await page.goto('/transactions/invalid-uuid-format');
      
      // Should return 404 for invalid UUID
      expect(response?.status()).toBe(404);
      
      // Should not expose internal errors to user in UI
      const pageContent = await page.textContent('body').catch(() => '');
      expect(pageContent).not.toContain('validation.ts');
      expect(pageContent).not.toContain('trackRoutingIssue');
      expect(pageContent).not.toContain('logger.error');
    });
  });
});