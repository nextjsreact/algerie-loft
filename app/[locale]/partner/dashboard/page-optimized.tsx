'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PartnerLayout } from '@/components/partner/partner-layout'
import { DashboardHeader } from '@/components/partner/dashboard-header'
import { QuickActions } from '@/components/partner/quick-actions'
import { PropertiesOverview } from '@/components/partner/properties-overview'
import { RecentBookingsSection } from '@/components/partner/recent-bookings-section'
import { DashboardPageSkeleton } from '@/components/partner/dashboard-skeletons'
import { FullPageErrorDisplay } from '@/components/partner/dashboard-error-display'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { useDashboardData } from '@/hooks/partner/use-dashboard-data'

interface PartnerDashboardPageProps {
  params: {
    locale: string
  }
}

export default function PartnerDashboardPage({ params }: PartnerDashboardPageProps) {
  const router = useRouter()
  const t = useTranslations('partner.dashboard')
  
  // Use SWR hook for data fetching with caching
  const { stats, properties, bookings, isLoading, isError, error, mutate } = useDashboardData()

  if (isLoading) {
    return (
      <PartnerLayout locale={params.locale}>
        <DashboardPageSkeleton />
      </PartnerLayout>
    )
  }

  if (isError) {
    const errorType = error?.message.includes('Unauthorized') 
      ? 'unauthorized' 
      : error?.message.includes('timeout')
      ? 'timeout'
      : error?.message.includes('network')
      ? 'network'
      : 'server'

    return (
      <PartnerLayout locale={params.locale}>
        <FullPageErrorDisplay
          type={errorType}
          message={error?.message}
          onRetry={mutate}
          showContactSupport={true}
        />
      </PartnerLayout>
    )
  }

  return (
    <PartnerLayout locale={params.locale}>
      <div className="container mx-auto p-6">
        <DashboardHeader 
          title={t('title')} 
          subtitle={t('subtitle')}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
            >
              {t('refresh', { defaultValue: 'Refresh' })}
            </Button>
          }
        />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalProperties')}
                </span>
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.total_properties || 0}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                {t('stats.activeProperties', { count: stats?.active_properties || 0 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.bookings')}
                </span>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.total_bookings || 0}
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                {t('stats.upcomingBookings', { count: stats?.upcoming_bookings || 0 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.monthlyRevenue')}
                </span>
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.monthly_earnings || 0}€
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                +{Math.round((stats?.monthly_earnings || 0) * 0.15)}€
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.occupancyRate')}
                </span>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(stats?.occupancy_rate || 0)}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                {t('stats.excellentRate')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.averageRating')}
                </span>
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(stats?.average_rating || 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('stats.totalReviews', { count: stats?.total_reviews || 0 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <QuickActions locale={params.locale} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Properties Overview */}
          <PropertiesOverview 
            properties={properties} 
            locale={params.locale}
            limit={3}
          />

          {/* Recent Bookings */}
          <RecentBookingsSection 
            bookings={bookings}
            locale={params.locale}
            loading={false}
          />
        </div>
      </div>
    </PartnerLayout>
  )
}
