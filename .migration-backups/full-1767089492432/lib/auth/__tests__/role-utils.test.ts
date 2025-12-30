import { describe, it, expect } from '@jest/globals';
import { 
  canAccessRoute, 
  getRoleRedirectUrl, 
  hasRoleHierarchy,
  getNavigationItems,
  getRoleDisplayName
} from '../role-utils';
import { UserRole } from '@/lib/types';

describe('Role Utils', () => {
  describe('canAccessRoute', () => {
    it('should allow clients to access client routes', () => {
      expect(canAccessRoute('/client/dashboard', 'client')).toBe(true);
      expect(canAccessRoute('/client/search', 'client')).toBe(true);
      expect(canAccessRoute('/client/reservations', 'client')).toBe(true);
    });

    it('should allow partners to access partner routes', () => {
      expect(canAccessRoute('/partner/dashboard', 'partner')).toBe(true);
      expect(canAccessRoute('/partner/properties', 'partner')).toBe(true);
      expect(canAccessRoute('/partner/bookings', 'partner')).toBe(true);
    });

    it('should allow admins to access all routes', () => {
      expect(canAccessRoute('/app/dashboard', 'admin')).toBe(true);
      expect(canAccessRoute('/app/admin', 'admin')).toBe(true);
      expect(canAccessRoute('/app/reports', 'admin')).toBe(true);
    });

    it('should deny access to unauthorized routes', () => {
      expect(canAccessRoute('/partner/dashboard', 'client')).toBe(false);
      expect(canAccessRoute('/client/dashboard', 'partner')).toBe(false);
      expect(canAccessRoute('/app/admin', 'member')).toBe(false);
    });

    it('should allow access to shared routes', () => {
      expect(canAccessRoute('/notifications', 'client')).toBe(true);
      expect(canAccessRoute('/notifications', 'partner')).toBe(true);
      expect(canAccessRoute('/profile', 'member')).toBe(true);
    });

    it('should handle routes with locale prefixes', () => {
      expect(canAccessRoute('/fr/client/dashboard', 'client')).toBe(true);
      expect(canAccessRoute('/en/partner/properties', 'partner')).toBe(true);
    });
  });

  describe('getRoleRedirectUrl', () => {
    it('should return correct redirect URLs for each role', () => {
      expect(getRoleRedirectUrl('client')).toBe('/fr/client/dashboard');
      expect(getRoleRedirectUrl('partner')).toBe('/fr/partner/dashboard');
      expect(getRoleRedirectUrl('admin')).toBe('/fr/app/dashboard');
      expect(getRoleRedirectUrl('member')).toBe('/fr/app/dashboard');
    });

    it('should handle different locales', () => {
      expect(getRoleRedirectUrl('client', 'en')).toBe('/en/client/dashboard');
      expect(getRoleRedirectUrl('partner', 'ar')).toBe('/ar/partner/dashboard');
    });
  });

  describe('hasRoleHierarchy', () => {
    it('should correctly compare role hierarchies', () => {
      expect(hasRoleHierarchy('admin', 'member')).toBe(true);
      expect(hasRoleHierarchy('manager', 'executive')).toBe(true);
      expect(hasRoleHierarchy('member', 'admin')).toBe(false);
      expect(hasRoleHierarchy('client', 'partner')).toBe(false);
    });

    it('should handle equal roles', () => {
      expect(hasRoleHierarchy('admin', 'admin')).toBe(true);
      expect(hasRoleHierarchy('client', 'client')).toBe(true);
    });
  });

  describe('getNavigationItems', () => {
    it('should return client-specific navigation', () => {
      const clientNav = getNavigationItems('client');
      expect(clientNav).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Dashboard', href: '/client/dashboard' }),
          expect.objectContaining({ label: 'Search Lofts', href: '/client/search' }),
          expect.objectContaining({ label: 'My Reservations', href: '/client/reservations' })
        ])
      );
    });

    it('should return partner-specific navigation', () => {
      const partnerNav = getNavigationItems('partner');
      expect(partnerNav).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Dashboard', href: '/partner/dashboard' }),
          expect.objectContaining({ label: 'My Properties', href: '/partner/properties' }),
          expect.objectContaining({ label: 'Bookings', href: '/partner/bookings' })
        ])
      );
    });

    it('should return admin-specific navigation', () => {
      const adminNav = getNavigationItems('admin');
      expect(adminNav).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Dashboard', href: '/app/dashboard' }),
          expect.objectContaining({ label: 'Admin', href: '/app/admin' }),
          expect.objectContaining({ label: 'Reports', href: '/app/reports' })
        ])
      );
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRoleDisplayName('client')).toBe('Client');
      expect(getRoleDisplayName('partner')).toBe('Partner');
      expect(getRoleDisplayName('admin')).toBe('Administrator');
      expect(getRoleDisplayName('member')).toBe('Team Member');
    });
  });
});