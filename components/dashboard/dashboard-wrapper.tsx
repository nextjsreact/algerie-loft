"use client"

import { useTranslation } from "@/lib/i18n/context"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentTasks } from "@/components/dashboard/recent-tasks"
import { BillAlerts } from "@/components/dashboard/bill-alerts-original"
import { BillMonitoringStats } from "@/components/dashboard/bill-monitoring-stats"
import { MemberDashboard } from "@/components/dashboard/member-dashboard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface DashboardWrapperProps {
  userRole: string
  userName: string
  stats?: any
  recentTasks?: any[]
  monthlyRevenue?: any[]
  userTasks?: any[]
  errors?: string[]
}

export function DashboardWrapper({
  userRole,
  userName,
  stats,
  recentTasks,
  monthlyRevenue,
  userTasks,
  errors = []
}: DashboardWrapperProps) {
  const t = useTranslations("dashboard");

  if (userRole === 'member') {
    return (
      <div className="p-4 md:p-8">
        <MemberDashboard
          userTasks={userTasks || []}
          userName={userName}
          userRole={userRole}
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

        <div>
          <StatsCards stats={stats} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <BillMonitoringStats />
          <div className="md:col-span-1">
            <BillAlerts />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RevenueChart monthlyRevenue={monthlyRevenue || []} />
          </div>
          <div className="lg:col-span-3">
            <RecentTasks tasks={recentTasks || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardError({ userRole }: { userRole: string }) {
  const t = useTranslations("dashboard");

  return (
    <div className="p-4 md:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {userRole === 'member' ? t('dashboard.errorLoadingYour') : t('dashboard.errorLoadingData')}
          </p>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {userRole === 'member'
              ? t('dashboard.unableToLoadTasks')
              : t('dashboard.unableToLoadData')
            }
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}