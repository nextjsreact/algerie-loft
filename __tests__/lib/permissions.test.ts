import { PermissionValidator, ROLE_PERMISSIONS } from '@/lib/permissions/types';
import { UserRole } from '@/lib/types';

describe('PermissionValidator', () => {
  describe('hasPermission', () => {
    it('should grant admin full access to everything', () => {
      expect(PermissionValidator.hasPermission('admin', 'any-resource', 'any-action')).toBe(true);
      expect(PermissionValidator.hasPermission('admin', 'dashboard', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('admin', 'financial', 'write')).toBe(true);
      expect(PermissionValidator.hasPermission('admin', 'users', 'delete')).toBe(true);
    });

    it('should allow manager access to dashboard and financial data', () => {
      expect(PermissionValidator.hasPermission('manager', 'dashboard', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('manager', 'dashboard-financial', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('manager', 'financial', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('manager', 'tasks', 'write')).toBe(true);
    });

    it('should allow executive access to financial reports but not task management', () => {
      expect(PermissionValidator.hasPermission('executive', 'dashboard-financial', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('executive', 'reports', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('executive', 'financial', 'read')).toBe(true);
      expect(PermissionValidator.hasPermission('executive', 'tasks', 'write')).toBe(false);
    });

    it('should restrict member access to only assigned tasks and basic dashboard', () => {
      expect(PermissionValidator.hasPermission('member', 'dashboard', 'read', 'own')).toBe(true);
      expect(PermissionValidator.hasPermission('member', 'tasks', 'read', 'own')).toBe(true);
      expect(PermissionValidator.hasPermission('member', 'tasks', 'write', 'own')).toBe(true);
      expect(PermissionValidator.hasPermission('member', 'lofts', 'read', 'assigned')).toBe(true);
      
      // Should not have access to financial data
      expect(PermissionValidator.hasPermission('member', 'dashboard-financial', 'read')).toBe(false);
      expect(PermissionValidator.hasPermission('member', 'financial', 'read')).toBe(false);
      expect(PermissionValidator.hasPermission('member', 'tasks', 'read', 'all')).toBe(false);
    });

    it('should deny guest access to most resources', () => {
      expect(PermissionValidator.hasPermission('guest', 'dashboard', 'read')).toBe(false);
      expect(PermissionValidator.hasPermission('guest', 'tasks', 'read')).toBe(false);
      expect(PermissionValidator.hasPermission('guest', 'financial', 'read')).toBe(false);
      expect(PermissionValidator.hasPermission('guest', 'public', 'read')).toBe(true);
    });

    it('should handle invalid roles gracefully', () => {
      expect(PermissionValidator.hasPermission('invalid-role' as UserRole, 'dashboard', 'read')).toBe(false);
    });

    it('should respect scope restrictions', () => {
      // Member should have access to own tasks but not all tasks
      expect(PermissionValidator.hasPermission('member', 'tasks', 'read', 'own')).toBe(true);
      expect(PermissionValidator.hasPermission('member', 'tasks', 'read', 'all')).toBe(false);
      
      // Executive should have access to own notifications
      expect(PermissionValidator.hasPermission('executive', 'notifications', 'read', 'own')).toBe(true);
    });
  });

  describe('canAccessComponent', () => {
    it('should allow appropriate roles to access financial dashboard', () => {
      expect(PermissionValidator.canAccessComponent('admin', 'financial-dashboard')).toBe(true);
      expect(PermissionValidator.canAccessComponent('manager', 'financial-dashboard')).toBe(true);
      expect(PermissionValidator.canAccessComponent('executive', 'financial-dashboard')).toBe(true);
      expect(PermissionValidator.canAccessComponent('member', 'financial-dashboard')).toBe(false);
      expect(PermissionValidator.canAccessComponent('guest', 'financial-dashboard')).toBe(false);
    });

    it('should restrict admin panel access to admin and manager roles', () => {
      expect(PermissionValidator.canAccessComponent('admin', 'admin-panel')).toBe(true);
      expect(PermissionValidator.canAccessComponent('manager', 'admin-panel')).toBe(true);
      expect(PermissionValidator.canAccessComponent('executive', 'admin-panel')).toBe(false);
      expect(PermissionValidator.canAccessComponent('member', 'admin-panel')).toBe(false);
    });

    it('should allow all-tasks access only to admin and manager', () => {
      expect(PermissionValidator.canAccessComponent('admin', 'all-tasks')).toBe(true);
      expect(PermissionValidator.canAccessComponent('manager', 'all-tasks')).toBe(true);
      expect(PermissionValidator.canAccessComponent('executive', 'all-tasks')).toBe(false);
      expect(PermissionValidator.canAccessComponent('member', 'all-tasks')).toBe(false);
    });

    it('should handle unknown components gracefully', () => {
      expect(PermissionValidator.canAccessComponent('admin', 'unknown-component')).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return correct permissions for each role', () => {
      const adminPermissions = PermissionValidator.getRolePermissions('admin');
      expect(adminPermissions).toHaveLength(1);
      expect(adminPermissions[0]).toEqual({ resource: '*', action: '*', scope: 'all' });

      const memberPermissions = PermissionValidator.getRolePermissions('member');
      expect(memberPermissions.length).toBeGreaterThan(0);
      expect(memberPermissions.some(p => p.resource === 'tasks' && p.scope === 'own')).toBe(true);
    });

    it('should return empty array for invalid roles', () => {
      expect(PermissionValidator.getRolePermissions('invalid-role' as UserRole)).toEqual([]);
    });
  });

  describe('canAccessResource', () => {
    it('should correctly identify resource access', () => {
      expect(PermissionValidator.canAccessResource('admin', 'any-resource')).toBe(true);
      expect(PermissionValidator.canAccessResource('member', 'tasks')).toBe(true);
      expect(PermissionValidator.canAccessResource('member', 'financial')).toBe(false);
      expect(PermissionValidator.canAccessResource('guest', 'public')).toBe(true);
      expect(PermissionValidator.canAccessResource('guest', 'tasks')).toBe(false);
    });
  });

  describe('getAllowedScope', () => {
    it('should return correct scopes for different roles and resources', () => {
      expect(PermissionValidator.getAllowedScope('admin', 'tasks')).toContain('all');
      expect(PermissionValidator.getAllowedScope('member', 'tasks')).toContain('own');
      expect(PermissionValidator.getAllowedScope('member', 'lofts')).toContain('assigned');
      expect(PermissionValidator.getAllowedScope('guest', 'tasks')).toEqual([]);
    });

    it('should handle resources not accessible to role', () => {
      expect(PermissionValidator.getAllowedScope('member', 'financial')).toEqual([]);
    });
  });

  describe('ROLE_PERMISSIONS configuration', () => {
    it('should have permissions defined for all user roles', () => {
      const expectedRoles: UserRole[] = ['admin', 'manager', 'executive', 'member', 'guest'];
      
      expectedRoles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should have valid permission structure', () => {
      Object.values(ROLE_PERMISSIONS).forEach(permissions => {
        permissions.forEach(permission => {
          expect(permission).toHaveProperty('resource');
          expect(permission).toHaveProperty('action');
          expect(typeof permission.resource).toBe('string');
          expect(['read', 'write', 'delete', 'create', '*']).toContain(permission.action);
          
          if (permission.scope) {
            expect(['own', 'team', 'all', 'assigned']).toContain(permission.scope);
          }
        });
      });
    });

    it('should ensure admin has wildcard permissions', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;
      expect(adminPermissions.some(p => p.resource === '*' && p.action === '*')).toBe(true);
    });

    it('should ensure member has restricted permissions', () => {
      const memberPermissions = ROLE_PERMISSIONS.member;
      
      // Should not have any 'all' scope permissions except for public resources
      const allScopePermissions = memberPermissions.filter(p => p.scope === 'all');
      expect(allScopePermissions.length).toBe(0);
      
      // Should not have access to financial resources
      const financialPermissions = memberPermissions.filter(p => 
        p.resource.includes('financial') || p.resource === 'transactions' || p.resource === 'reports'
      );
      expect(financialPermissions.length).toBe(0);
    });
  });
});