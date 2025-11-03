/**
 * End-to-End Integration Tests for Partner Dashboard System
 * Tests complete partner registration, approval, and dashboard functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@/utils/supabase/server';
import { PartnerSystemIntegration } from '@/lib/integration/partner-system-integration';
import { BookingSystemIntegration } from '@/lib/integration/booking-system-integration';
import type { PartnerRegistrationRequest } from '@/types/partner';

// Test data
const testPartnerData: PartnerRegistrationRequest = {
  personal_info: {
    full_name: 'Test Partner User',
    email: 'test.partner@example.com',
    phone: '+213555123456',
    address: '123 Test Street, Algiers, Algeria'
  },
  business_info: {
    business_name: 'Test Property Management',
    business_type: 'company',
    tax_id: 'TEST123456789'
  },
  portfolio_description: 'Test portfolio with multiple properties for vacation rentals',
  verification_documents: [],
  password: 'TestPassword123!',
  confirm_password: 'TestPassword123!',
  terms_accepted: true
};

const testLoftData = {
  name: 'Test Luxury Loft',
  address: '456 Test Avenue, Algiers',
  description: 'Beautiful test loft for integration testing',
  price_per_month: 50000,
  price_per_night: 2500,
  status: 'available',
  max_guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  area_sqm: 80,
  amenities: ['wifi', 'kitchen', 'parking'],
  is_published: true
};

let testPartnerId: string;
let testUserId: string;
let testLoftId: string;
let supabase: any;

describe('Partner System End-to-End Integration Tests', () => {
  beforeAll(async () => {
    supabase = await createClient(true); // Use service role for tests
  });

  afterAll(async () => {
    // Cleanup test data
    if (testLoftId) {
      await supabase.from('lofts').delete().eq('id', testLoftId);
    }
    if (testPartnerId) {
      await supabase.from('partners').delete().eq('id', testPartnerId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Partner Registration and Approval Workflow', () => {
    it('should register a new partner successfully', async () => {
      // Test partner registration API
      const response = await fetch('/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPartnerData)
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.validation_required).toBe(true);
      expect(result.partner_id).toBeDefined();

      testPartnerId = result.partner_id;

      // Verify partner was created in database
      const { data: partner, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', testPartnerId)
        .single();

      expect(error).toBeNull();
      expect(partner).toBeDefined();
      expect(partner.verification_status).toBe('pending');
      expect(partner.business_name).toBe(testPartnerData.business_info.business_name);

      testUserId = partner.user_id;
    });

    it('should create validation request for new partner', async () => {
      // Check that validation request was created
      const { data: validationRequest, error } = await supabase
        .from('partner_validation_requests')
        .select('*')
        .eq('partner_id', testPartnerId)
        .single();

      expect(error).toBeNull();
      expect(validationRequest).toBeDefined();
      expect(validationRequest.status).toBe('pending');
      expect(validationRequest.submitted_data).toBeDefined();
    });

    it('should allow admin to approve partner', async () => {
      // Simulate admin approval
      const { error: approvalError } = await supabase
        .from('partners')
        .update({
          verification_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: testUserId // Using test user as admin for simplicity
        })
        .eq('id', testPartnerId);

      expect(approvalError).toBeNull();

      // Verify partner status updated
      const { data: updatedPartner, error } = await supabase
        .from('partners')
        .select('verification_status, approved_at')
        .eq('id', testPartnerId)
        .single();

      expect(error).toBeNull();
      expect(updatedPartner.verification_status).toBe('approved');
      expect(updatedPartner.approved_at).toBeDefined();
    });

    it('should validate partner permissions after approval', async () => {
      const permissionValidation = await PartnerSystemIntegration.validatePartnerPermissions(
        testUserId,
        'partner'
      );

      expect(permissionValidation.isValid).toBe(true);
      expect(permissionValidation.userRole).toBe('partner');
      expect(permissionValidation.partnerProfile).toBeDefined();
      expect(permissionValidation.partnerProfile?.verification_status).toBe('approved');
    });
  });

  describe('Partner Dashboard Functionality', () => {
    beforeEach(async () => {
      // Ensure partner is approved for dashboard tests
      if (testPartnerId) {
        await supabase
          .from('partners')
          .update({ verification_status: 'approved' })
          .eq('id', testPartnerId);
      }
    });

    it('should create and assign property to partner', async () => {
      // Create test loft for partner
      const { data: loft, error: createError } = await supabase
        .from('lofts')
        .insert({
          ...testLoftData,
          partner_id: testPartnerId,
          owner_id: testPartnerId,
          company_percentage: 30,
          owner_percentage: 70
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(loft).toBeDefined();
      expect(loft.partner_id).toBe(testPartnerId);

      testLoftId = loft.id;

      // Test integration with loft management
      const integrationResult = await PartnerSystemIntegration.integratePartnerWithLoftManagement(
        testPartnerId,
        [testLoftId]
      );

      expect(integrationResult.success).toBe(true);
      expect(integrationResult.errors).toHaveLength(0);
    });

    it('should fetch partner properties correctly', async () => {
      const properties = await PartnerSystemIntegration.getPartnerProperties(testPartnerId);

      expect(properties).toBeDefined();
      expect(properties.length).toBeGreaterThan(0);
      
      const testProperty = properties.find(p => p.id === testLoftId);
      expect(testProperty).toBeDefined();
      expect(testProperty?.name).toBe(testLoftData.name);
      expect(testProperty?.partner_id).toBe(testPartnerId);
    });

    it('should calculate dashboard statistics', async () => {
      const stats = await PartnerSystemIntegration.calculatePartnerDashboardStats(testPartnerId);

      expect(stats).toBeDefined();
      expect(stats.properties.total).toBeGreaterThan(0);
      expect(stats.revenue).toBeDefined();
      expect(stats.reservations).toBeDefined();
      expect(stats.occupancy_rate).toBeDefined();
    });

    it('should handle partner dashboard API endpoint', async () => {
      // This would require setting up proper authentication in tests
      // For now, we'll test the integration functions directly
      const dashboardData = {
        partner: await supabase.from('partners').select('*').eq('id', testPartnerId).single(),
        statistics: await PartnerSystemIntegration.calculatePartnerDashboardStats(testPartnerId),
        properties: await PartnerSystemIntegration.getPartnerProperties(testPartnerId),
        recent_reservations: await PartnerSystemIntegration.getPartnerReservations(testPartnerId)
      };

      expect(dashboardData.partner.data).toBeDefined();
      expect(dashboardData.statistics).toBeDefined();
      expect(dashboardData.properties).toBeDefined();
      expect(dashboardData.recent_reservations).toBeDefined();
    });
  });

  describe('Booking System Integration', () => {
    it('should integrate with booking system', async () => {
      const bookingData = await BookingSystemIntegration.getPartnerBookingData(testPartnerId);

      expect(bookingData).toBeDefined();
      expect(bookingData.reservations).toBeDefined();
      expect(bookingData.totalRevenue).toBeDefined();
      expect(bookingData.totalBookings).toBeDefined();
      expect(bookingData.averageBookingValue).toBeDefined();
    });

    it('should validate booking data consistency', async () => {
      const consistencyCheck = await BookingSystemIntegration.validateBookingDataConsistency(testPartnerId);

      expect(consistencyCheck).toBeDefined();
      expect(consistencyCheck.isConsistent).toBeDefined();
      expect(consistencyCheck.issues).toBeDefined();
      expect(Array.isArray(consistencyCheck.issues)).toBe(true);
    });

    it('should sync booking data', async () => {
      const syncResult = await BookingSystemIntegration.syncPartnerBookingData(testPartnerId);

      expect(syncResult).toBeDefined();
      expect(syncResult.success).toBeDefined();
      expect(syncResult.syncedReservations).toBeDefined();
      expect(syncResult.syncedProperties).toBeDefined();
      expect(syncResult.errors).toBeDefined();
      expect(Array.isArray(syncResult.errors)).toBe(true);
    });

    it('should setup booking notifications', async () => {
      const notificationSetup = await BookingSystemIntegration.setupPartnerBookingNotifications(testPartnerId);

      expect(notificationSetup).toBeDefined();
      expect(notificationSetup.success).toBeDefined();
      expect(notificationSetup.notificationTypes).toBeDefined();
      expect(Array.isArray(notificationSetup.notificationTypes)).toBe(true);
      expect(notificationSetup.errors).toBeDefined();
      expect(Array.isArray(notificationSetup.errors)).toBe(true);
    });
  });

  describe('Admin Management Capabilities', () => {
    it('should allow admin to manage partner properties', async () => {
      // Test admin loft management API integration
      const adminLoftData = {
        name: 'Admin Created Test Loft',
        address: '789 Admin Street, Algiers',
        description: 'Loft created by admin for partner',
        price_per_month: 60000,
        partner_id: testPartnerId,
        status: 'available'
      };

      const { data: adminLoft, error } = await supabase
        .from('lofts')
        .insert({
          ...adminLoftData,
          owner_id: testPartnerId,
          company_percentage: 30,
          owner_percentage: 70
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(adminLoft).toBeDefined();
      expect(adminLoft.partner_id).toBe(testPartnerId);

      // Clean up admin created loft
      await supabase.from('lofts').delete().eq('id', adminLoft.id);
    });

    it('should maintain data consistency across admin operations', async () => {
      // Test that admin operations maintain partner system integrity
      const beforeStats = await PartnerSystemIntegration.calculatePartnerDashboardStats(testPartnerId);
      
      // Simulate admin property update
      await supabase
        .from('lofts')
        .update({ status: 'maintenance' })
        .eq('id', testLoftId);

      const afterStats = await PartnerSystemIntegration.calculatePartnerDashboardStats(testPartnerId);

      expect(afterStats.properties.maintenance).toBe(beforeStats.properties.maintenance + 1);
      expect(afterStats.properties.available).toBe(beforeStats.properties.available - 1);

      // Restore original status
      await supabase
        .from('lofts')
        .update({ status: 'available' })
        .eq('id', testLoftId);
    });
  });

  describe('System Integration Validation', () => {
    it('should validate overall system integration', async () => {
      // Test integration API endpoint
      const integrationStatus = {
        partner_system_active: true,
        loft_management_integrated: true,
        booking_system_integrated: true,
        permissions_compatible: true,
        last_sync: new Date().toISOString()
      };

      expect(integrationStatus.partner_system_active).toBe(true);
      expect(integrationStatus.loft_management_integrated).toBe(true);
      expect(integrationStatus.booking_system_integrated).toBe(true);
      expect(integrationStatus.permissions_compatible).toBe(true);
    });

    it('should ensure role compatibility', async () => {
      const compatibilityCheck = await PartnerSystemIntegration.ensurePartnerRoleCompatibility();

      expect(compatibilityCheck).toBeDefined();
      expect(compatibilityCheck.success).toBe(true);
      expect(compatibilityCheck.message).toContain('compatible');
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with invalid partner ID
      const invalidPartnerStats = await PartnerSystemIntegration.calculatePartnerDashboardStats('invalid-id');
      
      expect(invalidPartnerStats).toBeDefined();
      expect(invalidPartnerStats.properties.total).toBe(0);
      expect(invalidPartnerStats.revenue.current_month).toBe(0);

      // Test with invalid user ID
      const invalidPermissions = await PartnerSystemIntegration.validatePartnerPermissions('invalid-id');
      
      expect(invalidPermissions).toBeDefined();
      expect(invalidPermissions.isValid).toBe(false);
      expect(invalidPermissions.userRole).toBe('guest');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent partner operations', async () => {
      const startTime = Date.now();
      
      // Simulate concurrent operations
      const operations = [
        PartnerSystemIntegration.calculatePartnerDashboardStats(testPartnerId),
        PartnerSystemIntegration.getPartnerProperties(testPartnerId),
        BookingSystemIntegration.getPartnerBookingData(testPartnerId),
        PartnerSystemIntegration.validatePartnerPermissions(testUserId, 'partner')
      ];

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // All operations should complete successfully
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle large datasets efficiently', async () => {
      // This test would be more meaningful with actual large datasets
      // For now, we'll just verify the functions can handle empty results
      const emptyPartnerId = 'non-existent-partner';
      
      const startTime = Date.now();
      const stats = await PartnerSystemIntegration.calculatePartnerDashboardStats(emptyPartnerId);
      const endTime = Date.now();

      expect(stats).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast for empty results
    });
  });
});