'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Home, TrendingUp, Clock } from 'lucide-react'

interface QuickStatsProps {
  data: any[]
  isLoading: boolean
}

export function QuickStats({ data, isLoading }: QuickStatsProps) {
  const t = useTranslations('availability')

  // Calculate stats from data
  const stats = {
    totalLofts: data.length,
    availableLofts: data.filter(loft => loft.status === 'available').length,
    occupiedLofts: data.filter(loft => loft.status === 'occupied').length,
    maintenanceLofts: data.filter(loft => loft.status === 'maintenance').length,
    averagePrice: data.length > 0 ? Math.round(data.reduce((sum, loft) => sum + loft.pricePerNight, 0) / data.length) : 0,
    occupancyRate: data.length > 0 ? Math.round((data.filter(loft => loft.status === 'occupied').length / data.length) * 100) : 0
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      {/* Total Lofts */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t('totalLofts')}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalLofts}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Lofts */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {t('availableLofts')}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.availableLofts}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occupied Lofts */}
      <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {t('occupiedLofts')}
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.occupiedLofts}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-full">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Lofts */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {t('maintenanceLofts')}
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.maintenanceLofts}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-800/30 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Price */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {t('averagePrice')}
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.averagePrice.toLocaleString()} DA
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occupancy Rate */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200/50 dark:border-teal-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                {t('occupancyRate')}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {stats.occupancyRate}%
                </p>
                <Badge 
                  variant={stats.occupancyRate > 70 ? "default" : stats.occupancyRate > 40 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {stats.occupancyRate > 70 ? t('high') : 
                   stats.occupancyRate > 40 ? t('medium') : 
                   t('low')}
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-800/30 rounded-full">
              <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}