/**
 * End-to-End Tests for Multi-Role Booking System
 * 
 * Tests complete user journeys across different roles
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testData = {
  client: {
    email: 'e2e-client@example.com',
    password: 'TestPassword123!',
    fullName: 'E2E Test Client'
  },
  partner: {
    email: 'e2e-partner@example.com',
    password: 'TestPassword123!',
    fullName: 'E2E Test Partner',
    businessName: 'Test Property Management'
  },
  loft: {
    name: 'E2E Test Loft',
    address: '123 E2E Test Street, Test City',
    description: 'A beautiful test loft for end-to-end testing',
    pricePerNight: 150,
    amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning']
  },
  booking: {
    checkIn: '2024-12-15',
    checkOut: '2024-12-17',
    guests: 2
  }
};

test.describe('Multi-Role Booking System E2E', () => {
  test.describe.configure({ mode: 'serial' });

  let clientPage: Page;
  let partnerPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts for different user roles
    const clientContext = await browser.newContext();
    const partnerContext = await browser.newContext();
    
    clientPage = await clientContext.newPage();
    partnerPage = await partnerContext.newPage();
  });

  test('Complete booking flow: Partner registration → Property listing → Client booking → Partner confirmation', async () => {
    // Step 1: Partner Registration
    await test.step('Partner registers and creates account', async () => {
      await partnerPage.goto('/register');
      
      // Select partner role
      await partnerPage.click('[data-testid="role-partner"]');
      
      // Fill registration form
      await partnerPage.fill('[data-testid="email"]', testData.partner.email);
      await partnerPage.fill('[data-testid="password"]', testData.partner.password);
      await partnerPage.fill('[data-testid="full-name"]', testData.partner.fullName);
      await partnerPage.fill('[data-testid="business-name"]', testData.partner.businessName);
      await partnerPage.selectOption('[data-testid="business-type"]', 'company');
      await partnerPage.fill('[data-testid="phone"]', '+1234567890');
      await partnerPage.fill('[data-testid="address"]', '456 Partner Street, Business City');
      
      await partnerPage.click('[data-testid="register-submit"]');
      
      // Should show pending verification message
      await expect(partnerPage.locator('[data-testid="verification-pending"]')).toBeVisible();
    });

    // Step 2: Admin approves partner (simulate)
    await test.step('Admin approves partner account', async () => {
      // In a real test, this would involve admin login and approval
      // For E2E testing, we'll simulate this by directly updating the database
      // or using a test endpoint
      await partnerPage.goto('/api/test/approve-partner', {
        method: 'POST',
        data: { email: testData.partner.email }
      });
    });

    // Step 3: Partner logs in and creates property listing
    await test.step('Partner creates property listing', async () => {
      await partnerPage.goto('/login');
      await partnerPage.fill('[data-testid="email"]', testData.partner.email);
      await partnerPage.fill('[data-testid="password"]', testData.partner.password);
      await partnerPage.click('[data-testid="login-submit"]');
      
      // Should redirect to partner dashboard
      await expect(partnerPage).toHaveURL(/\/partner\/dashboard/);
      
      // Navigate to add property
      await partnerPage.click('[data-testid="add-property"]');
      
      // Fill property details
      await partnerPage.fill('[data-testid="property-name"]', testData.loft.name);
      await partnerPage.fill('[data-testid="property-address"]', testData.loft.address);
      await partnerPage.fill('[data-testid="property-description"]', testData.loft.description);
      await partnerPage.fill('[data-testid="price-per-night"]', testData.loft.pricePerNight.toString());
      
      // Select amenities
      for (const amenity of testData.loft.amenities) {
        await partnerPage.check(`[data-testid="amenity-${amenity}"]`);
      }
      
      // Upload test image (if file upload is implemented)
      // await partnerPage.setInputFiles('[data-testid="property-images"]', 'tests/fixtures/test-loft.jpg');
      
      await partnerPage.click('[data-testid="create-property"]');
      
      // Should show success message and redirect to properties list
      await expect(partnerPage.locator('[data-testid="property-created"]')).toBeVisible();
      await expect(partnerPage.locator(`text=${testData.loft.name}`)).toBeVisible();
    });

    // Step 4: Client registration and search
    await test.step('Client registers and searches for properties', async () => {
      await clientPage.goto('/register');
      
      // Select client role
      await clientPage.click('[data-testid="role-client"]');
      
      // Fill registration form
      await clientPage.fill('[data-testid="email"]', testData.client.email);
      await clientPage.fill('[data-testid="password"]', testData.client.password);
      await clientPage.fill('[data-testid="full-name"]', testData.client.fullName);
      
      await clientPage.click('[data-testid="register-submit"]');
      
      // Should redirect to client dashboard or search
      await expect(clientPage).toHaveURL(/\/client/);
    });

    // Step 5: Client searches and finds the property
    await test.step('Client searches for available properties', async () => {
      await clientPage.goto('/client/search');
      
      // Fill search criteria
      await clientPage.fill('[data-testid="check-in"]', testData.booking.checkIn);
      await clientPage.fill('[data-testid="check-out"]', testData.booking.checkOut);
      await clientPage.fill('[data-testid="guests"]', testData.booking.guests.toString());
      await clientPage.fill('[data-testid="location"]', 'Test City');
      
      await clientPage.click('[data-testid="search-submit"]');
      
      // Should show search results including our test property
      await expect(clientPage.locator(`text=${testData.loft.name}`)).toBeVisible();
      await expect(clientPage.locator(`text=$${testData.loft.pricePerNight}`)).toBeVisible();
    });

    // Step 6: Client books the property
    await test.step('Client creates booking', async () => {
      // Click on the property to view details
      await clientPage.click(`[data-testid="loft-card-${testData.loft.name}"]`);
      
      // Should show property details
      await expect(clientPage.locator(`text=${testData.loft.description}`)).toBeVisible();
      
      // Verify dates and guests are pre-filled
      await expect(clientPage.locator('[data-testid="booking-check-in"]')).toHaveValue(testData.booking.checkIn);
      await expect(clientPage.locator('[data-testid="booking-check-out"]')).toHaveValue(testData.booking.checkOut);
      await expect(clientPage.locator('[data-testid="booking-guests"]')).toHaveValue(testData.booking.guests.toString());
      
      // Calculate expected total (2 nights * $150)
      const expectedTotal = 2 * testData.loft.pricePerNight;
      await expect(clientPage.locator('[data-testid="total-price"]')).toContainText(`$${expectedTotal}`);
      
      // Proceed to booking
      await clientPage.click('[data-testid="book-now"]');
      
      // Fill payment details (mock payment)
      await clientPage.fill('[data-testid="card-number"]', '4242424242424242');
      await clientPage.fill('[data-testid="card-expiry"]', '12/25');
      await clientPage.fill('[data-testid="card-cvc"]', '123');
      await clientPage.fill('[data-testid="cardholder-name"]', testData.client.fullName);
      
      await clientPage.click('[data-testid="confirm-payment"]');
      
      // Should show booking confirmation
      await expect(clientPage.locator('[data-testid="booking-confirmed"]')).toBeVisible();
      await expect(clientPage.locator('[data-testid="booking-id"]')).toBeVisible();
    });

    // Step 7: Partner receives and confirms booking
    await test.step('Partner receives booking notification and confirms', async () => {
      await partnerPage.goto('/partner/bookings');
      
      // Should see new booking in pending status
      await expect(partnerPage.locator('[data-testid="booking-status-pending"]')).toBeVisible();
      await expect(partnerPage.locator(`text=${testData.client.fullName}`)).toBeVisible();
      await expect(partnerPage.locator(`text=${testData.booking.checkIn}`)).toBeVisible();
      
      // Click to view booking details
      await partnerPage.click('[data-testid="view-booking-details"]');
      
      // Confirm the booking
      await partnerPage.click('[data-testid="confirm-booking"]');
      
      // Should show confirmation success
      await expect(partnerPage.locator('[data-testid="booking-confirmed"]')).toBeVisible();
      await expect(partnerPage.locator('[data-testid="booking-status-confirmed"]')).toBeVisible();
    });

    // Step 8: Client receives confirmation
    await test.step('Client sees booking confirmation', async () => {
      await clientPage.goto('/client/reservations');
      
      // Should see confirmed booking
      await expect(clientPage.locator('[data-testid="booking-status-confirmed"]')).toBeVisible();
      await expect(clientPage.locator(`text=${testData.loft.name}`)).toBeVisible();
      await expect(clientPage.locator(`text=${testData.booking.checkIn}`)).toBeVisible();
    });
  });

  test('Client-Partner messaging system', async () => {
    await test.step('Client sends message to partner', async () => {
      await clientPage.goto('/client/reservations');
      
      // Click on booking to view details
      await clientPage.click('[data-testid="booking-details"]');
      
      // Open messaging
      await clientPage.click('[data-testid="contact-partner"]');
      
      // Send message
      const testMessage = 'Hi, I have a question about check-in procedures.';
      await clientPage.fill('[data-testid="message-input"]', testMessage);
      await clientPage.click('[data-testid="send-message"]');
      
      // Should show message in conversation
      await expect(clientPage.locator(`text=${testMessage}`)).toBeVisible();
    });

    await test.step('Partner receives and responds to message', async () => {
      await partnerPage.goto('/partner/bookings');
      
      // Should see message notification
      await expect(partnerPage.locator('[data-testid="new-message-indicator"]')).toBeVisible();
      
      // Click to view messages
      await partnerPage.click('[data-testid="view-messages"]');
      
      // Should see client's message
      await expect(partnerPage.locator('text=Hi, I have a question about check-in procedures.')).toBeVisible();
      
      // Reply to message
      const replyMessage = 'Check-in is at 3 PM. I\'ll send you the access code closer to your arrival date.';
      await partnerPage.fill('[data-testid="message-input"]', replyMessage);
      await partnerPage.click('[data-testid="send-message"]');
      
      // Should show reply in conversation
      await expect(partnerPage.locator(`text=${replyMessage}`)).toBeVisible();
    });

    await test.step('Client receives partner reply', async () => {
      await clientPage.reload();
      
      // Should see partner's reply
      await expect(clientPage.locator('text=Check-in is at 3 PM')).toBeVisible();
    });
  });

  test('Booking modification and cancellation', async () => {
    await test.step('Client attempts to modify booking dates', async () => {
      await clientPage.goto('/client/reservations');
      await clientPage.click('[data-testid="modify-booking"]');
      
      // Try to change dates
      await clientPage.fill('[data-testid="new-check-in"]', '2024-12-16');
      await clientPage.fill('[data-testid="new-check-out"]', '2024-12-18');
      
      await clientPage.click('[data-testid="check-availability"]');
      
      // Should show availability and price difference
      await expect(clientPage.locator('[data-testid="modification-available"]')).toBeVisible();
      
      await clientPage.click('[data-testid="confirm-modification"]');
      
      // Should show modification success
      await expect(clientPage.locator('[data-testid="booking-modified"]')).toBeVisible();
    });

    await test.step('Client cancels booking', async () => {
      await clientPage.click('[data-testid="cancel-booking"]');
      
      // Should show cancellation policy
      await expect(clientPage.locator('[data-testid="cancellation-policy"]')).toBeVisible();
      
      // Confirm cancellation
      await clientPage.fill('[data-testid="cancellation-reason"]', 'Change of plans');
      await clientPage.click('[data-testid="confirm-cancellation"]');
      
      // Should show cancellation confirmation
      await expect(clientPage.locator('[data-testid="booking-cancelled"]')).toBeVisible();
    });

    await test.step('Partner sees cancellation notification', async () => {
      await partnerPage.goto('/partner/bookings');
      
      // Should see cancelled booking
      await expect(partnerPage.locator('[data-testid="booking-status-cancelled"]')).toBeVisible();
      await expect(partnerPage.locator('[data-testid="cancellation-notification"]')).toBeVisible();
    });
  });

  test('Mobile responsiveness', async () => {
    await test.step('Test mobile client interface', async () => {
      await clientPage.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await clientPage.goto('/client/search');
      
      // Mobile search should be accessible
      await expect(clientPage.locator('[data-testid="mobile-search-form"]')).toBeVisible();
      
      // Test mobile booking flow
      await clientPage.fill('[data-testid="check-in"]', '2024-12-20');
      await clientPage.fill('[data-testid="check-out"]', '2024-12-22');
      await clientPage.click('[data-testid="search-submit"]');
      
      // Results should be mobile-optimized
      await expect(clientPage.locator('[data-testid="mobile-loft-card"]')).toBeVisible();
    });

    await test.step('Test mobile partner interface', async () => {
      await partnerPage.setViewportSize({ width: 375, height: 667 });
      
      await partnerPage.goto('/partner/dashboard');
      
      // Mobile dashboard should be accessible
      await expect(partnerPage.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
      
      // Test mobile property management
      await partnerPage.click('[data-testid="mobile-menu"]');
      await partnerPage.click('[data-testid="properties-link"]');
      
      await expect(partnerPage.locator('[data-testid="mobile-property-list"]')).toBeVisible();
    });
  });

  test.afterAll(async () => {
    // Cleanup test data
    await clientPage.close();
    await partnerPage.close();
  });
});