import { renderHook } from '@testing-library/react';
import { usePermissions, DataFilters, withRoleBasedFiltering } from '@/hooks/use-permissions';
import { UserRole } from '@/lib/types';

describe('usePermissions - Comprehensive Edge Cases', () => {
  describe('edge case scenarios', () => {
    it('should handle undefined userRole gracefully', () => {
      const { result } = renderHook(() => usePermissions(undefined as any));
      
      expect(result.current.hasPermission('dashboard', 'read')).toBe(false);
      expect(result.current.canAccess('financial-dashboard')).toBe(false);
      expect(result.current.canAccessResource('tasks')).toBe(false);
    });

    it('should handle null userRole gracefully', () => {
      const { result } = renderHook(() => usePermissions(null as any));
      
      expect(result.current.hasPermission('dashboard', 'read')).toBe(false);
      expect(result.current.canAccess('financial-dashboard')).toBe(false);
      expect(result.current.canAccessResource('tasks')).toBe(false);
    });

    it('should handle empty string userRole gracefully', () => {
      const { result } = renderHook(() => usePermissions('' as UserRole));
      
      expect(result.current.hasPermission('dashboard', 'read')).toBe(false);
      expect(result.current.canAccess('financial-dashboard')).toBe(false);
      expect(result.current.canAccessResource('tasks')).toBe(false);
    });

    it('should handle invalid userRole gracefully', () => {
      const { result } = renderHook(() => usePermissions('invalid-role' as UserRole));
      
      expect(result.current.hasPermission('dashboard', 'read')).toBe(false);
      expect(result.current.canAccess('financial-dashboard')).toBe(false);
      expect(result.current.canAccessResource('tasks')).toBe(false);
    });

    it('should handle special characters in resource names', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      expect(result.current.hasPermission('resource-with-dashes', 'read')).toBe(true);
      expect(result.current.hasPermission('resource_with_underscores', 'read')).toBe(true);
      expect(result.current.hasPermission('resource.with.dots', 'read')).toBe(true);
    });

    it('should handle case sensitivity in permissions', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      // Should be case sensitive
      expect(result.current.hasPermission('Tasks', 'read', 'own')).toBe(false);
      expect(result.current.hasPermission('tasks', 'Read', 'own')).toBe(false);
      expect(result.current.hasPermission('tasks', 'read', 'Own')).toBe(false);
    });
  });

  describe('permission boundary testing', () => {
    it('should test exact permission boundaries for member role', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      // Should have access to own tasks
      expect(result.current.hasPermission('tasks', 'read', 'own')).toBe(true);
      expect(result.current.hasPermission('tasks', 'write', 'own')).toBe(true);
      
      // Should NOT have access to all tasks
      expect(result.current.hasPermission('tasks', 'read', 'all')).toBe(false);
      expect(result.current.hasPermission('tasks', 'write', 'all')).toBe(false);
      
      // Should NOT have delete permissions
      expect(result.current.hasPermission('tasks', 'delete', 'own')).toBe(false);
      
      // Should have access to assigned lofts
      expect(result.current.hasPermission('lofts', 'read', 'assigned')).toBe(true);
      
      // Should NOT have access to all lofts
      expect(result.current.hasPermission('lofts', 'read', 'all')).toBe(false);
      
      // Should NOT have any financial access
      expect(result.current.hasPermission('financial', 'read')).toBe(false);
      expect(result.current.hasPermission('transactions', 'read')).toBe(false);
      expect(result.current.hasPermission('reports', 'read')).toBe(false);
    });

    it('should test executive role boundaries', () => {
      const { result } = renderHook(() => usePermissions('executive'));
      
      // Should have financial access
      expect(result.current.hasPermission('financial', 'read')).toBe(true);
      expect(result.current.hasPermission('reports', 'read')).toBe(true);
      expect(result.current.hasPermission('dashboard-financial', 'read')).toBe(true);
      
      // Should NOT have task management access
      expect(result.current.hasPermission('tasks', 'write')).toBe(false);
      expect(result.current.hasPermission('tasks', 'create')).toBe(false);
      expect(result.current.hasPermission('tasks', 'delete')).toBe(false);
      
      // Should have limited notification access
      expect(result.current.hasPermission('notifications', 'read', 'own')).toBe(true);
      expect(result.current.hasPermission('notifications', 'read', 'all')).toBe(false);
    });

    it('should test manager role comprehensive permissions', () => {
      const { result } = renderHook(() => usePermissions('manager'));
      
      // Should have full task management
      expect(result.current.hasPermission('tasks', 'read', 'all')).toBe(true);
      expect(result.current.hasPermission('tasks', 'write', 'all')).toBe(true);
      expect(result.current.hasPermission('tasks', 'create', 'all')).toBe(true);
      expect(result.current.hasPermission('tasks', 'delete', 'all')).toBe(true);
      
      // Should have financial access
      expect(result.current.hasPermission('financial', 'read')).toBe(true);
      expect(result.current.hasPermission('transactions', 'read')).toBe(true);
      
      // Should have user management with team scope
      expect(result.current.hasPermission('users', 'read', 'all')).toBe(true);
      expect(result.current.hasPermission('users', 'write', 'team')).toBe(true);
      
      // Should NOT have full user management
      expect(result.current.hasPermission('users', 'write', 'all')).toBe(false);
    });
  });

  describe('scope validation edge cases', () => {
    it('should handle undefined scope parameter', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      // When scope is undefined, should check if permission exists without scope restriction
      expect(result.current.hasPermission('tasks', 'read', undefined)).toBe(true);
      expect(result.current.hasPermission('financial', 'read', undefined)).toBe(false);
    });

    it('should handle empty string scope', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      expect(result.current.hasPermission('tasks', 'read', '')).toBe(true);
      expect(result.current.hasPermission('financial', 'read', '')).toBe(false);
    });

    it('should handle invalid scope values', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      expect(result.current.hasPermission('tasks', 'read', 'invalid-scope')).toBe(false);
      expect(result.current.hasPermission('tasks', 'read', 'global')).toBe(false);
    });
  });

  describe('getAllowedScopes edge cases', () => {
    it('should return empty array for non-existent resources', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      expect(result.current.getAllowedScopes('non-existent-resource')).toEqual([]);
    });

    it('should return unique scopes only', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      const scopes = result.current.getAllowedScopes('tasks');
      const uniqueScopes = [...new Set(scopes)];
      expect(scopes).toEqual(uniqueScopes);
    });

    it('should handle resources with multiple scope permissions', () => {
      const { result } = renderHook(() => usePermissions('manager'));
      
      const userScopes = result.current.getAllowedScopes('users');
      expect(userScopes).toContain('all'); // read access
      expect(userScopes).toContain('team'); // write access
    });
  });

  describe('hasAnyRole edge cases', () => {
    it('should handle empty roles array', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      expect(result.current.hasAnyRole([])).toBe(false);
    });

    it('should handle undefined roles array', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      expect(() => result.current.hasAnyRole(undefined as any)).toThrow();
    });

    it('should handle null roles array', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      expect(() => result.current.hasAnyRole(null as any)).toThrow();
    });

    it('should handle roles array with invalid values', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      expect(result.current.hasAnyRole(['invalid-role'] as UserRole[])).toBe(false);
      expect(result.current.hasAnyRole([null, undefined, ''] as any)).toBe(false);
    });
  });

  describe('performance and memory tests', () => {
    it('should not create new functions on every render with same role', () => {
      const { result, rerender } = renderHook(
        ({ role }) => usePermissions(role),
        { initialProps: { role: 'member' as UserRole } }
      );

      const firstRender = {
        hasPermission: result.current.hasPermission,
        canAccess: result.current.canAccess,
        filterData: result.current.filterData
      };
      
      // Rerender with same role
      rerender({ role: 'member' });
      
      expect(result.current.hasPermission).toBe(firstRender.hasPermission);
      expect(result.current.canAccess).toBe(firstRender.canAccess);
      expect(result.current.filterData).toBe(firstRender.filterData);
    });

    it('should handle large data arrays efficiently', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      // Create large test dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        isPublic: i % 2 === 0
      }));

      const startTime = performance.now();
      const filtered = result.current.filterData(
        largeDataset,
        (item) => item.isPublic
      );
      const endTime = performance.now();

      expect(filtered.length).toBe(5000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('concurrent access scenarios', () => {
    it('should handle multiple simultaneous permission checks', () => {
      const { result } = renderHook(() => usePermissions('manager'));
      
      const permissions = [
        ['tasks', 'read'],
        ['financial', 'read'],
        ['users', 'write'],
        ['dashboard', 'read'],
        ['lofts', 'read']
      ];

      const results = permissions.map(([resource, action]) =>
        result.current.hasPermission(resource, action)
      );

      expect(results).toEqual([true, true, true, true, true]);
    });

    it('should maintain consistency across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => usePermissions('member'));
      const { result: result2 } = renderHook(() => usePermissions('member'));
      
      expect(result1.current.hasPermission('tasks', 'read', 'own'))
        .toBe(result2.current.hasPermission('tasks', 'read', 'own'));
      
      expect(result1.current.canAccess('financial-dashboard'))
        .toBe(result2.current.canAccess('financial-dashboard'));
    });
  });
});

