import { Task, TaskWithLoft, Loft, LoftWithRelations, Notification, UserRole } from '@/lib/types';

/**
 * Sanitized loft view for member role - excludes financial and sensitive data
 */
export interface MemberLoftView {
  /** Loft identifier */
  id: string;
  /** Loft name */
  name: string;
  /** Loft address */
  address: string;
  /** Optional description */
  description?: string;
  /** Current status (available, occupied, maintenance) */
  status: 'available' | 'occupied' | 'maintenance';
  /** Zone area identifier */
  zone_area_id?: string;
  /** Zone area name (if available) */
  zone_area_name?: string | null;
  /** Contact phone number */
  phone_number?: string;
  /** Whether the member has active tasks for this loft */
  hasActiveTasks?: boolean;
  /** Number of assigned tasks for this loft */
  assignedTasksCount?: number;
}

/**
 * Task view for member role - includes loft information but limited scope
 */
export interface MemberTaskView extends Task {
  /** Associated loft name */
  loft_name?: string | null;
  /** Associated loft address */
  loft_address?: string | null;
  /** Loft status for context */
  loft_status?: 'available' | 'occupied' | 'maintenance';
  /** Whether this task is assigned to the current member */
  isAssignedToMe?: boolean;
  /** Whether this task was created by the current member */
  isCreatedByMe?: boolean;
  /** Days until due date (if applicable) */
  daysUntilDue?: number | null;
  /** Priority level based on due date and status */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Notification view for member role - only task-related notifications
 */
export interface MemberNotificationView extends Notification {
  /** Whether this notification is task-related */
  isTaskRelated: boolean;
  /** Associated task ID (if applicable) */
  taskId?: string;
  /** Associated loft ID (if applicable) */
  loftId?: string;
  /** Formatted time ago string */
  timeAgo?: string;
  /** Priority level for display */
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Dashboard data structure specifically for member role
 */
export interface MemberDashboardData {
  /** Member's assigned and created tasks */
  tasks: {
    /** All tasks visible to the member */
    all: MemberTaskView[];
    /** Tasks assigned to the member */
    assigned: MemberTaskView[];
    /** Tasks created by the member */
    created: MemberTaskView[];
    /** Overdue tasks */
    overdue: MemberTaskView[];
    /** Tasks due today */
    dueToday: MemberTaskView[];
    /** Tasks due this week */
    dueThisWeek: MemberTaskView[];
    /** Completed tasks (recent) */
    completed: MemberTaskView[];
  };

  /** Lofts where the member has tasks */
  lofts: {
    /** All lofts accessible to the member */
    accessible: MemberLoftView[];
    /** Lofts with active tasks */
    withActiveTasks: MemberLoftView[];
    /** Lofts requiring maintenance */
    needingMaintenance: MemberLoftView[];
  };

  /** Task-related notifications for the member */
  notifications: {
    /** All notifications */
    all: MemberNotificationView[];
    /** Unread notifications */
    unread: MemberNotificationView[];
    /** High priority notifications */
    highPriority: MemberNotificationView[];
    /** Recent notifications (last 7 days) */
    recent: MemberNotificationView[];
  };

  /** Summary statistics for the member */
  stats: {
    /** Total assigned tasks */
    totalAssignedTasks: number;
    /** Completed tasks this month */
    completedThisMonth: number;
    /** Overdue tasks count */
    overdueTasks: number;
    /** Active lofts count */
    activeLofts: number;
    /** Unread notifications count */
    unreadNotifications: number;
    /** Tasks due today count */
    tasksDueToday: number;
    /** Tasks due this week count */
    tasksDueThisWeek: number;
  };

  /** Member profile information */
  member: {
    /** Member ID */
    id: string;
    /** Member role (should be 'member') */
    role: UserRole;
    /** Member name */
    name?: string;
    /** Member email */
    email?: string;
    /** Last login timestamp */
    lastLogin?: string;
    /** Member since date */
    memberSince?: string;
  };

