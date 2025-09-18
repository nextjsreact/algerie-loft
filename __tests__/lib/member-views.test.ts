import { 
  MemberDataGuards, 
  MemberDataTransformers,
  MemberLoftView,
  MemberTaskView,
  MemberNotificationView,
  MemberDashboardData
} from '@/lib/types/member-views';
import { Task, Loft, Notification } from '@/lib/types';

describe('MemberDataGuards', () => {
  describe('isMemberLoftView', () => {
    it('should validate properly sanitized loft view', () => {
      const validLoftView: MemberLoftView = {
        id: 'loft-1',
        name: 'Test Loft',
        address: '123 Main St',
        status: 'available',
        hasActiveTasks: true,
        assignedTasksCount: 2
      };

      expect(MemberDataGuards.isMemberLoftView(validLoftView)).toBe(true);
    });

    it('should reject loft view with financial data', () => {
      const loftWithFinancialData = {
        id: 'loft-1',
        name: 'Test Loft',
        address: '123 Main St',
        status: 'available',
        price_per_month: 1000, // Financial field - should be rejected
        company_percentage: 70
      };

      expect(MemberDataGuards.isMemberLoftView(loftWithFinancialData)).toBe(false);
    });

    it('should reject loft view with sensitive utility data', () => {
      const loftWithSensitiveData = {
        id: 'loft-1',
        name: 'Test Loft',
        address: '123 Main St',
        status: 'available',
        water_customer_code: 'WATER123', // Sensitive field - should be rejected
        electricity_customer_number: 'ELEC456'
      };

      expect(MemberDataGuards.isMemberLoftView(loftWithSensitiveData)).toBe(false);
    });

    it('should reject invalid objects', () => {
      expect(MemberDataGuards.isMemberLoftView(null)).toBe(false);
      expect(MemberDataGuards.isMemberLoftView(undefined)).toBe(false);
      expect(MemberDataGuards.isMemberLoftView('string')).toBe(false);
      expect(MemberDataGuards.isMemberLoftView({})).toBe(false);
    });
  });

  describe('isMemberTaskView', () => {
    it('should validate proper task view', () => {
      const validTaskView: MemberTaskView = {
        id: 'task-1',
        title: 'Test Task',
        status: 'todo',
        user_id: 'user-1',
        created_at: '2024-01-01',
        isAssignedToMe: true,
        isCreatedByMe: false,
        priority: 'medium'
      };

      expect(MemberDataGuards.isMemberTaskView(validTaskView)).toBe(true);
    });

    it('should reject invalid task status', () => {
      const invalidTask = {
        id: 'task-1',
        title: 'Test Task',
        status: 'invalid_status',
        user_id: 'user-1',
        created_at: '2024-01-01'
      };

      expect(MemberDataGuards.isMemberTaskView(invalidTask)).toBe(false);
    });
  });

  describe('isMemberNotificationView', () => {
    it('should validate task-related notification', () => {
      const validNotification: MemberNotificationView = {
        id: 'notif-1',
        user_id: 'user-1',
        created_at: '2024-01-01',
        is_read: false,
        type: 'task_assigned',
        isTaskRelated: true,
        priority: 'medium'
      };

      expect(MemberDataGuards.isMemberNotificationView(validNotification)).toBe(true);
    });

    it('should reject non-task-related notification', () => {
      const nonTaskNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        created_at: '2024-01-01',
        is_read: false,
        type: 'financial_report',
        isTaskRelated: false
      };

      expect(MemberDataGuards.isMemberNotificationView(nonTaskNotification)).toBe(false);
    });
  });

  describe('isMemberDashboardData', () => {
    it('should validate proper member dashboard data', () => {
      const validDashboardData: MemberDashboardData = {
        tasks: {
          all: [],
          assigned: [],
          created: [],
          overdue: [],
          dueToday: [],
          dueThisWeek: [],
          completed: []
        },
        lofts: {
          accessible: [],
          withActiveTasks: [],
          needingMaintenance: []
        },
        notifications: {
          all: [],
          unread: [],
          highPriority: [],
          recent: []
        },
        stats: {
          totalAssignedTasks: 0,
          completedThisMonth: 0,
          overdueTasks: 0,
          activeLofts: 0,
          unreadNotifications: 0,
          tasksDueToday: 0,
          tasksDueThisWeek: 0
        },
        member: {
          id: 'user-1',
          role: 'member'
        },
        meta: {
          lastUpdated: '2024-01-01',
          hasSecurityFiltering: true,
          filteredItemsCount: 5,
          permissions: {
            canViewFinancialData: false,
            canViewAllTasks: false,
            canViewAllLofts: false,
            canViewAllNotifications: false
          }
        }
      };

      expect(MemberDataGuards.isMemberDashboardData(validDashboardData)).toBe(true);
    });

    it('should reject dashboard data with wrong role', () => {
      const invalidData = {
        tasks: { all: [] },
        lofts: { accessible: [] },
        notifications: { all: [] },
        stats: {},
        member: { id: 'user-1', role: 'admin' }, // Wrong role
        meta: {
          permissions: {
            canViewFinancialData: false,
            canViewAllTasks: false,
            canViewAllLofts: false,
            canViewAllNotifications: false
          }
        }
      };

      expect(MemberDataGuards.isMemberDashboardData(invalidData)).toBe(false);
    });

    it('should reject dashboard data with elevated permissions', () => {
      const invalidData = {
        tasks: { all: [] },
        lofts: { accessible: [] },
        notifications: { all: [] },
        stats: {},
        member: { id: 'user-1', role: 'member' },
        meta: {
          permissions: {
            canViewFinancialData: true, // Should be false for member
            canViewAllTasks: false,
            canViewAllLofts: false,
            canViewAllNotifications: false
          }
        }
      };

      expect(MemberDataGuards.isMemberDashboardData(invalidData)).toBe(false);
    });
  });

  describe('sanitizeForMember', () => {
    it('should remove financial fields', () => {
      const dataWithFinancials = {
        id: '1',
        name: 'Test',
        price_per_month: 1000,
        revenue: 5000,
        amount: 250,
        safe_field: 'keep this'
      };

      const sanitized = MemberDataGuards.sanitizeForMember(dataWithFinancials);

      expect(sanitized.id).toBe('1');
      expect(sanitized.name).toBe('Test');
      expect(sanitized.safe_field).toBe('keep this');
      expect(sanitized).not.toHaveProperty('price_per_month');
      expect(sanitized).not.toHaveProperty('revenue');
      expect(sanitized).not.toHaveProperty('amount');
    });

    it('should remove sensitive fields', () => {
      const dataWithSensitive = {
        id: '1',
        name: 'Test',
        password: 'secret',
        customer_code: 'CUST123',
        meter_number: 'METER456',
        safe_field: 'keep this'
      };

      const sanitized = MemberDataGuards.sanitizeForMember(dataWithSensitive);

      expect(sanitized.id).toBe('1');
      expect(sanitized.name).toBe('Test');
      expect(sanitized.safe_field).toBe('keep this');
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('customer_code');
      expect(sanitized).not.toHaveProperty('meter_number');
    });

    it('should remove fields with financial keywords', () => {
      const dataWithKeywords = {
        id: '1',
        name: 'Test',
        monthly_price: 1000,
        total_cost: 500,
        payment_amount: 250,
        profit_percentage: 30,
        safe_field: 'keep this'
      };

      const sanitized = MemberDataGuards.sanitizeForMember(dataWithKeywords);

      expect(sanitized.id).toBe('1');
      expect(sanitized.name).toBe('Test');
      expect(sanitized.safe_field).toBe('keep this');
      expect(sanitized).not.toHaveProperty('monthly_price');
      expect(sanitized).not.toHaveProperty('total_cost');
      expect(sanitized).not.toHaveProperty('payment_amount');
      expect(sanitized).not.toHaveProperty('profit_percentage');
    });
  });
});