describe('DataFilters - Security Edge Cases', () => {
  const mockUserId = 'user-123';
  const mockOtherUserId = 'user-456';

  describe('data injection prevention', () => {
    it('should prevent SQL injection-like patterns in user IDs', () => {
      const maliciousUserId = "'; DROP TABLE users; --";
      const mockTasks = [
        { id: '1', assigned_to: maliciousUserId, user_id: 'normal-user' },
        { id: '2', assigned_to: 'normal-user', user_id: maliciousUserId }
      ];

      const results = mockTasks.map(task => 
        DataFilters.tasks(task, 'member', maliciousUserId)
      );

      expect(results).toEqual([true, true]);
    });

    it('should handle XSS-like patterns in data', () => {
      const xssPayload = '<script>alert("xss")</script>';
      const mockNotifications = [
        { id: '1', user_id: xssPayload, content: 'Normal content' },
        { id: '2', user_id: mockUserId, content: xssPayload }
      ];

      const results = mockNotifications.map(notification => 
        DataFilters.notifications(notification, 'member', xssPayload)
      );

      expect(results).toEqual([true, false]);
    });
  });

  describe('data boundary testing', () => {
    it('should handle extremely large datasets', () => {
      const largeTasks = Array.from({ length: 100000 }, (_, i) => ({
        id: i.toString(),
        assigned_to: i % 2 === 0 ? mockUserId : mockOtherUserId,
        user_id: i % 3 === 0 ? mockUserId : mockOtherUserId
      }));

      const startTime = performance.now();
      const filtered = largeTasks.filter(task => 
        DataFilters.tasks(task, 'member', mockUserId)
      );
      const endTime = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle deeply nested objects', () => {
      const deeplyNestedTask = {
        id: '1',
        assigned_to: mockUserId,
        user_id: mockUserId,
        metadata: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: 'deep value'
                }
              }
            }
          }
        }
      };

      expect(DataFilters.tasks(deeplyNestedTask, 'member', mockUserId)).toBe(true);
    });

    it('should handle circular references safely', () => {
      const circularTask: any = {
        id: '1',
        assigned_to: mockUserId,
        user_id: mockUserId
      };
      circularTask.self = circularTask;

      expect(() => DataFilters.tasks(circularTask, 'member', mockUserId)).not.toThrow();
      expect(DataFilters.tasks(circularTask, 'member', mockUserId)).toBe(true);
    });
  });

  describe('type safety edge cases', () => {
    it('should handle missing required properties gracefully', () => {
      const incompleteTasks = [
        { id: '1' }, // missing assigned_to and user_id
        { id: '2', assigned_to: mockUserId }, // missing user_id
        { id: '3', user_id: mockUserId }, // missing assigned_to
        { id: '4', assigned_to: null, user_id: null }
      ];

      const results = incompleteTasks.map(task => 
        DataFilters.tasks(task as any, 'member', mockUserId)
      );

      expect(results).toEqual([false, true, true, false]);
    });

    it('should handle different data types for IDs', () => {
      const mixedIdTasks = [
        { id: '1', assigned_to: 123, user_id: mockUserId }, // number ID
        { id: '2', assigned_to: mockUserId, user_id: 456 }, // number ID
        { id: '3', assigned_to: true, user_id: mockUserId }, // boolean ID
        { id: '4', assigned_to: mockUserId, user_id: false } // boolean ID
      ];

      const results = mixedIdTasks.map(task => 
        DataFilters.tasks(task as any, 'member', mockUserId)
      );

      expect(results).toEqual([true, true, true, true]);
    });
  });

  describe('concurrent filtering scenarios', () => {
    it('should handle simultaneous filtering operations', async () => {
      const mockData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        assigned_to: i % 2 === 0 ? mockUserId : mockOtherUserId,
        user_id: i % 3 === 0 ? mockUserId : mockOtherUserId
      }));

      const filterPromises = Array.from({ length: 10 }, () =>
        Promise.resolve(mockData.filter(task => 
          DataFilters.tasks(task, 'member', mockUserId)
        ))
      );

      const results = await Promise.all(filterPromises);
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
    });
  });
});

