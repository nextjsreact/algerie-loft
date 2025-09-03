'use client'

import { ReportGenerator } from '@/components/reports/report-generator'
import { ReportsWrapper } from '@/components/reports/reports-wrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, BarChart3, TrendingUp, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Mock data - replace with real data from your API
const mockLoftRevenue = [
  { name: "Loft Artistique Hydra", revenue: 45000, expenses: 12000, net_profit: 33000 },
  { name: "Loft Moderne Centre-Ville", revenue: 38000, expenses: 15000, net_profit: 23000 },
  { name: "Loft Industriel Kouba", revenue: 42000, expenses: 18000, net_profit: 24000 },
  { name: "Loft Luxueux Alger", revenue: 55000, expenses: 20000, net_profit: 35000 },
  { name: "Loft Cosy Bab Ezzouar", revenue: 35000, expenses: 10000, net_profit: 25000 }
]

const mockMonthlyRevenue = [
  { month: "Jan", revenue: 215000, expenses: 75000 },
  { month: "Fév", revenue: 198000, expenses: 68000 },
  { month: "Mar", revenue: 225000, expenses: 82000 },
  { month: "Avr", revenue: 242000, expenses: 89000 },
  { month: "Mai", revenue: 258000, expenses: 95000 },
  { month: "Jun", revenue: 235000, expenses: 78000 }
]

export default function ReportsPage() {
  const t = useTranslations()

  return (
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

          <Tabs defaultValue="analytics" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <BarChart3 className="h-5 w-5" />
                {t('reports.analyticsTab')}
              </TabsTrigger>
              <TabsTrigger 
                value="generator" 
                className="flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <FileText className="h-5 w-5" />
                {t('reports.pdfTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <ReportsWrapper 
                  loftRevenue={mockLoftRevenue} 
                  monthlyRevenue={mockMonthlyRevenue} 
                />
              </div>
            </TabsContent>

            <TabsContent value="generator" className="space-y-8">
              <div className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
                <ReportGenerator />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

