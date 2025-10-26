/**
 * Multi-Role Booking System Integration Tests
 * 
 * Tests complete booking flow from client search to partner confirmation
 * Validates cross-role interactions and data consistency
 * Tests concurrent usage scenarios with multiple user types
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Mock Next.js request/response for API testing
const mockRequest = (method: string, url: string, body?: any) => {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Test database client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Multi-Role Booking System Integration', () => {
  let testClientUser: any;
  let testPartnerUser: any;
  let testLoft: any;
  let testBooking: any;

  beforeAll(async () => {
    // Create test users for different roles
    const { data: clientUser } = await supabase.auth.admin.createUser({
      email: 'test-client@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Client',
        role: 'client'
      }
    });
    testClientUser = clientUser.user;

    const { data: partnerUser } = await supabase.auth.admin.createUser({
      email: 'test-partner@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Partner',
        role: 'partner'
      }
    });
    testPartnerUser = partnerUser.user;

    // Create test loft for partner
    const { data: loft } = await supabase
      .from('lofts')
      .insert({
        name: 'Test Integration Loft',
        address: '123 Test Street, Test City',
        description: 'A test loft for integration testing',
        price_per_night: 100,
        owner_id: testPartnerUser.id,
        is_published: true,
        amenities: ['wifi', 'kitchen', 'parking']
      })
      .select()
      .single();
    testLoft = loft;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBooking) {
      await supabase.from('bookings').delete().eq('id', testBooking.id);
    }
    if (testLoft) {
      await supabase.from('lofts').delete().eq('id', testLoft.id);
    }
    if (testClientUser) {
      await supabase.auth.admin.deleteUser(testClientUser.id);
    }
    if (testPartnerUser) {
      await supabase.auth.admin.deleteUser(testPartnerUser.id);
    }
  });

  describe('Complete Booking Flow', () => {
    it('should complete full booking flow from client search to partner confirmation', async () => {
      // Step 1: Client searches for available lofts
      const searchResponse = await fetch('/api/lofts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in: '2024-12-01',
          check_out: '2024-12-03',
          guests: 2,
          location: 'Test City'
        })
      });
      
      expect(searchResponse.ok).toBe(true);
      const searchResults = await searchResponse.json();
      expect(searchResults.lofts).toContainEqual(
        expect.objectContaining({
          id: testLoft.id,
          name: testLoft.name
        })
      );

      // Step 2: Client creates booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testClientUser.access_token}`
        },
        body: JSON.stringify({
          loft_id: testLoft.id,
          check_in: '2024-12-01',
          check_out: '2024-12-03',
          guests: 2,
          total_price: 200
        })
      });

      expect(bookingResponse.ok).toBe(true);
      testBooking = await bookingResponse.json();
      expect(testBooking).toMatchObject({
        loft_id: testLoft.id,
        client_id: testClientUser.id,
        partner_id: testPartnerUser.id,
        status: 'pending'
      });

      // Step 3: Partner receives notification and can view booking
      const partnerBookingsResponse = await fetch(`/api/partner/bookings`, {
        headers: {
          'Authorization': `Bearer ${testPartnerUser.access_token}`
        }
      });

      expect(partnerBookingsResponse.ok).toBe(true);
      const partnerBookings = await partnerBookingsResponse.json();
      expect(partnerBookings.bookings).toContainEqual(
        expect.objectContaining({
          id: testBooking.id,
          status: 'pending'
        })
      );

      // Step 4: Partner confirms booking
      const confirmResponse = await fetch(`/api/bookings/${testBooking.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testPartnerUser.access_token}`
        }
      });

      expect(confirmResponse.ok).toBe(true);
      const confirmedBooking = await confirmResponse.json();
      expect(confirmedBooking.status).toBe('confirmed');
    });

    it('should handle booking conflicts and prevent double bookings', async () => {
      // Create first booking
      const { data: firstBooking } = await supabase
        .from('bookings')
        .insert({
          loft_id: testLoft.id,
          client_id: testClientUser.id,
          partner_id: testPartnerUser.id,
          check_in: '2024-12-10',
          check_out: '2024-12-12',
          guests: 2,
          total_price: 200,
          status: 'confirmed'
        })
        .select()
        .single();

      // Attempt to create conflicting booking
      const conflictResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testClientUser.access_token}`
        },
        body: JSON.stringify({
          loft_id: testLoft.id,
          check_in: '2024-12-11',
          check_out: '2024-12-13',
          guests: 2,
          total_price: 200
        })
      });

      expect(conflictResponse.status).toBe(409);
      const error = await conflictResponse.json();
      expect(error.code).toBe('BOOKING_CONFLICT');

      // Cleanup
      await supabase.from('bookings').delete().eq('id', firstBooking.id);
    });
  });

  describe('Cross-Role Data Consistency', () => {
    it('should maintain data consistency across client and partner views', async () => {
      // Create booking through client
      const { data: booking } = await supabase
        .from('bookings')
        .insert({
          loft_id: testLoft.id,
          client_id: testClientUser.id,
          partner_id: testPartnerUser.id,
          check_in: '2024-12-15',
          check_out: '2024-12-17',
          guests: 2,
          total_price: 200,
          status: 'confirmed'
        })
        .select()
        .single();

      // Verify client can see their booking
      const clientBookingsResponse = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${testClientUser.access_token}`
        }
      });
      const clientBookings = await clientBookingsResponse.json();
      expect(clientBookings.bookings).toContainEqual(
        expect.objectContaining({
          id: booking.id,
          loft_id: testLoft.id
        })
      );

      // Verify partner can see the same booking
      const partnerBookingsResponse = await fetch('/api/partner/bookings', {
        headers: {
          'Authorization': `Bearer ${testPartnerUser.access_token}`
        }
      });
      const partnerBookings = await partnerBookingsResponse.json();
      expect(partnerBookings.bookings).toContainEqual(
        expect.objectContaining({
          id: booking.id,
          loft_id: testLoft.id
        })
      );

      // Verify both views show consistent data
      const clientBooking = clientBookings.bookings.find((b: any) => b.id === booking.id);
      const partnerBooking = partnerBookings.bookings.find((b: any) => b.id === booking.id);
      
      expect(clientBooking.total_price).toBe(partnerBooking.total_price);
      expect(clientBooking.status).toBe(partnerBooking.status);
      expect(clientBooking.check_in).toBe(partnerBooking.check_in);
      expect(clientBooking.check_out).toBe(partnerBooking.check_out);

      // Cleanup
      await supabase.from('bookings').delete().eq('id', booking.id);
    });

    it('should enforce role-based access control', async () => {
      // Client should not access partner-only endpoints
      const partnerEarningsResponse = await fetch('/api/partner/earnings', {
        headers: {
          'Authorization': `Bearer ${testClientUser.access_token}`
        }
      });
      expect(partnerEarningsResponse.status).toBe(403);

      // Partner should not access other partners' data
      const otherPartnerPropertiesResponse = await fetch(`/api/partner/properties?partner_id=other-partner`, {
        headers: {
          'Authorization': `Bearer ${testPartnerUser.access_token}`
        }
      });
      expect(otherPartnerPropertiesResponse.status).toBe(403);
    });
  });

  describe('Concurrent Usage Scenarios', () => {
    it('should handle multiple simultaneous searches', async () => {
      const searchPromises = Array.from({ length: 5 }, () =>
        fetch('/api/lofts/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_in: '2024-12-20',
            check_out: '2024-12-22',
            guests: 2
          })
        })
      );

      const responses = await Promise.all(searchPromises);
      
      // All searches should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // All should return consistent results
      const results = await Promise.all(responses.map(r => r.json()));
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.lofts.length).toBe(firstResult.lofts.length);
      });
    });

    it('should handle concurrent booking attempts gracefully', async () => {
      // Create multiple concurrent booking attempts for the same dates
      const bookingPromises = Array.from({ length: 3 }, () =>
        fetch('/api/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testClientUser.access_token}`
          },
          body: JSON.stringify({
            loft_id: testLoft.id,
            check_in: '2024-12-25',
            check_out: '2024-12-27',
            guests: 2,
            total_price: 200
          })
        })
      );

      const responses = await Promise.all(bookingPromises);
      
      // Only one should succeed, others should fail with conflict
      const successfulResponses = responses.filter(r => r.ok);
      const conflictResponses = responses.filter(r => r.status === 409);
      
      expect(successfulResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(2);

      // Cleanup successful booking
      if (successfulResponses.length > 0) {
        const successfulBooking = await successfulResponses[0].json();
        await supabase.from('bookings').delete().eq('id', successfulBooking.id);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle search operations within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch('/api/lofts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in: '2024-12-30',
          check_out: '2025-01-02',
          guests: 4,
          price_range: { min: 50, max: 200 },
          amenities: ['wifi', 'kitchen']
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should maintain performance under load', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fetch('/api/lofts/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_in: '2025-01-05',
            check_out: '2025-01-07',
            guests: 2,
            location: `Test City ${i}`
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Average response time should be reasonable
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(3000); // Average under 3 seconds
    });
  });
});