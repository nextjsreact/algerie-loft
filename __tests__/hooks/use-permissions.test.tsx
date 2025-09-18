import { renderHook } from '@testing-library/react';
import { usePermissions, DataFilters, withRoleBasedFiltering } from '@/hooks/use-permissions';
import { UserRole } from '@/lib/types';

describe('usePermissions hook', () => {
  describe('basic permission checking', () => {
    it('should return correct permission methods for admin role', () => {
      const { result } = renderHook(() => usePermissions('admin'));
      
      expect(result.current.hasPermission('dashboard', 'read')).toBe(true);
      expect(result.current.hasPermission('financial', 'write')).toBe(true);
      expect(result.current.canAccess('financial-dashboard')).toBe(true);
      expect(result.current.canAccessResource('tasks')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasAnyRole(['admin', 'manager'])).toBe(true);
    });

    it('should return correct permission methods for member role', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      expect(result.current.hasPermission('tasks', 'read', 'own')).toBe(true);
      expect(result.current.hasPermission('financial', 'read')).toBe(false);
      expect(result.current.canAccess('financial-dashboard')).toBe(false);
      expect(result.current.canAccessResource('tasks')).toBe(true);
      expect(result.current.hasRole('member')).toBe(true);
      expect(result.current.hasAnyRole(['admin', 'manager'])).toBe(false);
    });

    it('should return correct allowed scopes', () => {
      const { result: adminResult } = renderHook(() => usePermissions('admin'));
      const { result: memberResult } = renderHook(() => usePermissions('member'));
      
      expect(adminResult.current.getAllowedScopes('tasks')).toContain('all');
      expect(memberResult.current.getAllowedScopes('tasks')).toContain('own');
      expect(memberResult.current.getAllowedScopes('lofts')).toContain('assigned');
    });
  });

  describe('filterData method', () => {
    it('should filter data correctly using custom filter function', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      const testData = [
        { id: '1', name: 'Item 1', isPublic: true },
        { id: '2', name: 'Item 2', isPublic: false },
        { id: '3', name: 'Item 3', isPublic: true }
      ];

      const filteredData = result.current.filterData(
        testData,
        (item, userRole) => userRole === 'admin' || item.isPublic
      );

      expect(filteredData).toHaveLength(2);
      expect(filteredData.every(item => item.isPublic)).toBe(true);
    });

    it('should handle empty or invalid data gracefully', () => {
      const { result } = renderHook(() => usePermissions('member'));
      
      expect(result.current.filterData([], () => true)).toEqual([]);
      expect(result.current.filterData(null as any, () => true)).toEqual([]);
      expect(result.current.filterData(undefined as any, () => true)).toEqual([]);
    });
  });

  describe('memoization', () => {
    it('should memoize permission methods based on user role', () => {
      const { result, rerender } = renderHook(
        ({ role }) => usePermissions(role),
        { initialProps: { role: 'member' as UserRole } }
      );

      const firstRender = result.current;
      
      // Rerender with same role
      rerender({ role: 'member' });
      expect(result.current).toBe(firstRender);

      // Rerender with different role
      rerender({ role: 'admin' });
      expect(result.current).not.toBe(firstRender);
    });
  });
});

