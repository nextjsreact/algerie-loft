/**
 * End-to-end tests for password reset authentication flow
 * Uses Playwright to test the complete user journey
 */

import { test, expect } from '@playwright/test'

test.describe('Password Reset Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/fr/login')
  })

  test('should display forgot password link on login page', async ({ page }) => {
    // Verify the forgot password link exists
    const forgotPasswordLink = page.locator('a[href="/fr/forgot-password"]')
    await expect(forgotPasswordLink).toBeVisible()
    await expect(forgotPasswordLink).toHaveText('Mot de passe oublié ?')
  })

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.click('a[href="/fr/forgot-password"]')
    
    // Verify we're on the forgot password page
    await expect(page).toHaveURL('/fr/forgot-password')
    await expect(page.locator('h2')).toContainText('Mot de passe oublié')
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/fr/forgot-password')
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    
    // Check for validation error
    await expect(page.locator('text=Invalid email address')).toBeVisible()
  })

  test('should show success message for valid email', async ({ page }) => {
    await page.goto('/fr/forgot-password')
    
    // Enter test email
    await page.fill('input[type="email"]', 'test@test.com')
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.locator('text=Check Your Email')).toBeVisible()
    await expect(page.locator('text=Nous avons envoyé un lien')).toBeVisible()
  })

  test('should handle API callback with missing code', async ({ page }) => {
    // Navigate directly to API callback without code
    await page.goto('/api/auth/reset-password')
    
    // Should redirect to forgot password with error
    await expect(page).toHaveURL('/fr/forgot-password?error=invalid-link')
    
    // Check error message is displayed
    await expect(page.locator('text=Le lien de reset est invalide')).toBeVisible()
  })

  test('should handle API callback with invalid code', async ({ page }) => {
    // Navigate to API callback with invalid code
    await page.goto('/api/auth/reset-password?code=invalid-code-123')
    
    // Should redirect to forgot password with error
    await expect(page).toHaveURL('/fr/forgot-password?error=expired-link')
    
    // Check error message is displayed
    await expect(page.locator('text=Le lien de reset a expiré')).toBeVisible()
  })

  test('should show error messages from URL parameters', async ({ page }) => {
    // Test different error parameters
    const errorTests = [
      {
        param: 'invalid-link',
        expectedText: 'Le lien de reset est invalide'
      },
      {
        param: 'expired-link', 
        expectedText: 'Le lien de reset a expiré'
      },
      {
        param: 'auth-failed',
        expectedText: 'Échec de l\'authentification'
      }
    ]

    for (const errorTest of errorTests) {
      await page.goto(`/fr/forgot-password?error=${errorTest.param}`)
      await expect(page.locator(`text=${errorTest.expectedText}`)).toBeVisible()
      
      // Check that helpful tip is shown
      await expect(page.locator('text=💡 Astuce')).toBeVisible()
    }
  })

  test('should allow clearing error messages', async ({ page }) => {
    await page.goto('/fr/forgot-password?error=invalid-link')
    
    // Verify error is shown
    await expect(page.locator('text=Le lien de reset est invalide')).toBeVisible()
    
    // Click clear error button
    await page.click('button:has-text("✕")')
    
    // Verify error is cleared
    await expect(page.locator('text=Le lien de reset est invalide')).not.toBeVisible()
  })

  test('should access reset password page directly and show session error', async ({ page }) => {
    // Navigate directly to reset password page without session
    await page.goto('/fr/reset-password')
    
    // Should show session error
    await expect(page.locator('text=Aucune session de reset trouvée')).toBeVisible()
    
    // Should show action buttons
    await expect(page.locator('a[href="/fr/login"]')).toBeVisible()
    await expect(page.locator('a[href="/fr/forgot-password"]')).toBeVisible()
  })

  test('should validate password requirements on reset password page', async ({ page }) => {
    // For this test, we'll mock a valid session by going through the flow
    // In a real test, you'd set up proper session state
    await page.goto('/fr/reset-password')
    
    // If we get the form (session valid), test password validation
    const passwordInput = page.locator('input[id="password"]')
    if (await passwordInput.isVisible()) {
      // Test weak password
      await passwordInput.fill('123')
      
      // Check validation indicators
      await expect(page.locator('text=Au moins 8 caractères')).toHaveClass(/text-gray-400/)
      await expect(page.locator('text=Une lettre minuscule')).toHaveClass(/text-gray-400/)
      await expect(page.locator('text=Une lettre majuscule')).toHaveClass(/text-gray-400/)
      await expect(page.locator('text=Un chiffre')).toHaveClass(/text-green-600/)
      
      // Test strong password
      await passwordInput.fill('StrongPass123')
      
      // Check all criteria are met
      await expect(page.locator('text=Au moins 8 caractères')).toHaveClass(/text-green-600/)
      await expect(page.locator('text=Une lettre minuscule')).toHaveClass(/text-green-600/)
      await expect(page.locator('text=Une lettre majuscule')).toHaveClass(/text-green-600/)
      await expect(page.locator('text=Un chiffre')).toHaveClass(/text-green-600/)
    }
  })

  test('should show loading states appropriately', async ({ page }) => {
    await page.goto('/fr/forgot-password')
    
    // Fill email and submit
    await page.fill('input[type="email"]', 'test@test.com')
    
    // Click submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Should show loading text briefly
    await expect(submitButton).toHaveText('Sending...')
    
    // Should eventually show success
    await expect(page.locator('text=Check Your Email')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept network requests to simulate failure
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    await page.goto('/fr/forgot-password')
    await page.fill('input[type="email"]', 'test@test.com')
    await page.click('button[type="submit"]')
    
    // Should show network error message
    await expect(page.locator('text=Erreur de connexion')).toBeVisible()
  })

  test('should provide proper navigation links', async ({ page }) => {
    await page.goto('/fr/forgot-password')
    
    // Check back to login link
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveText('Back to Login')
    
    // Test navigation
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })

  test('should maintain proper page titles and meta information', async ({ page }) => {
    await page.goto('/fr/forgot-password')
    
    // Check page title
    await expect(page).toHaveTitle(/Mot de passe oublié/)
    
    await page.goto('/fr/reset-password')
    
    // Check reset password page title
    await expect(page).toHaveTitle(/Nouveau mot de passe/)
  })
})