import { DataFilterService, FilterConfig } from '@/lib/services/data-filter';
import { Task, TaskWithLoft, Loft, Notification, Transaction, UserRole } from '@/lib/types';

describe('DataFilterService', () => {
  const mockUserId = 'user-123';
  const mockAssignedLoftIds = ['loft-1', 'loft-2'];

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      status: 'todo',
      user_id: 'user-123',
      assigned_to: 'user-123',
      created_at: '2024-01-01',
      loft_id: 'loft-1'
    },
    {
      id: '2',
      title: 'Task 2',
      status: 'in_progress',
      user_id: 'other-user',
      assigned_to: 'other-user',
      created_at: '2024-01-02',
      loft_id: 'loft-2'
    },
    {
      id: '3',
      title: 'Task 3',
      status: 'completed',
      user_id: 'user-123',
      assigned_to: 'other-user',
      created_at: '2024-01-03',
      loft_id: 'loft-3'
    }
  ];

  const mockLofts: Loft[] = [
    {
      id: 'loft-1',
      name: 'Loft 1',
      address: '123 Main St',
      status: 'available',
      price_per_month: 1000,
      owner_id: 'owner-1',
      company_percentage: 70,
      owner_percentage: 30,
      water_customer_code: 'WATER123',
      electricity_customer_number: 'ELEC456'
    },
    {
      id: 'loft-2',
      name: 'Loft 2',
      address: '456 Oak Ave',
      status: 'occupied',
      price_per_month: 1200,
      owner_id: 'owner-2',
      company_percentage: 60,
      owner_percentage: 40
    }
  ] as Loft[];

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'task_assigned',
      user_id: 'user-123',
      is_read: false,
      created_at: '2024-01-01'
    },
    {
      id: '2',
      type: 'financial_report',
      user_id: 'user-123',
      is_read: false,
      created_at: '2024-01-02'
    },
    {
      id: '3',
      type: 'task_completed',
      user_id: 'other-user',
      is_read: true,
      created_at: '2024-01-03'
    }
  ] as Notification[];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      amount: 1000,
      transaction_type: 'income',
      status: 'completed',
      date: '2024-01-01',
      loft_id: 'loft-1'
    },
    {
      id: '2',
      amount: 500,
      transaction_type: 'expense',
      status: 'pending',
      date: '2024-01-02',
      loft_id: 'loft-2'
    }
  ] as Transaction[];

  describe('filterTasks', () => {
    it('should allow admin full access to all tasks', () => {
      const config: FilterConfig = { userRole: 'admin', userId: mockUserId };
      const result = DataFilterService.filterTasks(mockTasks, config);

      expect(result.data).toHaveLength(3);
      expect(result.filteredCount).toBe(0);
      expect(result.hasSecurityFiltering).toBe(false);
    });

    it('should allow manager full access to all tasks', () => {
      const config: FilterConfig = { userRole: 'manager', userId: mockUserId };
      const result = DataFilterService.filterTasks(mockTasks, config);

      expect(result.data).toHaveLength(3);
      expect(result.filteredCount).toBe(0);
      expect(result.hasSecurityFiltering).toBe(false);
    });

    it('should deny executive access to tasks', () => {
      const config: FilterConfig = { userRole: 'executive', userId: mockUserId };
      const result = DataFilterService.filterTasks(mockTasks, config);

      expect(result.data).toHaveLength(0);
      expect(result.filteredCount).toBe(3);
      expect(result.hasSecurityFiltering).toBe(true);
    });

    it('should filter tasks for member to only assigned/created tasks', () => {
      const config: FilterConfig = { userRole: 'member', userId: mockUserId };
      const result = DataFilterService.filterTasks(mockTasks, config);

      expect(result.data).toHaveLength(2); // Tasks 1 and 3
      expect(result.filteredCount).toBe(1);
      expect(result.hasSecurityFiltering).toBe(true);
      
      const taskIds = result.data.map(task => task.id);
      expect(taskIds).toContain('1'); // assigned to user
      expect(taskIds).toContain('3'); // created by user
      expect(taskIds).not.toContain('2'); // neither assigned nor created
    });

    it('should deny guest access to tasks', () => {
      const config: FilterConfig = { userRole: 'guest', userId: mockUserId };
      const result = DataFilterService.filterTasks(mockTasks, config);

      expect(result.data).toHaveLength(0);
      expect(result.filteredCount).toBe(3);
      expect(result.hasSecurityFiltering).toBe(true);
    });
  });

  describe('filterNotifications', () => {
    it('should allow admin and manager full access to notifications', () => {
      const adminConfig: FilterConfig = { userRole: 'admin', userId: mockUserId };
      const managerConfig: FilterConfig = { userRole: 'manager', userId: mockUserId };
      
      const adminResult = DataFilterService.filterNotifications(mockNotifications, adminConfig);
      const managerResult = DataFilterService.filterNotifications(mockNotifications, managerConfig);

      expect(adminResult.data).toHaveLength(3);
      expect(managerResult.data).toHaveLength(3);
      expect(adminResult.hasSecurityFiltering).toBe(false);
      expect(managerResult.hasSecurityFiltering).toBe(false);
    });

    it('should filter notifications for executive to only own notifications', () => {
      const config: FilterConfig = { userRole: 'executive', userId: mockUserId };
      const result = DataFilterService.filterNotifications(mockNotifications, config);

      expect(result.data).toHaveLength(2); // Only notifications for user-123
      expect(result.filteredCount).toBe(1);
      expect(result.hasSecurityFiltering).toBe(true);
    });

    it('should filter notifications for member to only own task-related notifications', () => {
      const config: FilterConfig = { userRole: 'member', userId: mockUserId };
      const result = DataFilterService.filterNotifications(mockNotifications, config);

      expect(result.data).toHaveLength(1); // Only task_assigned notification for user-123
      expect(result.filteredCount).toBe(2);
      expect(result.hasSecurityFiltering).toBe(true);
      
      const notification = result.data[0];
      expect(notification.type).toBe('task_assigned');
      expect(notification.user_id).toBe(mockUserId);
    });
  });

  describe('filterLofts', () => {
    it('should allow admin, manager, and executive full access to lofts', () => {
      const roles: UserRole[] = ['admin', 'manager', 'executive'];
      
      roles.forEach(role => {
        const config: FilterConfig = { userRole: role, userId: mockUserId };
        const result = DataFilterService.filterLofts(mockLofts, config);

        expect(result.data).toHaveLength(2);
        expect(result.filteredCount).toBe(0);
        expect(result.hasSecurityFiltering).toBe(false);
      });
    });

    it('should filter lofts for member to only assigned lofts', () => {
      const config: FilterConfig = { 
        userRole: 'member', 
        userId: mockUserId, 
        assignedLoftIds: ['loft-1'] 
      };
      const result = DataFilterService.filterLofts(mockLofts, config);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('loft-1');
      expect(result.filteredCount).toBe(1);
      expect(result.hasSecurityFiltering).toBe(true);
    });

    it('should deny guest access to lofts', () => {
      const config: FilterConfig = { userRole: 'guest', userId: mockUserId };
      const result = DataFilterService.filterLofts(mockLofts, config);

      expect(result.data).toHaveLength(0);
      expect(result.filteredCount).toBe(2);
      expect(result.hasSecurityFiltering).toBe(true);
    });
  });

  describe('filterFinancialData', () => {
    const mockFinancialData = [
      { id: '1', revenue: 5000, expenses: 3000 },
      { id: '2', revenue: 4000, expenses: 2500 }
    ];

    it('should allow admin, manager, and executive access to financial data', () => {
      const roles: UserRole[] = ['admin', 'manager', 'executive'];
      
      roles.forEach(role => {
        const config: FilterConfig = { userRole: role, userId: mockUserId };
        const result = DataFilterService.filterFinancialData(mockFinancialData, config);

        expect(result.data).toHaveLength(2);
        expect(result.filteredCount).toBe(0);
        expect(result.hasSecurityFiltering).toBe(false);
      });
    });

    it('should deny member and guest access to financial data', () => {
      const roles: UserRole[] = ['member', 'guest'];
      
      roles.forEach(role => {
        const config: FilterConfig = { userRole: role, userId: mockUserId };
        const result = DataFilterService.filterFinancialData(mockFinancialData, config);

        expect(result.data).toHaveLength(0);
        expect(result.filteredCount).toBe(2);
        expect(result.hasSecurityFiltering).toBe(true);
      });
    });
  });

  describe('filterTransactions', () => {
    it('should allow admin, manager, and executive access to transactions', () => {
      const roles: UserRole[] = ['admin', 'manager', 'executive'];
      
      roles.forEach(role => {
        const config: FilterConfig = { userRole: role, userId: mockUserId };
        const result = DataFilterService.filterTransactions(mockTransactions, config);

        expect(result.data).toHaveLength(2);
        expect(result.filteredCount).toBe(0);
        expect(result.hasSecurityFiltering).toBe(false);
      });
    });

    it('should deny member and guest access to transactions', () => {
      const roles: UserRole[] = ['member', 'guest'];
      
      roles.forEach(role => {
        const config: FilterConfig = { userRole: role, userId: mockUserId };
        const result = DataFilterService.filterTransactions(mockTransactions, config);

        expect(result.data).toHaveLength(0);
        expect(result.filteredCount).toBe(2);
        expect(result.hasSecurityFiltering).toBe(true);
      });
    });
  });

  describe('sanitizeLoftForMember', () => {
    it('should remove financial and sensitive fields from loft data', () => {
      const loft = mockLofts[0];
      const sanitized = DataFilterService.sanitizeLoftForMember(loft);

      // Should keep operational fields
      expect(sanitized.id).toBe(loft.id);
      expect(sanitized.name).toBe(loft.name);
      expect(sanitized.address).toBe(loft.address);
      expect(sanitized.status).toBe(loft.status);

      // Should remove financial fields
      expect(sanitized).not.toHaveProperty('price_per_month');
      expect(sanitized).not.toHaveProperty('company_percentage');
      expect(sanitized).not.toHaveProperty('owner_percentage');
      expect(sanitized).not.toHaveProperty('owner_id');

      // Should remove sensitive fields
      expect(sanitized).not.toHaveProperty('water_customer_code');
      expect(sanitized).not.toHaveProperty('electricity_customer_number');
    });
  });

  describe('getAssignedLoftIds', () => {
    it('should return unique loft IDs from user tasks', async () => {
      const loftIds = await DataFilterService.getAssignedLoftIds(mockUserId, mockTasks);
      
      expect(loftIds).toHaveLength(2);
      expect(loftIds).toContain('loft-1'); // from assigned task
      expect(loftIds).toContain('loft-3'); // from created task
      expect(loftIds).not.toContain('loft-2'); // not assigned or created
    });

    it('should handle tasks without loft_id', async () => {
      const tasksWithoutLoft = [
        { ...mockTasks[0], loft_id: null },
        { ...mockTasks[1], loft_id: undefined }
      ];
      
      const loftIds = await DataFilterService.getAssignedLoftIds(mockUserId, tasksWithoutLoft);
      expect(loftIds).toHaveLength(0);
    });
  });

  describe('filterDashboardData', () => {
    it('should filter all data types for member role', () => {
      const config: FilterConfig = { 
        userRole: 'member', 
        userId: mockUserId,
        assignedLoftIds: ['loft-1']
      };
      
      const dashboardData = {
        tasks: mockTasks,
        lofts: mockLofts,
        notifications: mockNotifications,
        transactions: mockTransactions
      };

      const result = DataFilterService.filterDashboardData(dashboardData, config);

      expect(result.tasks?.data).toHaveLength(2); // Only assigned/created tasks
      expect(result.lofts?.data).toHaveLength(1); // Only assigned lofts
      expect(result.notifications?.data).toHaveLength(1); // Only task-related notifications
      expect(result.transactions?.data).toHaveLength(0); // No financial access

      // Check that loft data is sanitized
      const loft = result.lofts?.data[0];
      expect(loft).not.toHaveProperty('price_per_month');
    });

    it('should not sanitize loft data for non-member roles', () => {
      const config: FilterConfig = { userRole: 'admin', userId: mockUserId };
      
      const dashboardData = { lofts: mockLofts };
      const result = DataFilterService.filterDashboardData(dashboardData, config);

      const loft = result.lofts?.data[0];
      expect(loft).toHaveProperty('price_per_month');
    });
  });

  describe('canAccessData', () => {
    it('should correctly check data access permissions', () => {
      expect(DataFilterService.canAccessData('admin', 'financial')).toBe(true);
      expect(DataFilterService.canAccessData('member', 'financial')).toBe(false);
      expect(DataFilterService.canAccessData('member', 'tasks', 'read')).toBe(true);
    });
  });

  describe('getSecurityAuditLog', () => {
    it('should generate security audit log', () => {
      const results = [
        { data: [], filteredCount: 2, totalCount: 5, hasSecurityFiltering: true },
        { data: [], filteredCount: 0, totalCount: 3, hasSecurityFiltering: false }
      ];

      const auditLog = DataFilterService.getSecurityAuditLog(results, 'member', mockUserId);

      expect(auditLog.userRole).toBe('member');
      expect(auditLog.userId).toBe(mockUserId);
      expect(auditLog.totalItemsFiltered).toBe(2);
      expect(auditLog.hasSecurityFiltering).toBe(true);
      expect(auditLog.filterResults).toHaveLength(2);
    });
  });
});