describe('MemberDataTransformers', () => {
  const mockUserId = 'user-123';

  describe('transformTask', () => {
    it('should transform task with assignment flags', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days from now
      
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'todo',
        user_id: 'user-123',
        assigned_to: 'user-123',
        created_at: '2024-01-01',
        due_date: futureDate.toISOString()
      };

      const transformed = MemberDataTransformers.transformTask(task, mockUserId);

      expect(transformed.isAssignedToMe).toBe(true);
      expect(transformed.isCreatedByMe).toBe(true);
      expect(transformed.daysUntilDue).toBeGreaterThan(0);
      expect(transformed.priority).toBeDefined();
    });

    it('should calculate correct assignment flags', () => {
      const assignedTask: Task = {
        id: 'task-1',
        title: 'Assigned Task',
        status: 'todo',
        user_id: 'other-user',
        assigned_to: 'user-123',
        created_at: '2024-01-01'
      };

      const createdTask: Task = {
        id: 'task-2',
        title: 'Created Task',
        status: 'todo',
        user_id: 'user-123',
        assigned_to: 'other-user',
        created_at: '2024-01-01'
      };

      const transformedAssigned = MemberDataTransformers.transformTask(assignedTask, mockUserId);
      const transformedCreated = MemberDataTransformers.transformTask(createdTask, mockUserId);

      expect(transformedAssigned.isAssignedToMe).toBe(true);
      expect(transformedAssigned.isCreatedByMe).toBe(false);

      expect(transformedCreated.isAssignedToMe).toBe(false);
      expect(transformedCreated.isCreatedByMe).toBe(true);
    });
  });

  describe('transformLoft', () => {
    it('should transform loft with task count', () => {
      const loft: Loft = {
        id: 'loft-1',
        name: 'Test Loft',
        address: '123 Main St',
        status: 'available',
        price_per_month: 1000,
        owner_id: 'owner-1',
        company_percentage: 70,
        owner_percentage: 30
      };

      const transformed = MemberDataTransformers.transformLoft(loft, 3);

      expect(transformed.id).toBe('loft-1');
      expect(transformed.name).toBe('Test Loft');
      expect(transformed.address).toBe('123 Main St');
      expect(transformed.status).toBe('available');
      expect(transformed.hasActiveTasks).toBe(true);
      expect(transformed.assignedTasksCount).toBe(3);

      // Should not include financial data
      expect(transformed).not.toHaveProperty('price_per_month');
      expect(transformed).not.toHaveProperty('owner_id');
    });

    it('should handle loft with no tasks', () => {
      const loft: Loft = {
        id: 'loft-1',
        name: 'Test Loft',
        address: '123 Main St',
        status: 'available',
        price_per_month: 1000,
        owner_id: 'owner-1',
        company_percentage: 70,
        owner_percentage: 30
      };

      const transformed = MemberDataTransformers.transformLoft(loft, 0);

      expect(transformed.hasActiveTasks).toBe(false);
      expect(transformed.assignedTasksCount).toBe(0);
    });
  });

  describe('transformNotification', () => {
    it('should transform task-related notification', () => {
      const notification: Notification = {
        id: 'notif-1',
        type: 'task_assigned',
        user_id: 'user-123',
        is_read: false,
        created_at: '2024-01-01T10:00:00Z',
        message_payload: {
          taskId: 'task-1',
          loftId: 'loft-1'
        }
      };

      const transformed = MemberDataTransformers.transformNotification(notification);

      expect(transformed.isTaskRelated).toBe(true);
      expect(transformed.taskId).toBe('task-1');
      expect(transformed.loftId).toBe('loft-1');
      expect(transformed.timeAgo).toBeDefined();
      expect(transformed.priority).toBeDefined();
    });

    it('should identify non-task-related notification', () => {
      const notification: Notification = {
        id: 'notif-1',
        type: 'financial_report',
        user_id: 'user-123',
        is_read: false,
        created_at: '2024-01-01T10:00:00Z'
      };

      const transformed = MemberDataTransformers.transformNotification(notification);

      expect(transformed.isTaskRelated).toBe(false);
    });
  });
});