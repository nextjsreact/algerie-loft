import { UserRole, Task, TaskWithLoft, Loft, LoftWithRelations, Notification, Transaction } from '@/lib/types';
import { PermissionValidator } from '@/lib/permissions/types';
import { NotificationFilterService } from './notification-filter';

/**
 * Configuration for data filtering operations
 */
export interface FilterConfig {
  /** The user's role */
  userRole: UserRole;
  /** The user's ID for ownership checks */
  userId?: string;
  /** Array of loft IDs the user has access to */
  assignedLoftIds?: string[];
  /** Array of team IDs the user belongs to */
  teamIds?: string[];
}

/**
 * Result of a filtering operation with metadata
 */
export interface FilterResult<T> {
  /** The filtered data */
  data: T[];
  /** Number of items filtered out */
  filteredCount: number;
  /** Total number of items before filtering */
  totalCount: number;
  /** Whether any items were filtered for security reasons */
  hasSecurityFiltering: boolean;
}

/**
 * Service class for filtering data based on user roles and permissions
 */
export class DataFilterService {
  /**
   * Filter tasks based on user role and permissions
   */
  static filterTasks(tasks: Task[] | TaskWithLoft[], config: FilterConfig): FilterResult<Task | TaskWithLoft> {
    const { userRole, userId } = config;
    const totalCount = tasks.length;
    let filteredData: (Task | TaskWithLoft)[] = [];
    let hasSecurityFiltering = false;

    switch (userRole) {
      case 'admin':
      case 'manager':
        // Full access to all tasks
        filteredData = tasks;
        break;

      case 'executive':
        // Executives don't need task details - return empty array
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;

      case 'member':
        // Members can only see tasks assigned to them or created by them
        filteredData = tasks.filter(task => 
          task.assigned_to === userId || task.user_id === userId
        );
        hasSecurityFiltering = filteredData.length < totalCount;
        break;

      case 'guest':
      default:
        // No task access for guests
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;
    }

    return {
      data: filteredData,
      filteredCount: totalCount - filteredData.length,
      totalCount,
      hasSecurityFiltering
    };
  }

  /**
   * Filter notifications based on user role and relevance
   */
  static filterNotifications(notifications: Notification[], config: FilterConfig): FilterResult<Notification> {
    const { userRole, userId } = config;
    const totalCount = notifications.length;
    let filteredData: Notification[] = [];
    let hasSecurityFiltering = false;

    switch (userRole) {
      case 'admin':
      case 'manager':
        // Full access to all notifications
        filteredData = notifications;
        break;

      case 'executive':
        // Executives can see their own notifications and system-wide alerts
        filteredData = notifications.filter(notification => 
          notification.user_id === userId || 
          this.isExecutiveRelevantNotification(notification)
        );
        hasSecurityFiltering = filteredData.length < totalCount;
        break;

      case 'member':
        // Members can only see their own task-related notifications
        filteredData = notifications.filter(notification => 
          notification.user_id === userId && 
          this.isMemberRelevantNotification(notification)
        );
        hasSecurityFiltering = filteredData.length < totalCount;
        break;

      case 'guest':
      default:
        // No notification access for guests
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;
    }

    return {
      data: filteredData,
      filteredCount: totalCount - filteredData.length,
      totalCount,
      hasSecurityFiltering
    };
  }

  /**
   * Check if notification is relevant for member role
   */
  private static isMemberRelevantNotification(notification: Notification): boolean {
    // Use the enhanced notification filter service
    if (!NotificationFilterService.isNotificationTypeAllowed(notification.type, 'member')) {
      return false;
    }

    // For general notification types, check if they're task-related by content
    if (['info', 'success', 'warning'].includes(notification.type)) {
      return NotificationFilterService.isTaskRelatedContent(notification);
    }

    return true;
  }

  /**
   * Check if notification is relevant for executive role
   */
  private static isExecutiveRelevantNotification(notification: Notification): boolean {
    // Use the enhanced notification filter service
    return NotificationFilterService.isNotificationTypeAllowed(notification.type, 'executive') ||
           NotificationFilterService.isExecutiveRelevant(notification);
  }

  /**
   * Validate notification type for role-based access
   */
  static validateNotificationAccess(notification: Notification, userRole: UserRole, userId: string): boolean {
    // Basic ownership check
    if (notification.user_id !== userId && !['admin', 'manager'].includes(userRole)) {
      // Only admin and manager can see notifications for other users
      if (userRole === 'executive') {
        return this.isExecutiveRelevantNotification(notification);
      }
      return false;
    }

    // Role-specific type validation using enhanced filter service
    return NotificationFilterService.isNotificationTypeAllowed(notification.type, userRole) &&
           (userRole === 'member' ? this.isMemberRelevantNotification(notification) : true);
  }

