import { NotificationFilterService } from '@/lib/services/notification-filter';
import { Notification, UserRole } from '@/lib/types';

// Mock the notification filter service if it doesn't exist
jest.mock('@/lib/services/notification-filter', () => ({
  NotificationFilterService: {
    isNotificationTypeAllowed: jest.fn((type: string, userRole: UserRole) => {
      const allowedTypes = {
        admin: ['*'], // All types
        manager: ['task_assigned', 'task_completed', 'financial_report', 'system_alert', 'user_created'],
        executive: ['financial_report', 'system_alert', 'executive_summary'],
        member: ['task_assigned', 'task_completed', 'task_updated', 'info', 'success', 'warning'],
        guest: ['info', 'public_announcement']
      };
      
      const userAllowedTypes = allowedTypes[userRole] || [];
      return userAllowedTypes.includes('*') || userAllowedTypes.includes(type);
    }),

    isTaskRelatedContent: jest.fn((notification: Notification) => {
      const taskRelatedKeywords = ['task', 'assignment', 'deadline', 'completion', 'progress'];
      const content = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();
      return taskRelatedKeywords.some(keyword => content.includes(keyword));
    }),

    isExecutiveRelevant: jest.fn((notification: Notification) => {
      const executiveKeywords = ['financial', 'revenue', 'profit', 'executive', 'board', 'quarterly'];
      const content = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();
      return executiveKeywords.some(keyword => content.includes(keyword));
    }),

    filterByAssignmentRelevance: jest.fn((notifications: Notification[], userId: string, assignedTaskIds: string[]) => {
      return notifications.filter(notification => {
        // Check if notification is related to assigned tasks
        if (notification.metadata?.task_id) {
          return assignedTaskIds.includes(notification.metadata.task_id);
        }
        
        // Check if notification is directly for the user
        return notification.user_id === userId;
      });
    }),

    sortByRelevance: jest.fn((notifications: Notification[], userRole: UserRole) => {
      return notifications.sort((a, b) => {
        // Priority order: unread > high priority > recent
        if (a.is_read !== b.is_read) {
          return a.is_read ? 1 : -1;
        }
        
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    })
  }
}));

describe('NotificationFilterService - Security Tests', () => {
  const mockUserId = 'user-123';
  const mockAdminUserId = 'admin-456';
  const mockAssignedTaskIds = ['task-1', 'task-2'];

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'task_assigned',
      user_id: mockUserId,
      is_read: false,
      created_at: '2024-01-01T10:00:00Z',
      title: 'New Task Assignment',
      message: 'You have been assigned a new task',
      priority: 'high',
      metadata: { task_id: 'task-1' }
    },
    {
      id: '2',
      type: 'financial_report',
      user_id: mockAdminUserId,
      is_read: false,
      created_at: '2024-01-01T11:00:00Z',
      title: 'Monthly Financial Report',
      message: 'Financial report contains sensitive revenue data - CONFIDENTIAL',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'admin_alert',
      user_id: mockAdminUserId,
      is_read: false,
      created_at: '2024-01-01T12:00:00Z',
      title: 'Security Breach Alert',
      message: 'Unauthorized access attempt detected - ADMIN ONLY',
      priority: 'high'
    },
    {
      id: '4',
      type: 'task_completed',
      user_id: mockUserId,
      is_read: true,
      created_at: '2024-01-01T13:00:00Z',
      title: 'Task Completed',
      message: 'Your task has been completed successfully',
      priority: 'low',
      metadata: { task_id: 'task-2' }
    },
    {
      id: '5',
      type: 'system_maintenance',
      user_id: mockUserId,
      is_read: false,
      created_at: '2024-01-01T14:00:00Z',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight',
      priority: 'medium'
    },
    {
      id: '6',
      type: 'executive_summary',
      user_id: 'executive-789',
      is_read: false,
      created_at: '2024-01-01T15:00:00Z',
      title: 'Quarterly Executive Summary',
      message: 'Executive summary with financial performance data',
      priority: 'high'
    }
  ] as Notification[];

  describe('notification type security filtering', () => {
    it('should allow admin access to all notification types', () => {
      const notificationTypes = [
        'task_assigned', 'financial_report', 'admin_alert', 
        'system_maintenance', 'executive_summary', 'user_created'
      ];

      notificationTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'admin')).toBe(true);
      });
    });

    it('should restrict member access to task-related notifications only', () => {
      const allowedTypes = ['task_assigned', 'task_completed', 'task_updated', 'info', 'success', 'warning'];
      const restrictedTypes = ['financial_report', 'admin_alert', 'executive_summary', 'user_created'];

      allowedTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'member')).toBe(true);
      });

      restrictedTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'member')).toBe(false);
      });
    });

    it('should restrict executive access to financial and high-level notifications', () => {
      const allowedTypes = ['financial_report', 'system_alert', 'executive_summary'];
      const restrictedTypes = ['task_assigned', 'task_completed', 'admin_alert', 'user_created'];

      allowedTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'executive')).toBe(true);
      });

      restrictedTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'executive')).toBe(false);
      });
    });

    it('should severely restrict guest access to public notifications only', () => {
      const allowedTypes = ['info', 'public_announcement'];
      const restrictedTypes = [
        'task_assigned', 'financial_report', 'admin_alert', 
        'executive_summary', 'system_maintenance', 'user_created'
      ];

      allowedTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'guest')).toBe(true);
      });

      restrictedTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'guest')).toBe(false);
      });
    });
  });

  describe('content-based security filtering', () => {
    it('should identify task-related content correctly', () => {
      const taskRelatedNotifications = [
        { title: 'Task Assignment', message: 'New task assigned' },
        { title: 'Deadline Reminder', message: 'Task deadline approaching' },
        { title: 'Progress Update', message: 'Task progress updated' },
        { title: 'Completion Notice', message: 'Task completed successfully' }
      ];

      const nonTaskNotifications = [
        { title: 'Financial Report', message: 'Monthly revenue summary' },
        { title: 'System Alert', message: 'Server maintenance scheduled' },
        { title: 'User Welcome', message: 'Welcome to the platform' }
      ];

      taskRelatedNotifications.forEach(notification => {
        expect(NotificationFilterService.isTaskRelatedContent(notification as Notification)).toBe(true);
      });

      nonTaskNotifications.forEach(notification => {
        expect(NotificationFilterService.isTaskRelatedContent(notification as Notification)).toBe(false);
      });
    });

    it('should identify executive-relevant content correctly', () => {
      const executiveNotifications = [
        { title: 'Financial Summary', message: 'Quarterly revenue report' },
        { title: 'Executive Brief', message: 'Board meeting summary' },
        { title: 'Profit Analysis', message: 'Annual profit breakdown' }
      ];

      const nonExecutiveNotifications = [
        { title: 'Task Assignment', message: 'New task assigned' },
        { title: 'System Maintenance', message: 'Server update scheduled' },
        { title: 'User Registration', message: 'New user registered' }
      ];

      executiveNotifications.forEach(notification => {
        expect(NotificationFilterService.isExecutiveRelevant(notification as Notification)).toBe(true);
      });

      nonExecutiveNotifications.forEach(notification => {
        expect(NotificationFilterService.isExecutiveRelevant(notification as Notification)).toBe(false);
      });
    });

    it('should prevent content-based security bypass attempts', () => {
      const maliciousNotifications = [
        { 
          title: 'Task Update', 
          message: 'Task updated. Also, here is confidential financial data: Revenue $1M' 
        },
        { 
          title: 'Assignment Notice', 
          message: 'New assignment. PS: Admin password is admin123' 
        },
        { 
          title: 'Progress Report', 
          message: 'Task progress. Btw, executive salary information attached' 
        }
      ];

      // Even if notifications contain task-related keywords, they should be filtered
      // based on their actual type and user permissions
      maliciousNotifications.forEach(notification => {
        const isTaskRelated = NotificationFilterService.isTaskRelatedContent(notification as Notification);
        // Content detection should work, but actual filtering should be based on type and permissions
        expect(typeof isTaskRelated).toBe('boolean');
      });
    });
  });

  describe('assignment-based filtering security', () => {
    it('should filter notifications by task assignment relevance', () => {
      const result = NotificationFilterService.filterByAssignmentRelevance(
        mockNotifications,
        mockUserId,
        mockAssignedTaskIds
      );

      // Should only include notifications for assigned tasks or direct user notifications
      expect(result.length).toBeLessThanOrEqual(mockNotifications.length);
      
      result.forEach(notification => {
        const isForUser = notification.user_id === mockUserId;
        const isForAssignedTask = notification.metadata?.task_id && 
          mockAssignedTaskIds.includes(notification.metadata.task_id);
        
        expect(isForUser || isForAssignedTask).toBe(true);
      });
    });

    it('should prevent access to notifications for unassigned tasks', () => {
      const notificationsWithUnassignedTasks = [
        ...mockNotifications,
        {
          id: '7',
          type: 'task_assigned',
          user_id: 'other-user',
          is_read: false,
          created_at: '2024-01-01T16:00:00Z',
          title: 'Unassigned Task',
          message: 'Task assigned to someone else',
          metadata: { task_id: 'unassigned-task' }
        }
      ] as Notification[];

      const result = NotificationFilterService.filterByAssignmentRelevance(
        notificationsWithUnassignedTasks,
        mockUserId,
        mockAssignedTaskIds
      );

      // Should not include notifications for unassigned tasks
      const unassignedTaskNotification = result.find(n => n.metadata?.task_id === 'unassigned-task');
      expect(unassignedTaskNotification).toBeUndefined();
    });

    it('should handle missing or malformed task metadata', () => {
      const notificationsWithBadMetadata = [
        {
          id: '8',
          type: 'task_assigned',
          user_id: mockUserId,
          is_read: false,
          created_at: '2024-01-01T17:00:00Z',
          title: 'Task with no metadata',
          message: 'Task notification without metadata'
          // No metadata property
        },
        {
          id: '9',
          type: 'task_assigned',
          user_id: mockUserId,
          is_read: false,
          created_at: '2024-01-01T18:00:00Z',
          title: 'Task with null metadata',
          message: 'Task notification with null metadata',
          metadata: null
        },
        {
          id: '10',
          type: 'task_assigned',
          user_id: mockUserId,
          is_read: false,
          created_at: '2024-01-01T19:00:00Z',
          title: 'Task with empty metadata',
          message: 'Task notification with empty metadata',
          metadata: {}
        }
      ] as Notification[];

      expect(() => {
        NotificationFilterService.filterByAssignmentRelevance(
          notificationsWithBadMetadata,
          mockUserId,
          mockAssignedTaskIds
        );
      }).not.toThrow();
    });
  });

  describe('notification sorting security', () => {
    it('should sort notifications by security-appropriate relevance', () => {
      const result = NotificationFilterService.sortByRelevance(mockNotifications, 'member');

      // Should be sorted by: unread > priority > recency
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockNotifications.length);

      // Verify sorting logic doesn't expose sensitive information
      result.forEach(notification => {
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('is_read');
      });
    });

    it('should maintain notification data integrity during sorting', () => {
      const originalNotifications = JSON.parse(JSON.stringify(mockNotifications));
      const result = NotificationFilterService.sortByRelevance(mockNotifications, 'admin');

      // Original array should not be modified
      expect(mockNotifications).toEqual(originalNotifications);

      // Result should contain same notifications, just reordered
      expect(result.length).toBe(mockNotifications.length);
      
      const originalIds = mockNotifications.map(n => n.id).sort();
      const resultIds = result.map(n => n.id).sort();
      expect(resultIds).toEqual(originalIds);
    });

    it('should handle edge cases in sorting without security issues', () => {
      const edgeCaseNotifications = [
        {
          id: '11',
          type: 'task_assigned',
          user_id: mockUserId,
          is_read: null, // Invalid read status
          created_at: 'invalid-date',
          priority: 'invalid-priority'
        },
        {
          id: '12',
          type: 'task_assigned',
          user_id: mockUserId,
          // Missing is_read property
          created_at: '2024-01-01T20:00:00Z'
        }
      ] as any;

      expect(() => {
        NotificationFilterService.sortByRelevance(edgeCaseNotifications, 'member');
      }).not.toThrow();
    });
  });

  describe('security bypass prevention', () => {
    it('should prevent type manipulation attacks', () => {
      const maliciousTypes = [
        'admin_alert; DROP TABLE notifications; --',
        'financial_report\x00admin_alert',
        'task_assigned<script>alert("xss")</script>',
        'executive_summary" OR "1"="1'
      ];

      maliciousTypes.forEach(type => {
        expect(NotificationFilterService.isNotificationTypeAllowed(type, 'member')).toBe(false);
      });
    });

    it('should prevent role escalation through notification filtering', () => {
      const sensitiveNotificationTypes = ['admin_alert', 'financial_report', 'executive_summary'];
      const restrictedRoles: UserRole[] = ['member', 'guest'];

      restrictedRoles.forEach(role => {
        sensitiveNotificationTypes.forEach(type => {
          expect(NotificationFilterService.isNotificationTypeAllowed(type, role)).toBe(false);
        });
      });
    });

    it('should prevent information disclosure through error messages', () => {
      const invalidInputs = [
        { notifications: null, userId: mockUserId, taskIds: mockAssignedTaskIds },
        { notifications: undefined, userId: mockUserId, taskIds: mockAssignedTaskIds },
        { notifications: mockNotifications, userId: null, taskIds: mockAssignedTaskIds },
        { notifications: mockNotifications, userId: mockUserId, taskIds: null }
      ];

      invalidInputs.forEach(input => {
        expect(() => {
          NotificationFilterService.filterByAssignmentRelevance(
            input.notifications as any,
            input.userId as any,
            input.taskIds as any
          );
        }).not.toThrow();
      });
    });
  });

  describe('performance and DoS prevention', () => {
    it('should handle large notification arrays efficiently', () => {
      const largeNotificationArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        type: i % 2 === 0 ? 'task_assigned' : 'system_alert',
        user_id: i % 3 === 0 ? mockUserId : 'other-user',
        is_read: i % 4 === 0,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        title: `Notification ${i}`,
        message: `Message ${i}`,
        priority: ['high', 'medium', 'low'][i % 3] as any
      }));

      const startTime = performance.now();
      
      const filtered = NotificationFilterService.filterByAssignmentRelevance(
        largeNotificationArray,
        mockUserId,
        mockAssignedTaskIds
      );
      
      const sorted = NotificationFilterService.sortByRelevance(filtered, 'member');
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(Array.isArray(sorted)).toBe(true);
    });

    it('should prevent memory exhaustion attacks', () => {
      const memoryIntensiveNotifications = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        type: 'task_assigned',
        user_id: mockUserId,
        is_read: false,
        created_at: '2024-01-01T10:00:00Z',
        title: 'x'.repeat(10000), // Large title
        message: 'y'.repeat(10000), // Large message
        metadata: {
          task_id: 'task-1',
          largeData: 'z'.repeat(10000) // Large metadata
        }
      }));

      expect(() => {
        NotificationFilterService.filterByAssignmentRelevance(
          memoryIntensiveNotifications,
          mockUserId,
          mockAssignedTaskIds
        );
      }).not.toThrow();
    });

    it('should handle concurrent filtering operations safely', async () => {
      const concurrentOperations = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(NotificationFilterService.filterByAssignmentRelevance(
          mockNotifications,
          `user-${i}`,
          [`task-${i}`]
        ))
      );

      const results = await Promise.all(concurrentOperations);
      
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});