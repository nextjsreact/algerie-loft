"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { PartnerEarningsChart } from './partner-earnings-chart'
import { PartnerBookingCalendar } from './partner-booking-calendar'
import { RecentBookings } from './recent-bookings'
import { PropertyPerformance } from './property-performance'

interface PartnerStats {
  totalProperties: number
  activeBookings: number
  monthlyEarnings: number
  occupancyRate: number
  pendingBookings: number
  completedBookings: number
  totalGuests: number
  averageRating: number
}

interface PartnerDashboardProps {
  userId: string
}

export function PartnerDashboard({ userId }: PartnerDashboardProps) {
  const [stats, setStats] = useState<PartnerStats>({
    totalProperties: 0,
    activeBookings: 0,
    monthlyEarnings: 0,
    occupancyRate: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalGuests: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch partner dashboard stats
      const response = await fetch('/api/partner/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        // Fallback to mock data if API fails
        setStats({
          totalProperties: 3,
          activeBookings: 8,
          monthlyEarnings: 45000,
          occupancyRate: 75,
          pendingBookings: 2,
          completedBookings: 15,
          totalGuests: 42,
          averageRating: 4.5
        })
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to mock data
      setStats({
        totalProperties: 3,
        activeBookings: 8,
        monthlyEarnings: 45000,
        occupancyRate: 75,
        pendingBookings: 2,
        completedBookings: 15,
        totalGuests: 42,
        averageRating: 4.5
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-8 px-4 md:px-0">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Manage your properties and track your performance
          </p>
          <div className="flex items-center justify-between">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your properties and track your performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mobile Stats Cards */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Building2 className="h-6 w-6 text-blue-200" />
                <p className="text-2xl font-bold">{stats.totalProperties}</p>
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium">Properties</p>
                <p className="text-blue-100 text-xs">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <DollarSign className="h-6 w-6 text-green-200" />
                <p className="text-lg font-bold">{formatCurrency(stats.monthlyEarnings)}</p>
              </div>
              <div>
                <p className="text-green-100 text-xs font-medium">Earnings</p>
                <p className="text-green-100 text-xs">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Calendar className="h-6 w-6 text-purple-200" />
                <p className="text-2xl font-bold">{stats.activeBookings}</p>
              </div>
              <div>
                <p className="text-purple-100 text-xs font-medium">Bookings</p>
                <p className="text-purple-100 text-xs">{stats.pendingBookings} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Users className="h-6 w-6 text-orange-200" />
                <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
              </div>
              <div>
                <p className="text-orange-100 text-xs font-medium">Occupancy</p>
                <p className="text-orange-100 text-xs">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Stats Cards */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Properties</p>
                <p className="text-3xl font-bold">{stats.totalProperties}</p>
                <p className="text-blue-100 text-xs mt-1">
                  Active listings
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Monthly Earnings</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.monthlyEarnings)}</p>
                <div className="flex items-center text-green-100 text-xs mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  This month
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Bookings</p>
                <p className="text-3xl font-bold">{stats.activeBookings}</p>
                <p className="text-purple-100 text-xs mt-1">
                  {stats.pendingBookings} pending
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Occupancy Rate</p>
                <p className="text-3xl font-bold">{stats.occupancyRate}%</p>
                <p className="text-orange-100 text-xs mt-1">
                  This month
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Performance Overview */}
      <div className="md:hidden">
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Performance</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stats.averageRating.toFixed(1)} ⭐
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs font-medium">Completed</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {stats.completedBookings}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs font-medium">Pending</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {stats.pendingBookings}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs font-medium">Guests</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {stats.totalGuests}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-xs font-medium">Rate</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {stats.occupancyRate}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Performance Overview */}
      <div className="hidden md:block">
        <Card className="border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Performance Overview</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {stats.averageRating.toFixed(1)} ⭐ Average Rating
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-xs text-gray-600">Bookings</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completedBookings}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-xs text-gray-600">Bookings</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingBookings}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-xs text-gray-600">Guests</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalGuests}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Occupancy</p>
                    <p className="text-xs text-gray-600">Rate</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.occupancyRate}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Charts and Calendar */}
      <div className="md:hidden space-y-4">
        <PartnerEarningsChart userId={userId} />
        <PartnerBookingCalendar userId={userId} />
      </div>

      {/* Desktop Charts and Calendar */}
      <div className="hidden md:grid gap-8 md:grid-cols-2">
        <PartnerEarningsChart userId={userId} />
        <PartnerBookingCalendar userId={userId} />
      </div>

      {/* Mobile Recent Activity */}
      <div className="md:hidden space-y-4">
        <RecentBookings userId={userId} />
        <PropertyPerformance userId={userId} />
      </div>

      {/* Desktop Recent Activity */}
      <div className="hidden md:grid gap-8 md:grid-cols-2">
        <RecentBookings userId={userId} />
        <PropertyPerformance userId={userId} />
      </div>
    </div>
  )
}