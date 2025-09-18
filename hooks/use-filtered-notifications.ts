'use client'

import { useMemo } from 'react';
import { Notification, UserRole } from '@/lib/types';
import { DataFilterService, FilterConfig } from '@/lib/services/data-filter';
import { NotificationFilterService } from '@/lib/services/notification-filter';
import { usePermissions } from './use-permissions';

/**
 * Configuration for notification filtering
 */
export interface NotificationFilterConfig {
  userRole: UserRole;
  userId: string;
  assignedTaskIds?: string[];
  showOnlyUnread?: boolean;
  priorityFilter?: 'high' | 'medium' | 'low' | 'all';
}

/**
 * Return type for the useFilteredNotifications hook
 */
export interface UseFilteredNotificationsReturn {
  /**
   * Filtered notifications based on user role and permissions
   */
  filteredNotifications: Notification[];
  
  /**
   * Statistics about the filtered notifications
   */
  stats: {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: { high: number; medium: number; low: number };
  };
  
  /**
   * Check if a specific notification should be visible to the user
   */
  isNotificationVisible: (notification: Notification) => boolean;
  
  /**
   * Get the priority of a notification for the current user role
   */
  getNotificationPriority: (notification: Notification) => 'high' | 'medium' | 'low';
  
  /**
   * Filter notifications by type
   */
  filterByType: (types: string[]) => Notification[];
  
  /**
   * Filter notifications by priority
   */
  filterByPriority: (priority: 'high' | 'medium' | 'low') => Notification[];
  
  /**
   * Get fallback message when no notifications are available
   */
  getFallbackMessage: () => string;
}

/**
 * Custom hook for filtering notifications based on user role and permissions
 */
export function useFilteredNotifications(
  notifications: Notification[],
  config: NotificationFilterConfig
): UseFilteredNotificationsReturn {
  const { userRole, userId, assignedTaskIds = [], showOnlyUnread = false, priorityFilter = 'all' } = config;
  const permissions = usePermissions(userRole);

  const filteredData = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return {
        filtered: [],
        stats: { total: 0, unread: 0, byType: {}, byPriority: { high: 0, medium: 0, low: 0 } }
      };
    }

    // Create filter configuration
    const filterConfig: FilterConfig = {
      userRole,
      userId,
      assignedLoftIds: [], // Not needed for notifications
      teamIds: [] // Not needed for notifications
    };

    // Apply role-based filtering with assignment relevance
    const roleFilterResult = DataFilterService.filterNotificationsWithAssignments(
      notifications,
      filterConfig,
      assignedTaskIds
    );

    let filtered = roleFilterResult.data;

    // Apply additional filters
    if (showOnlyUnread) {
      filtered = filtered.filter(notification => !notification.is_read);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notification => 
        NotificationFilterService.getNotificationPriority(notification, userRole) === priorityFilter
      );
    }

    // Get statistics
    const stats = NotificationFilterService.getNotificationStats(filtered, userRole);

    return { filtered, stats };
  }, [notifications, userRole, userId, assignedTaskIds, showOnlyUnread, priorityFilter]);

  const isNotificationVisible = useMemo(() => {
    return (notification: Notification): boolean => {
      return DataFilterService.validateNotificationAccess(notification, userRole, userId);
    };
  }, [userRole, userId]);

  const getNotificationPriority = useMemo(() => {
    return (notification: Notification): 'high' | 'medium' | 'low' => {
      return NotificationFilterService.getNotificationPriority(notification, userRole);
    };
  }, [userRole]);

  const filterByType = useMemo(() => {
    return (types: string[]): Notification[] => {
      return filteredData.filtered.filter(notification => 
        types.includes(notification.type)
      );
    };
  }, [filteredData.filtered]);

  const filterByPriority = useMemo(() => {
    return (priority: 'high' | 'medium' | 'low'): Notification[] => {
      return filteredData.filtered.filter(notification => 
        NotificationFilterService.getNotificationPriority(notification, userRole) === priority
      );
    };
  }, [filteredData.filtered, userRole]);

  const getFallbackMessage = useMemo(() => {
    return (): string => {
      switch (userRole) {
        case 'member':
          return 'No task-related notifications at this time. You\'ll be notified when tasks are assigned to you or when there are updates on your tasks.';
        case 'executive':
          return 'No executive alerts or reports available. You\'ll receive notifications about critical system events and performance reports.';
        case 'admin':
        case 'manager':
          return 'No notifications at this time. You\'ll receive updates about system events, tasks, and administrative activities.';
        case 'guest':
        default:
          return 'No notifications available.';
      }
    };
  }, [userRole]);

  return {
    filteredNotifications: filteredData.filtered,
    stats: filteredData.stats,
    isNotificationVisible,
    getNotificationPriority,
    filterByType,
    filterByPriority,
    getFallbackMessage
  };
}

/**
 * Hook for getting notification type labels based on user role
 */
export function useNotificationTypeLabels(userRole: UserRole) {
  return useMemo(() => {
    const baseLabels = {
      info: 'Information',
      success: 'Success',
      warning: 'Warning',
      error: 'Error'
    };

    switch (userRole) {
      case 'member':
        return {
          ...baseLabels,
          task_assigned: 'Task Assigned',
          task_updated: 'Task Updated',
          task_completed: 'Task Completed',
          task_overdue: 'Task Overdue',
          newTaskAssigned: 'New Task'
        };

      case 'executive':
        return {
          ...baseLabels,
          critical_alert: 'Critical Alert',
          financial_alert: 'Financial Alert',
          performance_report: 'Performance Report',
          monthly_summary: 'Monthly Summary'
        };

      case 'admin':
      case 'manager':
        return {
          ...baseLabels,
          task_assigned: 'Task Assigned',
          task_updated: 'Task Updated',
          bill_paid: 'Bill Paid',
          bill_overdue: 'Bill Overdue',
          system_alert: 'System Alert',
          user_registered: 'User Registered'
        };

      default:
        return baseLabels;
    }
  }, [userRole]);
}