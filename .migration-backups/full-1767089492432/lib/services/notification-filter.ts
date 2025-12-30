import { Notification, UserRole } from '@/lib/types';

/**
 * Notification type categories for role-based filtering
 */
export const NOTIFICATION_TYPE_CATEGORIES = {
  // Task-related notifications (allowed for members)
  TASK: [
    'task_assigned',
    'task_updated', 
    'task_completed',
    'task_overdue',
    'task_reassigned',
    'task_due_date_changed',
    'task_status_changed',
    'task_deleted',
    'newTaskAssigned'
  ],

  // Financial notifications (admin/manager/executive only)
  FINANCIAL: [
    'bill_paid',
    'bill_overdue',
    'revenue_milestone',
    'expense_threshold',
    'financial_alert',
    'payment_received',
    'payment_failed'
  ],

  // System notifications (admin/manager only, some for executive)
  SYSTEM: [
    'system_alert',
    'system_error',
    'system_maintenance',
    'backup_completed',
    'backup_failed',
    'user_registered',
    'user_role_changed'
  ],

  // Executive notifications (executive role specific)
  EXECUTIVE: [
    'critical_alert',
    'performance_report',
    'monthly_summary',
    'quarterly_report',
    'dashboard_alert'
  ],

  // General notifications (all authenticated users)
  GENERAL: [
    'info',
    'success',
    'warning',
    'error',
    'welcome',
    'profile_updated',
    'password_changed'
  ]
} as const;

/**
 * Role-based notification access matrix
 */
export const ROLE_NOTIFICATION_ACCESS = {
  admin: [...NOTIFICATION_TYPE_CATEGORIES.TASK, ...NOTIFICATION_TYPE_CATEGORIES.FINANCIAL, ...NOTIFICATION_TYPE_CATEGORIES.SYSTEM, ...NOTIFICATION_TYPE_CATEGORIES.EXECUTIVE, ...NOTIFICATION_TYPE_CATEGORIES.GENERAL],
  manager: [...NOTIFICATION_TYPE_CATEGORIES.TASK, ...NOTIFICATION_TYPE_CATEGORIES.FINANCIAL, ...NOTIFICATION_TYPE_CATEGORIES.SYSTEM, ...NOTIFICATION_TYPE_CATEGORIES.GENERAL],
  executive: [...NOTIFICATION_TYPE_CATEGORIES.EXECUTIVE, ...NOTIFICATION_TYPE_CATEGORIES.FINANCIAL, ...NOTIFICATION_TYPE_CATEGORIES.GENERAL],
  member: [...NOTIFICATION_TYPE_CATEGORIES.TASK, ...NOTIFICATION_TYPE_CATEGORIES.GENERAL],
  guest: []
} as const;

/**
 * Enhanced notification filtering service
 */
export class NotificationFilterService {
  /**
   * Check if a notification type is allowed for a specific role
   */
  static isNotificationTypeAllowed(notificationType: string, userRole: UserRole): boolean {
    const allowedTypes = ROLE_NOTIFICATION_ACCESS[userRole] || [];
    
    // Direct type match
    if (allowedTypes.includes(notificationType as any)) {
      return true;
    }

    // Pattern matching for dynamic types
    return this.matchesAllowedPattern(notificationType, userRole);
  }

  /**
   * Match notification type against allowed patterns for role
   */
  private static matchesAllowedPattern(notificationType: string, userRole: UserRole): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        // Admin and manager can see all notification types
        return true;

      case 'executive':
        // Executive can see financial, executive, and general notifications
        return notificationType.startsWith('financial_') ||
               notificationType.startsWith('executive_') ||
               notificationType.startsWith('system_') ||
               NOTIFICATION_TYPE_CATEGORIES.GENERAL.includes(notificationType as any);

      case 'member':
        // Member can only see task-related and general notifications
        return notificationType.startsWith('task_') ||
               NOTIFICATION_TYPE_CATEGORIES.GENERAL.includes(notificationType as any);

      case 'guest':
      default:
        return false;
    }
  }

  /**
   * Check if notification content is relevant for member role
   */
  static isTaskRelatedContent(notification: Notification): boolean {
    const taskKeywords = [
      'task',
      'assigned',
      'completed',
      'overdue',
      'due date',
      'status',
      'assignment',
      'deadline',
      'progress'
    ];

    const titleKey = notification.title_key?.toLowerCase() || '';
    const messageKey = notification.message_key?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';

    // Check if any task-related keywords are present
    return taskKeywords.some(keyword => 
      titleKey.includes(keyword) || 
      messageKey.includes(keyword) ||
      message.includes(keyword)
    );
  }

  /**
   * Check if notification is relevant for executive role
   */
  static isExecutiveRelevant(notification: Notification): boolean {
    const executiveKeywords = [
      'critical',
      'alert',
      'report',
      'summary',
      'performance',
      'revenue',
      'financial',
      'milestone',
      'threshold'
    ];

    const titleKey = notification.title_key?.toLowerCase() || '';
    const messageKey = notification.message_key?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';

    return executiveKeywords.some(keyword => 
      titleKey.includes(keyword) || 
      messageKey.includes(keyword) ||
      message.includes(keyword)
    );
  }

  /**
   * Filter notifications based on user assignment relevance
   */
  static filterByAssignmentRelevance(
    notifications: Notification[], 
    userId: string, 
    assignedTaskIds: string[] = []
  ): Notification[] {
    return notifications.filter(notification => {
      // If notification has a link to a task, check if user is assigned to that task
      if (notification.link && notification.link.includes('/tasks/')) {
        const taskId = notification.link.split('/tasks/')[1]?.split('?')[0];
        return assignedTaskIds.includes(taskId);
      }

      // For task-related notifications without links, check if they mention assigned tasks
      if (this.isTaskRelatedContent(notification)) {
        // If we can't determine task relevance, allow it (better to show than hide)
        return true;
      }

      return true;
    });
  }

  /**
   * Get notification priority based on type and role
   */
  static getNotificationPriority(notification: Notification, userRole: UserRole): 'high' | 'medium' | 'low' {
    const { type } = notification;

    // High priority notifications
    const highPriorityTypes = ['error', 'critical_alert', 'task_overdue', 'bill_overdue', 'system_error'];
    if (highPriorityTypes.includes(type)) {
      return 'high';
    }

    // Medium priority for role-specific important notifications
    if (userRole === 'member' && type.startsWith('task_')) {
      return 'medium';
    }

    if (userRole === 'executive' && (type.startsWith('financial_') || type.startsWith('executive_'))) {
      return 'medium';
    }

    // Low priority for general notifications
    return 'low';
  }

  /**
   * Sort notifications by relevance and priority for a specific role
   */
  static sortByRelevance(notifications: Notification[], userRole: UserRole): Notification[] {
    return notifications.sort((a, b) => {
      const priorityA = this.getNotificationPriority(a, userRole);
      const priorityB = this.getNotificationPriority(b, userRole);

      // Priority order: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[priorityB] - priorityOrder[priorityA];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // If same priority, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  /**
   * Get notification statistics for a role
   */
  static getNotificationStats(notifications: Notification[], userRole: UserRole) {
    const filtered = notifications.filter(n => this.isNotificationTypeAllowed(n.type, userRole));
    
    const stats = {
      total: filtered.length,
      unread: filtered.filter(n => !n.is_read).length,
      byType: {} as Record<string, number>,
      byPriority: { high: 0, medium: 0, low: 0 }
    };

    filtered.forEach(notification => {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Count by priority
      const priority = this.getNotificationPriority(notification, userRole);
      stats.byPriority[priority]++;
    });

    return stats;
  }
}