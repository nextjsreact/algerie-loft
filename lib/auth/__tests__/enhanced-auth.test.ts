/**
 * Tests for enhanced authentication system
 * These tests verify the integration between base auth and superuser auth
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/superuser/auth');
jest.mock('../superuser-session');

describe('Enhanced Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnhancedSession', () => {
    it('should return null when no base session exists', async () => {
      const { getEnhancedSession } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      
      (getSession as jest.Mock).mockResolvedValue(null);
      
      const result = await getEnhancedSession();
      expect(result).toBeNull();
    });

    it('should return enhanced session with superuser info for admin users', async () => {
      const { getEnhancedSession } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      const { getSuperuserProfile } = await import('@/lib/superuser/auth');
      const { validateSuperuserSession } = await import('../superuser-session');
      
      const mockBaseSession = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          full_name: 'Admin User',
          role: 'admin' as const,
          created_at: '2024-01-01',
          updated_at: null
        },
        token: 'mock-token'
      };

      const mockSuperuserProfile = {
        id: 'su-1',
        user_id: 'user-1',
        granted_by: 'system',
        granted_at: new Date(),
        permissions: ['USER_MANAGEMENT', 'BACKUP_MANAGEMENT'],
        is_active: true,
        last_activity: new Date(),
        session_timeout_minutes: 30,
        require_mfa: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      (getSession as jest.Mock).mockResolvedValue(mockBaseSession);
      (getSuperuserProfile as jest.Mock).mockResolvedValue(mockSuperuserProfile);
      (validateSuperuserSession as jest.Mock).mockResolvedValue({ isValid: false });
      
      const result = await getEnhancedSession();
      
      expect(result).toEqual({
        ...mockBaseSession,
        isSuperuser: true,
        superuserProfile: mockSuperuserProfile,
        superuserSession: undefined,
        permissions: ['USER_MANAGEMENT', 'BACKUP_MANAGEMENT']
      });
    });

    it('should return enhanced session without superuser info for non-admin users', async () => {
      const { getEnhancedSession } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      
      const mockBaseSession = {
        user: {
          id: 'user-2',
          email: 'member@test.com',
          full_name: 'Member User',
          role: 'member' as const,
          created_at: '2024-01-01',
          updated_at: null
        },
        token: 'mock-token'
      };

      (getSession as jest.Mock).mockResolvedValue(mockBaseSession);
      
      const result = await getEnhancedSession();
      
      expect(result).toEqual({
        ...mockBaseSession,
        isSuperuser: false,
        superuserProfile: undefined,
        superuserSession: undefined,
        permissions: []
      });
    });
  });

  describe('requireEnhancedAuth', () => {
    it('should throw redirect for unauthenticated users', async () => {
      const { requireEnhancedAuth } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      
      (getSession as jest.Mock).mockResolvedValue(null);
      
      // Mock redirect to prevent actual navigation in tests
      const mockRedirect = jest.fn();
      jest.doMock('next/navigation', () => ({
        redirect: mockRedirect
      }));
      
      await expect(requireEnhancedAuth()).rejects.toThrow();
    });

    it('should return session for authenticated users with correct role', async () => {
      const { requireEnhancedAuth } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          full_name: 'Admin User',
          role: 'admin' as const,
          created_at: '2024-01-01',
          updated_at: null
        },
        token: 'mock-token',
        isSuperuser: false,
        permissions: []
      };

      (getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await requireEnhancedAuth({ allowedRoles: ['admin'] });
      expect(result).toEqual(expect.objectContaining({
        user: mockSession.user
      }));
    });
  });

  describe('canPerformSuperuserAction', () => {
    it('should return false for non-superuser', async () => {
      const { canPerformSuperuserAction } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'member@test.com',
          full_name: 'Member User',
          role: 'member' as const,
          created_at: '2024-01-01',
          updated_at: null
        },
        token: 'mock-token'
      };

      (getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await canPerformSuperuserAction(['USER_MANAGEMENT']);
      expect(result).toBe(false);
    });

    it('should return true for superuser with required permissions', async () => {
      const { canPerformSuperuserAction } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      const { getSuperuserProfile } = await import('@/lib/superuser/auth');
      
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          full_name: 'Admin User',
          role: 'admin' as const,
          created_at: '2024-01-01',
          updated_at: null
        },
        token: 'mock-token'
      };

      const mockSuperuserProfile = {
        id: 'su-1',
        user_id: 'user-1',
        granted_by: 'system',
        granted_at: new Date(),
        permissions: ['USER_MANAGEMENT', 'BACKUP_MANAGEMENT'],
        is_active: true,
        last_activity: new Date(),
        session_timeout_minutes: 30,
        require_mfa: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      (getSession as jest.Mock).mockResolvedValue(mockSession);
      (getSuperuserProfile as jest.Mock).mockResolvedValue(mockSuperuserProfile);
      
      const result = await canPerformSuperuserAction(['USER_MANAGEMENT']);
      expect(result).toBe(true);
    });
  });
});

describe('Superuser Session Management', () => {
  describe('validateSuperuserSession', () => {
    it('should return invalid for missing session token', async () => {
      const { validateSuperuserSession } = await import('../superuser-session');
      
      // Mock cookies to return no session
      jest.doMock('next/headers', () => ({
        cookies: jest.fn().mockResolvedValue({
          get: jest.fn().mockReturnValue(undefined)
        })
      }));
      
      const result = await validateSuperuserSession();
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('not_found');
    });
  });
});

describe('Permission Checking', () => {
  describe('checkPermissionScenarios', () => {
    it('should return false for all scenarios when not superuser', async () => {
      const { checkPermissionScenarios } = await import('../enhanced-auth');
      const { getSession } = await import('@/lib/auth');
      
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'member@test.com',
          full_name: 'Member User',
          role: 'member' as const,
          created_at: '2024-01-01',
          updated_at: null
        },
        token: 'mock-token'
      };

      (getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const scenarios = {
        canManageUsers: ['USER_MANAGEMENT'],
        canManageBackups: ['BACKUP_MANAGEMENT'],
        canViewAudit: ['AUDIT_ACCESS']
      };
      
      const result = await checkPermissionScenarios(scenarios);
      
      expect(result).toEqual({
        canManageUsers: false,
        canManageBackups: false,
        canViewAudit: false
      });
    });
  });
});