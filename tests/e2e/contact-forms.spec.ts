import { test, expect } from '@playwright/test'

test.describe('Contact Forms', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoints to avoid actual email sending during tests
    await page.route('**/api/contact', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Your message has been sent successfully. We will get back to you soon!',
          submissionId: 'test-submission-id'
        })
      })
    })

    await page.route('**/api/property-inquiry', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Your property inquiry has been submitted successfully. We will contact you soon!',
          submissionId: 'test-inquiry-id'
        })
      })
    })

    await page.route('**/api/service-inquiry', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Your service inquiry has been submitted successfully. We will contact you soon!',
          submissionId: 'test-service-id'
        })
      })
    })

    await page.route('**/api/callback-request', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Your callback request has been submitted successfully. We will call you soon!',
          submissionId: 'test-callback-id'
        })
      })
    })
  })

  test('contact form submission flow', async ({ page }) => {
    await page.goto('/en/contact')

    // Wait for the form to be visible
    await expect(page.getByRole('heading', { name: /send us a message/i })).toBeVisible()

    // Fill out the contact form
    await page.getByLabel(/full name/i).fill('John Doe')
    await page.getByLabel(/email address/i).fill('john@example.com')
    await page.getByLabel(/phone number/i).fill('+1234567890')
    await page.getByLabel(/subject/i).fill('Test inquiry from E2E test')
    await page.getByLabel(/message/i).fill('This is a test message to verify the contact form functionality works correctly in the browser.')
    
    // Select preferred contact method
    await page.getByLabel(/preferred contact method/i).click()
    await page.getByText('Email').click()
    
    // Accept consent
    await page.getByLabel(/i consent to being contacted/i).check()

    // Submit the form
    await page.getByRole('button', { name: /send message/i }).click()

    // Wait for success message
    await expect(page.getByText(/message sent!/i)).toBeVisible()
    await expect(page.getByText(/thank you for your message/i)).toBeVisible()

    // Verify the "Send Another Message" button works
    await page.getByRole('button', { name: /send another message/i }).click()
    await expect(page.getByRole('heading', { name: /send us a message/i })).toBeVisible()
  })

  test('contact form validation', async ({ page }) => {
    await page.goto('/en/contact')

    // Try to submit empty form
    await page.getByRole('button', { name: /send message/i }).click()

    // Check for validation errors
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible()
    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible()
    await expect(page.getByText(/subject must be at least 5 characters/i)).toBeVisible()
    await expect(page.getByText(/message must be at least 10 characters/i)).toBeVisible()
    await expect(page.getByText(/you must consent to being contacted/i)).toBeVisible()
  })

  test('contact form email validation', async ({ page }) => {
    await page.goto('/en/contact')

    // Fill with invalid email
    await page.getByLabel(/email address/i).fill('invalid-email')
    await page.getByRole('button', { name: /send message/i }).click()

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible()
  })

  test('property inquiry form', async ({ page }) => {
    // Navigate to a property page (assuming it exists)
    await page.goto('/en/portfolio/test-property')

    // Look for property inquiry form or button
    const inquiryButton = page.getByRole('button', { name: /inquire about this property/i }).first()
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click()
    }

    // Fill out property inquiry form
    await page.getByLabel(/full name/i).fill('Jane Smith')
    await page.getByLabel(/email address/i).fill('jane@example.com')
    await page.getByLabel(/phone number/i).fill('+1987654321')
    
    // Select inquiry type
    await page.getByLabel(/type of inquiry/i).click()
    await page.getByText(/schedule a viewing/i).click()
    
    // Select preferred contact time
    await page.getByLabel(/preferred contact time/i).click()
    await page.getByText(/morning/i).click()
    
    await page.getByLabel(/additional details/i).fill('I am interested in scheduling a viewing for this property next week.')
    await page.getByLabel(/i consent to being contacted/i).check()

    await page.getByRole('button', { name: /send inquiry/i }).click()

    // Wait for success message
    await expect(page.getByText(/inquiry sent!/i)).toBeVisible()
  })

  test('service inquiry form', async ({ page }) => {
    await page.goto('/en/services')

    // Look for service inquiry form or button
    const serviceButton = page.getByRole('button', { name: /get quote/i }).first()
    if (await serviceButton.isVisible()) {
      await serviceButton.click()
    }

    // Fill out service inquiry form
    await page.getByLabel(/full name/i).fill('Bob Johnson')
    await page.getByLabel(/email address/i).fill('bob@example.com')
    
    // Select service type
    await page.getByLabel(/service type/i).click()
    await page.getByText(/property management/i).click()
    
    // Select property type
    await page.getByLabel(/property type/i).click()
    await page.getByText(/apartment/i).click()
    
    await page.getByLabel(/number of properties/i).fill('2')
    await page.getByLabel(/property location/i).fill('Downtown Area')
    
    // Select current situation
    await page.getByLabel(/current situation/i).click()
    await page.getByText(/new property owner/i).click()
    
    // Select timeline
    await page.getByLabel(/timeline/i).click()
    await page.getByText(/within 1 month/i).click()
    
    await page.getByLabel(/describe your needs/i).fill('I recently purchased two apartments and need professional management services.')
    await page.getByLabel(/i consent to being contacted/i).check()

    await page.getByRole('button', { name: /send service inquiry/i }).click()

    // Wait for success message
    await expect(page.getByText(/service inquiry sent!/i)).toBeVisible()
  })

  test('callback request form', async ({ page }) => {
    await page.goto('/en/contact')

    // Look for callback request form or button
    const callbackButton = page.getByRole('button', { name: /request callback/i }).first()
    if (await callbackButton.isVisible()) {
      await callbackButton.click()
    }

    // Fill out callback form
    await page.getByLabel(/full name/i).fill('Alice Brown')
    await page.getByLabel(/phone number/i).fill('+1555123456')
    
    // Select preferred time
    await page.getByLabel(/preferred call time/i).click()
    await page.getByText(/afternoon/i).click()
    
    // Select topic
    await page.getByLabel(/topic/i).click()
    await page.getByText(/general inquiry/i).click()
    
    await page.getByLabel(/i consent to being called/i).check()

    await page.getByRole('button', { name: /request callback/i }).click()

    // Wait for success message
    await expect(page.getByText(/callback requested!/i)).toBeVisible()
  })

  test('form accessibility', async ({ page }) => {
    await page.goto('/en/contact')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/full name/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email address/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/phone number/i)).toBeFocused()

    // Test form labels are properly associated
    const nameInput = page.getByLabel(/full name/i)
    await expect(nameInput).toHaveAttribute('aria-required', 'true')
    
    const emailInput = page.getByLabel(/email address/i)
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('form error handling', async ({ page }) => {
    // Mock API error
    await page.route('**/api/contact', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Server error occurred'
        })
      })
    })

    await page.goto('/en/contact')

    // Fill out form
    await page.getByLabel(/full name/i).fill('John Doe')
    await page.getByLabel(/email address/i).fill('john@example.com')
    await page.getByLabel(/subject/i).fill('Test error handling')
    await page.getByLabel(/message/i).fill('Testing error handling in the contact form')
    await page.getByLabel(/i consent to being contacted/i).check()

    await page.getByRole('button', { name: /send message/i }).click()

    // Should show error message
    await expect(page.getByText(/server error occurred/i)).toBeVisible()
  })

  test('form submission loading state', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/contact', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Form submitted successfully'
        })
      })
    })

    await page.goto('/en/contact')

    // Fill out form
    await page.getByLabel(/full name/i).fill('John Doe')
    await page.getByLabel(/email address/i).fill('john@example.com')
    await page.getByLabel(/subject/i).fill('Test loading state')
    await page.getByLabel(/message/i).fill('Testing loading state in the contact form')
    await page.getByLabel(/i consent to being contacted/i).check()

    const submitButton = page.getByRole('button', { name: /send message/i })
    await submitButton.click()

    // Should show loading state
    await expect(page.getByText(/sending.../i)).toBeVisible()
    await expect(submitButton).toBeDisabled()

    // Wait for completion
    await expect(page.getByText(/message sent!/i)).toBeVisible({ timeout: 5000 })
  })
})