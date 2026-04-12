'use client'

import { ReportGenerator } from '@/components/reports/report-generator'
import { ReportsWrapper } from '@/components/reports/reports-wrapper'
import { PartnerDueReport } from '@/components/reports/partner-due-report'
import { FinancialSummaryReport } from '@/components/reports/financial-summary-report'
import { CurrencyReport } from '@/components/reports/currency-report'
import { RecouvrementReport } from '@/components/reports/recouvrement-report'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, BarChart3, TrendingUp, Sparkles, Users, PieChart, Coins, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RoleBasedAccess } from '@/components/auth/role-based-access'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth'
import { getReportsData } from '@/app/actions/reports'
import type { AuthSession } from '@/lib/types'

interface LoftRevenue {
  name: string
  revenue: number
  expenses: number
  net_profit: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
}

export default function ReportsPage() {
  const t = useTranslations()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [loftRevenue, setLoftRevenue] = useState<LoftRevenue[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
        
        if (sessionData) {
          // Fetch real data from database
          const reportsData = await getReportsData()
          setLoftRevenue(reportsData.loftRevenue)
          setMonthlyRevenue(reportsData.monthlyRevenue)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to access reports.</div>
      </div>
    )
  }

  return (
    <RoleBasedAccess 
      userRole={session.user.role}
      allowedRoles={['admin', 'manager', 'executive']}
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 p-8">
          <div className="container mx-auto">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Access Restricted</h3>
                  <p className="text-red-700 mt-2">
                    Financial reports are only available to administrators, managers, and executives. 
                    Your current role ({session.user.role}) does not have permission to view this content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      <div className="container mx-auto py-8">
        <div className="space-y-8">
          {/* Header avec design amélioré */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{t('reports.pageTitle')}</h1>
                  <p className="text-blue-100 text-lg mt-2">
                    {t('reports.subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <TrendingUp className="h-4 w-4" />
                <span>{t('reports.featuresText')}</span>
              </div>
            </div>
            {/* Éléments décoratifs */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5"></div>
          </div>

          <Tabs defaultValue={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab') || "analytics"} className="space-y-8">
            <TabsList className="grid w-full grid-cols-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg rounded-xl p-1">
              <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <BarChart3 className="h-4 w-4" />{t('reports.analyticsTab')}
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <PieChart className="h-4 w-4" />Financier
              </TabsTrigger>
              <TabsTrigger value="currency" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <Coins className="h-4 w-4" />Par devise
              </TabsTrigger>
              <TabsTrigger value="recouvrement" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <AlertCircle className="h-4 w-4" />Recouvrement
              </TabsTrigger>
              <TabsTrigger value="partner" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <Users className="h-4 w-4" />{t('reports.partnerTab')}
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <FileText className="h-4 w-4" />{t('reports.pdfTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                {loftRevenue.length === 0 && monthlyRevenue.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">{t('reports.noDataAvailable')}</p>
                    <p className="text-gray-400 text-sm mt-2">{t('reports.addTransactionsToSeeReports')}</p>
                  </div>
                ) : (
                  <ReportsWrapper 
                    loftRevenue={loftRevenue} 
                    monthlyRevenue={monthlyRevenue} 
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="generator" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <ReportGenerator />
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <FinancialSummaryReport />
              </div>
            </TabsContent>

            <TabsContent value="currency" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <CurrencyReport />
              </div>
            </TabsContent>

            <TabsContent value="recouvrement" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <RecouvrementReport />
              </div>
            </TabsContent>

            <TabsContent value="partner" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <PartnerDueReport />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </RoleBasedAccess>
  )
}

