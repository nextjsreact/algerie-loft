"use client"

import { useTranslation } from "@/lib/i18n/context"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { BillAlerts } from "@/components/dashboard/bill-alerts-original"
import { BillMonitoringStats } from "@/components/dashboard/bill-monitoring-stats"
import { MemberDashboard } from "@/components/dashboard/member-dashboard"
import { SmartDashboard } from "@/components/dashboard/smart-dashboard"
import { RoleBasedAccess } from "@/components/auth/role-based-access"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Shield } from "lucide-react"
import { UserRole } from "@/lib/types"

interface DashboardWrapperProps {
  userRole: string
  userName: string
  userId?: string
  stats?: any
  recentTasks?: any[]
  monthlyRevenue?: any[]
  userTasks?: any[]
  errors?: string[]
  /** Whether to use the new SmartDashboard (recommended) */
  useSmartDashboard?: boolean
  /** Additional data for SmartDashboard */
  lofts?: any[]
  notifications?: any[]
  transactions?: any[]
}

export function DashboardWrapper({
  userRole,
  userName,
  userId,
  stats,
  recentTasks,
  monthlyRevenue,
  userTasks,
  errors = [],
  useSmartDashboard = true,
  lofts,
  notifications,
  transactions
}: DashboardWrapperProps) {
  const t = useTranslations("dashboard");

  // Use SmartDashboard for enhanced security and role-based routing
  if (useSmartDashboard && userId) {
    return (
      <SmartDashboard
        user={{
          id: userId,
          role: userRole as UserRole,
          name: userName
        }}
        data={{
          tasks: userTasks,
          lofts,
          notifications,
          transactions,
          stats,
          recentTasks,
          monthlyRevenue
        }}
        errors={errors}
      />
    );
  }

  // Legacy dashboard implementation with role-based access controls
  if (userRole === 'member') {
    return (
      <div className="p-4 md:p-8">
        {/* Security notice for legacy member dashboard */}
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You are using the legacy dashboard. For enhanced security, please ask your administrator to enable the new dashboard.
          </AlertDescription>
        </Alert>

        <MemberDashboard
          userTasks={userTasks || []}
          userName={userName}
          userRole={userRole}
          userId={userId}
          showSecurityInfo={true}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')} - {t('dashboard.welcomeBack', { name: userName })}
          </p>
        </div>

        {errors.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('dashboard.someDataError')}: {errors.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Role-based access control for stats */}
        <RoleBasedAccess 
          userRole={userRole as UserRole} 
          resource="dashboard-stats" 
          action="read"
          fallback={
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Statistics are not available for your role.
              </AlertDescription>
            </Alert>
          }
        >
          <StatsCards stats={stats} />
        </RoleBasedAccess>

        {/* Role-based access control for financial components */}
        <RoleBasedAccess 
          userRole={userRole as UserRole} 
          resource="financial" 
          action="read"
          fallback={
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Financial information is restricted for your role.
              </AlertDescription>
            </Alert>
          }
        >
          <div className="grid gap-6 md:grid-cols-2">
            <BillMonitoringStats />
            <div className="md:col-span-1">
              <BillAlerts />
            </div>
          </div>
        </RoleBasedAccess>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Role-based access control for revenue chart */}
          <RoleBasedAccess 
            userRole={userRole as UserRole} 
            resource="financial" 
            action="read"
            fallback={
              <div className="lg:col-span-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Revenue information is not available for your role.
                  </AlertDescription>
                </Alert>
              </div>
            }
          >
            <div className="lg:col-span-4">
              <RevenueChart monthlyRevenue={monthlyRevenue || []} />
            </div>
          </RoleBasedAccess>

          {/* Tasks are available to most roles */}
          <RoleBasedAccess 
            userRole={userRole as UserRole} 
            resource="tasks" 
            action="read"
            fallback={
              <div className="lg:col-span-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Task information is not available for your role.
                  </AlertDescription>
                </Alert>
              </div>
            }
          >
            <div className="lg:col-span-3">
              <RecentTasks tasks={recentTasks || []} />
            </div>
          </RoleBasedAccess>
        </div>
      </div>
    </div>
  )
}

export function DashboardError({ 
  userRole, 
  error,
  retry 
}: { 
  userRole: string;
  error?: string;
  retry?: () => void;
}) {
  const t = useTranslations("dashboard");

  const getErrorMessage = () => {
    switch (userRole) {
      case 'member':
        return t('dashboard.unableToLoadTasks');
      case 'admin':
      case 'manager':
        return t('dashboard.unableToLoadData');
      case 'executive':
        return 'Unable to load executive dashboard data';
      case 'guest':
        return 'Limited access - unable to load dashboard';
      default:
        return 'Unable to load dashboard data';
    }
  };

  const getErrorDescription = () => {
    switch (userRole) {
      case 'member':
        return 'Your assigned tasks and notifications could not be loaded. This may be due to a temporary connection issue.';
      case 'admin':
      case 'manager':
        return 'Dashboard data including statistics, tasks, and financial information could not be loaded.';
      case 'executive':
        return 'Executive reports and financial summaries are temporarily unavailable.';
      case 'guest':
        return 'You have limited access to the system. Please contact an administrator for assistance.';
      default:
        return 'Dashboard data could not be loaded at this time.';
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {userRole === 'member' ? t('dashboard.errorLoadingYour') : t('dashboard.errorLoadingData')}
          </p>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">{getErrorMessage()}</p>
              <p className="text-sm">{getErrorDescription()}</p>
              {error && (
                <p className="text-xs font-mono bg-red-100 p-2 rounded">
                  Error details: {error}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Role-specific error actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {retry && (
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          
          {userRole === 'guest' && (
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign In
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/help'}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Get Help
          </button>
        </div>

        {/* Role-based access information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">Access Level: {userRole}</span>
          </div>
          <p className="text-sm text-gray-600">
            {userRole === 'member' && 'You have access to your assigned tasks and related information only.'}
            {userRole === 'admin' && 'You have full administrative access to all system features.'}
            {userRole === 'manager' && 'You have access to operational data and team management features.'}
            {userRole === 'executive' && 'You have access to financial reports and executive summaries.'}
            {userRole === 'guest' && 'You have limited read-only access to public information.'}
          </p>
        </div>
      </div>
    </div>
  )
}