describe('DataFilters', () => {
  const mockUserId = 'user-123';
  const mockAssignedLoftIds = ['loft-1', 'loft-2'];

  describe('tasks filter', () => {
    const mockTasks = [
      { id: '1', assigned_to: 'user-123', user_id: 'other-user' },
      { id: '2', assigned_to: 'other-user', user_id: 'user-123' },
      { id: '3', assigned_to: 'other-user', user_id: 'other-user' },
      { id: '4', assigned_to: 'user-123', user_id: 'user-123' }
    ];

    it('should allow admin and manager to see all tasks', () => {
      mockTasks.forEach(task => {
        expect(DataFilters.tasks(task, 'admin', mockUserId)).toBe(true);
        expect(DataFilters.tasks(task, 'manager', mockUserId)).toBe(true);
      });
    });

    it('should filter tasks for member role to only assigned tasks', () => {
      const results = mockTasks.map(task => DataFilters.tasks(task, 'member', mockUserId));
      expect(results).toEqual([true, true, false, true]);
    });

    it('should deny executive access to tasks', () => {
      mockTasks.forEach(task => {
        expect(DataFilters.tasks(task, 'executive', mockUserId)).toBe(false);
      });
    });

    it('should deny guest access to tasks', () => {
      mockTasks.forEach(task => {
        expect(DataFilters.tasks(task, 'guest', mockUserId)).toBe(false);
      });
    });
  });

  describe('notifications filter', () => {
    const mockNotifications = [
      { id: '1', user_id: 'user-123' },
      { id: '2', user_id: 'other-user' },
      { id: '3', user_id: 'user-123' }
    ];

    it('should allow admin and manager to see all notifications', () => {
      mockNotifications.forEach(notification => {
        expect(DataFilters.notifications(notification, 'admin', mockUserId)).toBe(true);
        expect(DataFilters.notifications(notification, 'manager', mockUserId)).toBe(true);
      });
    });

    it('should filter notifications for executive and member to only own notifications', () => {
      const results = mockNotifications.map(notification => 
        DataFilters.notifications(notification, 'member', mockUserId)
      );
      expect(results).toEqual([true, false, true]);

      const executiveResults = mockNotifications.map(notification => 
        DataFilters.notifications(notification, 'executive', mockUserId)
      );
      expect(executiveResults).toEqual([true, false, true]);
    });
  });

  describe('lofts filter', () => {
    const mockLofts = [
      { id: 'loft-1', name: 'Loft 1' },
      { id: 'loft-2', name: 'Loft 2' },
      { id: 'loft-3', name: 'Loft 3' }
    ];

    it('should allow admin, manager, and executive to see all lofts', () => {
      mockLofts.forEach(loft => {
        expect(DataFilters.lofts(loft, 'admin', mockUserId, mockAssignedLoftIds)).toBe(true);
        expect(DataFilters.lofts(loft, 'manager', mockUserId, mockAssignedLoftIds)).toBe(true);
        expect(DataFilters.lofts(loft, 'executive', mockUserId, mockAssignedLoftIds)).toBe(true);
      });
    });

    it('should filter lofts for member to only assigned lofts', () => {
      const results = mockLofts.map(loft => 
        DataFilters.lofts(loft, 'member', mockUserId, mockAssignedLoftIds)
      );
      expect(results).toEqual([true, true, false]);
    });

    it('should handle missing assignedLoftIds for member', () => {
      const results = mockLofts.map(loft => 
        DataFilters.lofts(loft, 'member', mockUserId, undefined)
      );
      expect(results).toEqual([false, false, false]);
    });
  });

  describe('financialData filter', () => {
    const mockFinancialData = { revenue: 1000, expenses: 500 };

    it('should allow admin, manager, and executive to see financial data', () => {
      expect(DataFilters.financialData(mockFinancialData, 'admin')).toBe(true);
      expect(DataFilters.financialData(mockFinancialData, 'manager')).toBe(true);
      expect(DataFilters.financialData(mockFinancialData, 'executive')).toBe(true);
    });

    it('should deny member and guest access to financial data', () => {
      expect(DataFilters.financialData(mockFinancialData, 'member')).toBe(false);
      expect(DataFilters.financialData(mockFinancialData, 'guest')).toBe(false);
    });
  });
});

describe('withRoleBasedFiltering', () => {
  const mockTasks = [
    { id: '1', assigned_to: 'user-123' },
    { id: '2', assigned_to: 'other-user' }
  ];

  it('should apply correct filter based on filter type', () => {
    const filtered = withRoleBasedFiltering(
      mockTasks,
      'member',
      'tasks',
      { userId: 'user-123' }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should return original data for unknown filter type', () => {
    const filtered = withRoleBasedFiltering(
      mockTasks,
      'member',
      'unknown' as any
    );

    expect(filtered).toEqual(mockTasks);
  });

  it('should handle empty data', () => {
    const filtered = withRoleBasedFiltering(
      [],
      'member',
      'tasks'
    );

    expect(filtered).toEqual([]);
  });
});