  /**
   * Enhanced notification filtering with assignment relevance
   */
  static filterNotificationsWithAssignments(
    notifications: Notification[], 
    config: FilterConfig,
    assignedTaskIds: string[] = []
  ): FilterResult<Notification> {
    // First apply role-based filtering
    const roleFiltered = this.filterNotifications(notifications, config);

    // For members, apply additional assignment-based filtering
    if (config.userRole === 'member' && assignedTaskIds.length > 0) {
      const assignmentFiltered = NotificationFilterService.filterByAssignmentRelevance(
        roleFiltered.data,
        config.userId || '',
        assignedTaskIds
      );

      return {
        ...roleFiltered,
        data: NotificationFilterService.sortByRelevance(assignmentFiltered, config.userRole),
        filteredCount: notifications.length - assignmentFiltered.length
      };
    }

    // Sort by relevance for all roles
    return {
      ...roleFiltered,
      data: NotificationFilterService.sortByRelevance(roleFiltered.data, config.userRole)
    };
  }

  /**
   * Filter lofts based on user role and assignment
   */
  static filterLofts(lofts: Loft[] | LoftWithRelations[], config: FilterConfig): FilterResult<Loft | LoftWithRelations> {
    const { userRole, assignedLoftIds = [] } = config;
    const totalCount = lofts.length;
    let filteredData: (Loft | LoftWithRelations)[] = [];
    let hasSecurityFiltering = false;

    switch (userRole) {
      case 'admin':
      case 'manager':
      case 'executive':
        // Full access to all lofts
        filteredData = lofts;
        break;

      case 'member':
        // Members can only see lofts where they have assigned tasks
        filteredData = lofts.filter(loft => 
          assignedLoftIds.includes(loft.id)
        );
        hasSecurityFiltering = filteredData.length < totalCount;
        break;

      case 'guest':
      default:
        // No loft access for guests
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;
    }

    return {
      data: filteredData,
      filteredCount: totalCount - filteredData.length,
      totalCount,
      hasSecurityFiltering
    };
  }

  /**
   * Filter lofts specifically for member role with enhanced security
   */
  static filterLoftsForMember(
    lofts: Loft[] | LoftWithRelations[], 
    userId: string, 
    assignedTasks: Task[]
  ): FilterResult<Partial<Loft | LoftWithRelations>> {
    const totalCount = lofts.length;
    
    // Get loft IDs where the member has assigned tasks
    const assignedLoftIds = this.getAssignedLoftIds(userId, assignedTasks);
    
    // Filter lofts to only those with assigned tasks
    const accessibleLofts = lofts.filter(loft => 
      assignedLoftIds.includes(loft.id)
    );
    
    // Sanitize loft data to remove financial and sensitive information
    const sanitizedLofts = accessibleLofts.map(loft => 
      this.sanitizeLoftForMember(loft)
    );

    return {
      data: sanitizedLofts,
      filteredCount: totalCount - sanitizedLofts.length,
      totalCount,
      hasSecurityFiltering: sanitizedLofts.length < totalCount
    };
  }

  /**
   * Filter financial data based on user role
   */
  static filterFinancialData<T extends Record<string, any>>(
    financialData: T[], 
    config: FilterConfig
  ): FilterResult<T> {
    const { userRole } = config;
    const totalCount = financialData.length;
    let filteredData: T[] = [];
    let hasSecurityFiltering = false;

    switch (userRole) {
      case 'admin':
      case 'manager':
      case 'executive':
        // Full access to financial data
        filteredData = financialData;
        break;

      case 'member':
      case 'guest':
      default:
        // No financial data access for members and guests
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;
    }

    return {
      data: filteredData,
      filteredCount: totalCount - filteredData.length,
      totalCount,
      hasSecurityFiltering
    };
  }

  /**
   * Filter transactions based on user role and loft access
   */
  static filterTransactions(transactions: Transaction[], config: FilterConfig): FilterResult<Transaction> {
    const { userRole, assignedLoftIds = [] } = config;
    const totalCount = transactions.length;
    let filteredData: Transaction[] = [];
    let hasSecurityFiltering = false;

    switch (userRole) {
      case 'admin':
      case 'manager':
      case 'executive':
        // Full access to all transactions
        filteredData = transactions;
        break;

      case 'member':
        // Members cannot see any financial transactions
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;

      case 'guest':
      default:
        // No transaction access for guests
        filteredData = [];
        hasSecurityFiltering = totalCount > 0;
        break;
    }

    return {
      data: filteredData,
      filteredCount: totalCount - filteredData.length,
      totalCount,
      hasSecurityFiltering
    };
  }