  /** Data freshness and security info */
  meta: {
    /** When this data was last updated */
    lastUpdated: string;
    /** Whether any data was filtered for security */
    hasSecurityFiltering: boolean;
    /** Total items filtered out */
    filteredItemsCount: number;
    /** Data access permissions */
    permissions: {
      canViewFinancialData: false;
      canViewAllTasks: false;
      canViewAllLofts: false;
      canViewAllNotifications: false;
    };
  };
}

/**
 * Type guards for member data validation
 */
export class MemberDataGuards {
  /**
   * Check if a loft view is properly sanitized for member access
   */
  static isMemberLoftView(loft: any): loft is MemberLoftView {
    if (!loft || typeof loft !== 'object') return false;
    
    // Check required fields
    const hasRequiredFields = 
      typeof loft.id === 'string' &&
      typeof loft.name === 'string' &&
      typeof loft.address === 'string' &&
      ['available', 'occupied', 'maintenance'].includes(loft.status);

    // Check that financial fields are NOT present
    const hasNoFinancialFields = 
      !('price_per_month' in loft) &&
      !('company_percentage' in loft) &&
      !('owner_percentage' in loft) &&
      !('owner_id' in loft);

    // Check that sensitive utility fields are NOT present
    const hasNoSensitiveFields = 
      !('water_customer_code' in loft) &&
      !('electricity_customer_number' in loft) &&
      !('gas_customer_number' in loft);

    return hasRequiredFields && hasNoFinancialFields && hasNoSensitiveFields;
  }

  /**
   * Check if a task view is properly configured for member access
   */
  static isMemberTaskView(task: any): task is MemberTaskView {
    if (!task || typeof task !== 'object') return false;
    
    return (
      typeof task.id === 'string' &&
      typeof task.title === 'string' &&
      typeof task.status === 'string' &&
      ['todo', 'in_progress', 'completed'].includes(task.status) &&
      typeof task.user_id === 'string' &&
      typeof task.created_at === 'string'
    );
  }

  /**
   * Check if a notification is appropriate for member access
   */
  static isMemberNotificationView(notification: any): notification is MemberNotificationView {
    if (!notification || typeof notification !== 'object') return false;
    
    const isValidNotification = 
      typeof notification.id === 'string' &&
      typeof notification.user_id === 'string' &&
      typeof notification.created_at === 'string' &&
      typeof notification.is_read === 'boolean';

    // Check if it's task-related
    const isTaskRelated = 
      notification.isTaskRelated === true ||
      (notification.type && notification.type.includes('task'));

    return isValidNotification && isTaskRelated;
  }

  /**
   * Validate complete member dashboard data structure
   */
  static isMemberDashboardData(data: any): data is MemberDashboardData {
    if (!data || typeof data !== 'object') return false;

    // Check main structure
    const hasValidStructure = 
      data.tasks && typeof data.tasks === 'object' &&
      data.lofts && typeof data.lofts === 'object' &&
      data.notifications && typeof data.notifications === 'object' &&
      data.stats && typeof data.stats === 'object' &&
      data.member && typeof data.member === 'object' &&
      data.meta && typeof data.meta === 'object';

    if (!hasValidStructure) return false;

    // Check member role
    const hasValidMemberRole = data.member.role === 'member';

    // Check permissions are properly restricted
    const hasRestrictedPermissions = 
      data.meta.permissions &&
      data.meta.permissions.canViewFinancialData === false &&
      data.meta.permissions.canViewAllTasks === false &&
      data.meta.permissions.canViewAllLofts === false &&
      data.meta.permissions.canViewAllNotifications === false;

    return hasValidMemberRole && hasRestrictedPermissions;
  }

  /**
   * Sanitize any object to ensure no financial data leaks to members
   */
  static sanitizeForMember<T extends Record<string, any>>(obj: T): Partial<T> {
    const financialFields = [
      'price_per_month',
      'company_percentage', 
      'owner_percentage',
      'owner_id',
      'amount',
      'revenue',
      'expense',
      'profit',
      'cost',
      'payment',
      'transaction'
    ];

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'customer_code',
      'contract_code',
      'meter_number',
      'pdl_ref',
      'customer_number'
    ];

    const fieldsToRemove = [...financialFields, ...sensitiveFields];
    
    const sanitized = { ...obj };
    
    fieldsToRemove.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    // Also remove any field that contains financial keywords
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('price') ||
        lowerKey.includes('cost') ||
        lowerKey.includes('amount') ||
        lowerKey.includes('payment') ||
        lowerKey.includes('revenue') ||
        lowerKey.includes('profit') ||
        lowerKey.includes('percentage')
      ) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }
}

/**
 * Utility functions for member data transformation
 */
