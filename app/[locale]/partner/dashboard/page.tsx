'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PartnerLayout } from '@/components/partner/partner-layout'
import { DashboardHeader } from '@/components/partner/dashboard-header'
import { QuickActions } from '@/components/partner/quick-actions'
import { PropertiesOverview } from '@/components/partner/properties-overview'
import { RecentBookingsSection } from '@/components/partner/recent-bookings-section'
import { DashboardPageSkeleton } from '@/components/partner/dashboard-skeletons'
import { FullPageErrorDisplay, useErrorHandler } from '@/components/partner/dashboard-error-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, DollarSign, TrendingUp, Plus } from 'lucide-react'

interface PartnerStats {
  total_properties: number
  active_properties: number
  total_bookings: number
  upcoming_bookings: number
  monthly_earnings: number
  occupancy_rate: number
  average_rating: number
  total_reviews: number
}

interface PropertySummary {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance'
  price_per_night: number
  bookings_count: number
  earnings_this_month: number
  occupancy_rate: number
  average_rating: number
  next_booking?: {
    check_in: string
    check_out: string
    client_name: string
  }
}

interface RecentBooking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  client_name: string
  loft_name: string
}

interface PartnerDashboardPageProps {
  params: Promise<{
    locale: string
  }>
}

export default function PartnerDashboardPage({ params }: PartnerDashboardPageProps) {
  // Unwrap params Promise for Next.js 15
  const { locale } = use(params)
  
  const router = useRouter()
  const t = useTranslations('partner.dashboard')
  const { error, handleError, clearError, getErrorType } = useErrorHandler()
  const [stats, setStats] = useState<PartnerStats>({
    total_properties: 0,
    active_properties: 0,
    total_bookings: 0,
    upcoming_bookings: 0,
    monthly_earnings: 0,
    occupancy_rate: 0,
    average_rating: 0,
    total_reviews: 0
  })
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerStatus, setPartnerStatus] = useState<'pending' | 'verified' | 'rejected' | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<{ userName?: string; submittedDate?: string }>({})

  const checkPartnerStatus = async () => {
    try {
      const response = await fetch('/api/partner/status')
      if (response.ok) {
        const data = await response.json()
        setPartnerStatus(data.verification_status)
        setPartnerInfo({
          userName: data.business_name,
          submittedDate: data.created_at
        })
        return data.verification_status
      }
    } catch (error) {
      console.error('Failed to check partner status:', error)
    }
    return null
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      clearError()
      
      // Import the efficient data fetching utility
      const { fetchDashboardData: fetchData, getErrorType: getErrType } = await import('@/lib/partner/data-fetching')
      
      // Fetch all data in parallel with retry logic and timeout handling
      const results = await fetchData({
        timeout: 10000, // 10 second timeout
        retries: 2, // Retry up to 2 times
        retryDelay: 1000, // Start with 1 second delay
      })
      
      // Handle stats result
      if (results.stats.error) {
        if (results.stats.status === 401 || results.stats.status === 403) {
          handleError('unauthorized')
          return
        }
        const errorType = getErrType(results.stats.error)
        if (errorType === 'network' || errorType === 'timeout') {
          handleError(errorType)
          return
        }
        console.log('Stats API error:', results.stats.error)
      } else if (results.stats.data) {
        setStats(results.stats.data)
      }
      
      // Handle properties result
      if (results.properties.error) {
        console.log('Properties API error:', results.properties.error)
      } else if (results.properties.data) {
        setProperties(results.properties.data.properties || [])
      }
      
      // Handle bookings result
      if (results.bookings.error) {
        console.log('Bookings API error:', results.bookings.error)
      } else if (results.bookings.data) {
        setRecentBookings(results.bookings.data.bookings || [])
      }
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      const { getErrorType: getErrType } = await import('@/lib/partner/data-fetching')
      const errorType = getErrType(err)
      handleError(errorType, err instanceof Error ? err.message : undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initDashboard = async () => {
      const status = await checkPartnerStatus()
      if (status === 'verified') {
        await fetchDashboardData()
      } else {
        setLoading(false)
      }
    }
    initDashboard()
  }, [])

  if (loading) {
    return (
      <PartnerLayout locale={locale}>
        <DashboardPageSkeleton />
      </PartnerLayout>
    )
  }

  // Show pending status view if partner is not yet verified
  if (partnerStatus === 'pending') {
    const { PendingStatusView } = require('@/components/partner/pending-status-view')
    return <PendingStatusView locale={locale} userName={partnerInfo.userName} submittedDate={partnerInfo.submittedDate} />
  }

  // Show rejected message if partner was rejected
  if (partnerStatus === 'rejected') {
    return (
      <PartnerLayout locale={locale}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Demande refusée</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Malheureusement, votre demande de partenariat n'a pas été approuvée. Pour plus d'informations, veuillez contacter notre équipe.</p>
            </CardContent>
          </Card>
        </div>
      </PartnerLayout>
    )
  }

  if (error) {
    return (
      <PartnerLayout locale={params.locale}>
        <FullPageErrorDisplay
          type={error.type}
          message={error.message}
          onRetry={fetchDashboardData}
          showContactSupport={true}
        />
      </PartnerLayout>
    )
  }

  return (
    <PartnerLayout locale={locale}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardHeader 
          title={t('title')} 
          subtitle={t('subtitle')}
        />
        {/* Stats Cards - Responsive grid with better mobile layout */}
        <section 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8"
          aria-label="Dashboard statistics"
        >
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalProperties')}
                </h2>
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${stats.total_properties} total properties`}>
                {stats.total_properties}
              </p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                {t('stats.activeProperties', { count: stats.active_properties })}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.bookings')}
                </h2>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${stats.total_bookings} total bookings`}>
                {stats.total_bookings}
              </p>
              <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1">
                {t('stats.upcomingBookings', { count: stats.upcoming_bookings })}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.monthlyRevenue')}
                </h2>
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${stats.monthly_earnings} euros monthly revenue`}>
                {stats.monthly_earnings}€
              </p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1" aria-label={`Increase of ${Math.round(stats.monthly_earnings * 0.15)} euros`}>
                +{Math.round(stats.monthly_earnings * 0.15)}€
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.occupancyRate')}
                </h2>
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${Math.round(stats.occupancy_rate)} percent occupancy rate`}>
                {Math.round(stats.occupancy_rate)}%
              </p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                {t('stats.excellentRate')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.averageRating')}
                </h2>
                <span className="text-xl sm:text-2xl" aria-hidden="true">⭐</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100" aria-label={`${stats.average_rating.toFixed(1)} average rating out of 5`}>
                {stats.average_rating.toFixed(1)}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('stats.totalReviews', { count: stats.total_reviews })}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <QuickActions locale={locale} />

        {/* Properties and Bookings - Responsive grid layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Properties Overview - Takes 2 columns on xl screens */}
          <PropertiesOverview 
            properties={properties} 
            locale={params.locale}
            limit={3}
          />

          {/* Recent Bookings - Takes 1 column on xl screens */}
          <RecentBookingsSection 
            bookings={recentBookings}
            locale={locale}
            loading={false}
          />
        </div>
      </div>
    </PartnerLayout>
  )
}