"use client"

import { useTranslations } from "next-intl"
import ReportChartsWrapper from '@/components/reports/report-charts-wrapper'

interface LoftRevenue {
  name: string
  revenue: number
  expenses: number
  net_profit: number
}

interface ReportsWrapperProps {
  loftRevenue: LoftRevenue[]
  monthlyRevenue: any[]
}

export function ReportsWrapper({ loftRevenue, monthlyRevenue }: ReportsWrapperProps) {
  const t = useTranslations("analytics");

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          {t('realTimeDataBadge')}
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t('title')}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <ReportChartsWrapper loftRevenue={loftRevenue} monthlyRevenue={monthlyRevenue} />
    </div>
  )
}