  /**
   * Remove sensitive fields from loft data for member role
   */
  static sanitizeLoftForMember(loft: Loft | LoftWithRelations): Partial<Loft | LoftWithRelations> {
    const {
      // Keep operational fields
      id,
      name,
      address,
      description,
      status,
      zone_area_id,
      phone_number,
      internet_connection_type_id,
      // Remove financial fields
      price_per_month: _price,
      company_percentage: _company,
      owner_percentage: _owner,
      owner_id: _ownerId,
      // Remove utility details (sensitive)
      water_customer_code: _water1,
      water_contract_code: _water2,
      water_meter_number: _water3,
      water_correspondent: _water4,
      electricity_pdl_ref: _elec1,
      electricity_customer_number: _elec2,
      electricity_meter_number: _elec3,
      electricity_correspondent: _elec4,
      gas_pdl_ref: _gas1,
      gas_customer_number: _gas2,
      gas_meter_number: _gas3,
      gas_correspondent: _gas4,
      // Remove payment schedules (financial)
      frequence_paiement_eau: _freq1,
      prochaine_echeance_eau: _ech1,
      frequence_paiement_energie: _freq2,
      prochaine_echeance_energie: _ech2,
      frequence_paiement_telephone: _freq3,
      prochaine_echeance_telephone: _ech3,
      frequence_paiement_internet: _freq4,
      prochaine_echeance_internet: _ech4,
      frequence_paiement_tv: _freq5,
      prochaine_echeance_tv: _ech5,
      ...rest
    } = loft;

    // For LoftWithRelations, keep zone_area_name but remove owner_name for privacy
    const sanitized: Partial<Loft | LoftWithRelations> = {
      id,
      name,
      address,
      description,
      status,
      zone_area_id,
      phone_number,
      internet_connection_type_id
    };

    // Add zone_area_name if it exists (from LoftWithRelations)
    if ('zone_area_name' in loft && loft.zone_area_name) {
      (sanitized as any).zone_area_name = loft.zone_area_name;
    }

    return sanitized;
  }

  /**
   * Create MemberLoftView from sanitized loft data
   */
  static createMemberLoftView(
    loft: Loft | LoftWithRelations, 
    assignedTasksCount: number = 0
  ): import('@/lib/types/member-views').MemberLoftView {
    const sanitized = this.sanitizeLoftForMember(loft);
    
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
   * Get lofts with active tasks for a member
   */
  static getLoftsWithActiveTasks(
    lofts: Loft[] | LoftWithRelations[], 
    userId: string, 
    tasks: Task[]
  ): import('@/lib/types/member-views').MemberLoftView[] {
    const assignedLoftIds = this.getAssignedLoftIds(userId, tasks);
    
    return lofts
      .filter(loft => assignedLoftIds.includes(loft.id))
      .map(loft => {
        const loftTasks = tasks.filter(task => 
          task.loft_id === loft.id && 
          (task.assigned_to === userId || task.user_id === userId) &&
          task.status !== 'completed'
        );
        
        return this.createMemberLoftView(loft, loftTasks.length);
      });
  }

  /**
   * Get user's assigned loft IDs from their tasks
   */
  static getAssignedLoftIds(userId: string, tasks: Task[]): string[] {
    const assignedTasks = tasks.filter(task => 
      task.assigned_to === userId || task.user_id === userId
    );
    
    const loftIds = assignedTasks
      .map(task => task.loft_id)
      .filter((id): id is string => id !== null && id !== undefined);
    
    return [...new Set(loftIds)]; // Remove duplicates
  }

  /**
   * Comprehensive data filtering for dashboard data
   */
  static filterDashboardData(data: {
    tasks?: Task[];
    lofts?: Loft[];
    notifications?: Notification[];
    transactions?: Transaction[];
  }, config: FilterConfig) {
    const results = {
      tasks: data.tasks ? this.filterTasks(data.tasks, config) : null,
      lofts: data.lofts ? this.filterLofts(data.lofts, config) : null,
      notifications: data.notifications ? this.filterNotifications(data.notifications, config) : null,
      transactions: data.transactions ? this.filterTransactions(data.transactions, config) : null
    };

    // For members, sanitize loft data
    if (config.userRole === 'member' && results.lofts) {
      results.lofts.data = results.lofts.data.map(loft => 
        this.sanitizeLoftForMember(loft) as Loft
      );
    }

    return results;
  }

  /**
   * Check if user has permission to access specific data
   */
  static canAccessData(userRole: UserRole, dataType: string, action: string = 'read'): boolean {
    return PermissionValidator.hasPermission(userRole, dataType, action);
  }

  /**
   * Get security audit log for filtering operations
   */
  static getSecurityAuditLog(results: FilterResult<any>[], userRole: UserRole, userId?: string) {
    const totalFiltered = results.reduce((sum, result) => sum + result.filteredCount, 0);
    const hasAnyFiltering = results.some(result => result.hasSecurityFiltering);

    return {
      timestamp: new Date().toISOString(),
      userRole,
      userId,
      totalItemsFiltered: totalFiltered,
      hasSecurityFiltering: hasAnyFiltering,
      filterResults: results.map(result => ({
        totalCount: result.totalCount,
        filteredCount: result.filteredCount,
        hasSecurityFiltering: result.hasSecurityFiltering
      }))
    };
  }
}