export class MemberDataTransformers {
  /**
   * Transform a regular task to MemberTaskView
   */
  static transformTask(task: Task | TaskWithLoft, userId: string): MemberTaskView {
    const memberTask: MemberTaskView = {
      ...task,
      isAssignedToMe: task.assigned_to === userId,
      isCreatedByMe: task.user_id === userId,
      daysUntilDue: task.due_date ? this.calculateDaysUntilDue(task.due_date) : null,
      priority: this.calculateTaskPriority(task)
    };

    return memberTask;
  }

  /**
   * Transform a regular loft to MemberLoftView (with security filtering)
   */
  static transformLoft(loft: Loft | LoftWithRelations, assignedTasksCount: number = 0): MemberLoftView {
    // Use sanitization to ensure no financial data leaks
    const sanitized = MemberDataGuards.sanitizeForMember(loft);
    
    return {
      id: sanitized.id!,
      name: sanitized.name!,
      address: sanitized.address!,
      description: sanitized.description,
      status: sanitized.status!,
      zone_area_id: sanitized.zone_area_id,
      zone_area_name: 'zone_area_name' in sanitized ? (sanitized as any).zone_area_name : undefined,
      phone_number: sanitized.phone_number,
      hasActiveTasks: assignedTasksCount > 0,
      assignedTasksCount
    };
  }

  /**
   * Filter lofts to only show those with assigned tasks for a member
   */
  static filterLoftsForMember(
    lofts: Loft[] | LoftWithRelations[], 
    userId: string, 
    tasks: Task[]
  ): MemberLoftView[] {
    // Get loft IDs where the member has tasks
    const assignedLoftIds = tasks
      .filter(task => task.assigned_to === userId || task.user_id === userId)
      .map(task => task.loft_id)
      .filter((id): id is string => id !== null && id !== undefined);
    
    const uniqueLoftIds = [...new Set(assignedLoftIds)];
    
    return lofts
      .filter(loft => uniqueLoftIds.includes(loft.id))
      .map(loft => {
        const loftTasksCount = tasks.filter(task => 
          task.loft_id === loft.id && 
          (task.assigned_to === userId || task.user_id === userId)
        ).length;
        
        return this.transformLoft(loft, loftTasksCount);
      });
  }

  /**
   * Get lofts that need maintenance based on member's tasks
   */
  static getLoftsNeedingMaintenance(memberLofts: MemberLoftView[]): MemberLoftView[] {
    return memberLofts.filter(loft => 
      loft.status === 'maintenance' || loft.hasActiveTasks
    );
  }

  /**
   * Get lofts with active tasks
   */
  static getLoftsWithActiveTasks(memberLofts: MemberLoftView[]): MemberLoftView[] {
    return memberLofts.filter(loft => loft.hasActiveTasks);
  }

  /**
   * Transform a regular notification to MemberNotificationView
   */
  static transformNotification(notification: Notification): MemberNotificationView {
    const isTaskRelated = notification.type.includes('task') || 
                         ['task_assigned', 'task_updated', 'task_completed', 'task_overdue'].includes(notification.type);

    return {
      ...notification,
      isTaskRelated,
      taskId: notification.message_payload?.taskId,
      loftId: notification.message_payload?.loftId,
      timeAgo: this.calculateTimeAgo(notification.created_at),
      priority: this.calculateNotificationPriority(notification)
    };
  }

  /**
   * Calculate days until due date
   */
  private static calculateDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate task priority based on due date and status
   */
  private static calculateTaskPriority(task: Task): 'low' | 'medium' | 'high' | 'urgent' {
    if (task.status === 'completed') return 'low';
    
    if (!task.due_date) return 'medium';
    
    const daysUntilDue = this.calculateDaysUntilDue(task.due_date);
    
    if (daysUntilDue < 0) return 'urgent'; // Overdue
    if (daysUntilDue === 0) return 'urgent'; // Due today
    if (daysUntilDue <= 2) return 'high'; // Due within 2 days
    if (daysUntilDue <= 7) return 'medium'; // Due within a week
    
    return 'low';
  }

  /**
   * Calculate notification priority
   */
  private static calculateNotificationPriority(notification: Notification): 'low' | 'medium' | 'high' {
    if (notification.type.includes('urgent') || notification.type.includes('overdue')) {
      return 'high';
    }
    
    if (notification.type.includes('assigned') || notification.type.includes('updated')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Calculate time ago string
   */
  private static calculateTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return past.toLocaleDateString();
  }
}