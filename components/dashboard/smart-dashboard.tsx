"use client";

import React from 'react';
import { UserRole } from '@/lib/types';
import { DataFilterService, FilterConfig } from '@/lib/services/data-filter';
import { MemberDashboardData, MemberDataTransformers } from '@/lib/types/member-views';
import { usePermissions } from '@/hooks/use-permissions';
import { MemberDashboard } from './member-dashboard';
import { DashboardWrapper, DashboardError } from './dashboard-wrapper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';

/**
 * Props for the SmartDashboard component
 */
export interface SmartDashboardProps {
  /** Current user information */
  user: {
    id: string;
    role: UserRole;
    name?: string;
    email?: string;
  };
  /** Raw dashboard data before filtering */
  data: {
    tasks?: any[];
    lofts?: any[];
    notifications?: any[];
    transactions?: any[];
    stats?: any;
    recentTasks?: any[];
    monthlyRevenue?: any[];
  };
  /** Any errors that occurred during data loading */
  errors?: string[];
  /** Loading state */
  isLoading?: boolean;
}

/**
 * SmartDashboard component that automatically routes to the appropriate dashboard
 * based on user role and applies proper data filtering for security
 */
export function SmartDashboard({
  user,
  data,
  errors = [],
  isLoading = false
}: SmartDashboardProps) {
  const permissions = usePermissions(user.role);

  // Create filter configuration
  const filterConfig: FilterConfig = React.useMemo(() => ({
    userRole: user.role,
    userId: user.id,
    assignedLoftIds: [], // Will be populated from tasks
    teamIds: [] // Could be extended for team-based permissions
  }), [user.role, user.id]);

  // Filter and transform data based on user role
  const { filteredData, securityInfo } = React.useMemo(() => {
    if (!data || isLoading) {
      return { 
        filteredData: null, 
        securityInfo: { hasFiltering: false, filteredCount: 0 } 
      };
    }

    try {
      // Get assigned loft IDs for member role
      let assignedLoftIds: string[] = [];
      if (user.role === 'member' && data.tasks) {
        assignedLoftIds = DataFilterService.getAssignedLoftIds(user.id, data.tasks);
      }

      // Update filter config with assigned loft IDs
      const updatedConfig: FilterConfig = {
        ...filterConfig,
        assignedLoftIds
      };

      // Apply comprehensive data filtering
      const filterResults = DataFilterService.filterDashboardData(data, updatedConfig);

      // Calculate security info
      const totalFiltered = Object.values(filterResults)
        .filter(result => result !== null)
        .reduce((sum, result) => sum + result!.filteredCount, 0);

      const hasFiltering = Object.values(filterResults)
        .some(result => result?.hasSecurityFiltering);

      return {
        filteredData: {
          tasks: filterResults.tasks?.data || [],
          lofts: filterResults.lofts?.data || [],
          notifications: filterResults.notifications?.data || [],
          transactions: filterResults.transactions?.data || [],
          stats: data.stats,
          recentTasks: filterResults.tasks?.data?.slice(0, 10) || [],
          monthlyRevenue: user.role === 'member' ? [] : (data.monthlyRevenue || [])
        },
        securityInfo: {
          hasFiltering,
          filteredCount: totalFiltered
        }
      };
    } catch (error) {
      console.error('Error filtering dashboard data:', error);
      return { 
        filteredData: null, 
        securityInfo: { hasFiltering: false, filteredCount: 0 } 
      };
    }
  }, [data, user.role, user.id, filterConfig, isLoading]);

  // Handle loading state
  if (isLoading) {
    return <DashboardLoadingSkeleton userRole={user.role} />;
  }

  // Handle data filtering errors
  if (!filteredData) {
    return (
      <DashboardError userRole={user.role} />
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'member':
      return (
        <MemberDashboardContainer
          user={user}
          data={filteredData}
          errors={errors}
          securityInfo={securityInfo}
        />
      );

    case 'admin':
    case 'manager':
    case 'executive':
      return (
        <AdminDashboardContainer
          user={user}
          data={filteredData}
          errors={errors}
          securityInfo={securityInfo}
        />
      );

    case 'guest':
    default:
      return <GuestDashboard user={user} />;
  }
}

/**
 * Container for member dashboard with enhanced security filtering
 */
interface DashboardContainerProps {
  user: SmartDashboardProps['user'];
  data: any;
  errors: string[];
  securityInfo: {
    hasFiltering: boolean;
    filteredCount: number;
  };
}

function MemberDashboardContainer({ 
  user, 
  data, 
  errors, 
  securityInfo 
}: DashboardContainerProps) {
  // Transform data to member-specific format
  const memberData: MemberDashboardData = React.useMemo(() => {
    const transformedTasks = data.tasks?.map((task: any) => 
      MemberDataTransformers.transformTask(task, user.id)
    ) || [];

    const transformedNotifications = data.notifications?.map((notification: any) =>
      MemberDataTransformers.transformNotification(notification)
    ).filter((notification: any) => notification.isTaskRelated) || [];

    // Calculate task counts for assigned lofts
    const loftTaskCounts = transformedTasks.reduce((acc: Record<string, number>, task: any) => {
      if (task.loft_id) {
        acc[task.loft_id] = (acc[task.loft_id] || 0) + 1;
      }
      return acc;
    }, {});

    const transformedLofts = data.lofts?.map((loft: any) =>
      MemberDataTransformers.transformLoft(loft, loftTaskCounts[loft.id] || 0)
    ) || [];

    return {
      tasks: {
        all: transformedTasks,
        assigned: transformedTasks.filter((task: any) => task.isAssignedToMe),
        created: transformedTasks.filter((task: any) => task.isCreatedByMe),
        overdue: transformedTasks.filter((task: any) => task.priority === 'urgent' && task.daysUntilDue !== null && task.daysUntilDue < 0),
        dueToday: transformedTasks.filter((task: any) => task.daysUntilDue === 0),
        dueThisWeek: transformedTasks.filter((task: any) => task.daysUntilDue !== null && task.daysUntilDue >= 0 && task.daysUntilDue <= 7),
        completed: transformedTasks.filter((task: any) => task.status === 'completed')
      },
      lofts: {
        accessible: transformedLofts,
        withActiveTasks: transformedLofts.filter((loft: any) => loft.hasActiveTasks),
        needingMaintenance: transformedLofts.filter((loft: any) => loft.status === 'maintenance')
      },
      notifications: {
        all: transformedNotifications,
        unread: transformedNotifications.filter((n: any) => !n.is_read),
        highPriority: transformedNotifications.filter((n: any) => n.priority === 'high'),
        recent: transformedNotifications.filter((n: any) => {
          const daysDiff = Math.floor((Date.now() - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        })
      },
      stats: {
        totalAssignedTasks: transformedTasks.filter((task: any) => task.isAssignedToMe).length,
        completedThisMonth: transformedTasks.filter((task: any) => {
          if (task.status !== 'completed') return false;
          const completedDate = new Date(task.updated_at || task.created_at);
          const now = new Date();
          return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
        }).length,
        overdueTasks: transformedTasks.filter((task: any) => task.priority === 'urgent' && task.daysUntilDue !== null && task.daysUntilDue < 0).length,
        activeLofts: transformedLofts.filter((loft: any) => loft.hasActiveTasks).length,
        unreadNotifications: transformedNotifications.filter((n: any) => !n.is_read).length,
        tasksDueToday: transformedTasks.filter((task: any) => task.daysUntilDue === 0).length,
        tasksDueThisWeek: transformedTasks.filter((task: any) => task.daysUntilDue !== null && task.daysUntilDue >= 0 && task.daysUntilDue <= 7).length
      },
      member: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        lastLogin: new Date().toISOString(),
        memberSince: new Date().toISOString() // This should come from user data
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        hasSecurityFiltering: securityInfo.hasFiltering,
        filteredItemsCount: securityInfo.filteredCount,
        permissions: {
          canViewFinancialData: false,
          canViewAllTasks: false,
          canViewAllLofts: false,
          canViewAllNotifications: false
        }
      }
    };
  }, [data, user, securityInfo]);

  return (
    <div className="p-4 md:p-8">
      {/* Security notice for members */}
      {securityInfo.hasFiltering && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your dashboard shows only information relevant to your assigned tasks. 
            {securityInfo.filteredCount > 0 && ` ${securityInfo.filteredCount} items were filtered for security.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Display errors if any */}
      {errors.length > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some data could not be loaded: {errors.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <MemberDashboard
        userTasks={memberData.tasks.all}
        userName={user.name || 'Member'}
        userRole={user.role}
      />
    </div>
  );
}

/**
 * Container for admin/manager/executive dashboard
 */
function AdminDashboardContainer({ 
  user, 
  data, 
  errors, 
  securityInfo 
}: DashboardContainerProps) {
  return (
    <>
      {/* Security info for admins (optional) */}
      {securityInfo.hasFiltering && user.role !== 'admin' && (
        <Alert className="m-4 border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Some data has been filtered based on your role permissions.
          </AlertDescription>
        </Alert>
      )}

      <DashboardWrapper
        userRole={user.role}
        userName={user.name || 'User'}
        stats={data.stats}
        recentTasks={data.recentTasks}
        monthlyRevenue={data.monthlyRevenue}
        userTasks={data.tasks}
        errors={errors}
      />
    </>
  );
}

/**
 * Simple dashboard for guest users
 */
function GuestDashboard({ user }: { user: SmartDashboardProps['user'] }) {
  return (
    <div className="p-4 md:p-8">
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Guest</h2>
        <p className="text-gray-600 mb-6">
          You have limited access to the system. Please contact an administrator for full access.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="font-semibold text-gray-900 mb-2">Available Actions</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• View public information</li>
            <li>• Contact support</li>
            <li>• Request access upgrade</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for dashboard
 */
function DashboardLoadingSkeleton({ userRole }: { userRole: UserRole }) {
  return (
    <div className="p-4 md:p-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        {userRole === 'member' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4 bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="lg:col-span-3 bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}