describe('withRoleBasedFiltering - Edge Cases', () => {
  const mockData = [
    { id: '1', assigned_to: 'user-123' },
    { id: '2', assigned_to: 'user-456' }
  ];

  describe('parameter validation', () => {
    it('should handle undefined data gracefully', () => {
      expect(() => {
        withRoleBasedFiltering(
          undefined as any,
          'member',
          'tasks',
          { userId: 'user-123' }
        );
      }).toThrow();
    });

    it('should handle null data gracefully', () => {
      expect(() => {
        withRoleBasedFiltering(
          null as any,
          'member',
          'tasks',
          { userId: 'user-123' }
        );
      }).toThrow();
    });

    it('should handle non-array data gracefully', () => {
      expect(() => {
        withRoleBasedFiltering(
          'not-an-array' as any,
          'member',
          'tasks',
          { userId: 'user-123' }
        );
      }).toThrow();
    });

    it('should handle missing additionalParams', () => {
      const result = withRoleBasedFiltering(
        mockData,
        'member',
        'tasks'
      );

      expect(result).toEqual(mockData); // Should return original data when filter fails
    });

    it('should handle undefined additionalParams properties', () => {
      const result = withRoleBasedFiltering(
        mockData,
        'member',
        'tasks',
        { userId: undefined }
      );

      // Should return original data when filter fails due to undefined userId
      expect(result).toEqual(mockData);
    });
  });

  describe('filter type validation', () => {
    it('should handle case-sensitive filter types', () => {
      const result = withRoleBasedFiltering(
        mockData,
        'member',
        'Tasks' as any, // Wrong case
        { userId: 'user-123' }
      );

      expect(result).toEqual(mockData); // Should return original data for unknown filter
    });

    it('should handle special characters in filter type', () => {
      const result = withRoleBasedFiltering(
        mockData,
        'member',
        'tasks-special' as any,
        { userId: 'user-123' }
      );

      expect(result).toEqual(mockData);
    });
  });
});