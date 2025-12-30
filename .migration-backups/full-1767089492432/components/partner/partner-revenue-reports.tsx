"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar as CalendarDays,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"

interface DateRange {
  from: Date
  to: Date
}

interface RevenueData {
  date: string
  revenue: number
  bookings: number
  occupancy_rate: number
}

interface RevenueStats {
  total_revenue: number
  total_bookings: number
  average_occupancy: number
  revenue_change: number
  bookings_change: number
  occupancy_change: number
  top_performing_property: {
    name: string
    revenue: number
  }
  revenue_by_property: Array<{
    property_name: string
    revenue: number
    bookings: number
  }>
}

interface RevenueReportProps {
  partnerId: string
  dateRange: DateRange
  groupBy: 'day' | 'week' | 'month'
}

export function PartnerRevenueReports({ 
  partnerId, 
  dateRange: initialDateRange,
  groupBy: initialGroupBy = 'month'
}: RevenueReportProps) {
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange)
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>(initialGroupBy)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    fetchRevenueData()
  }, [partnerId, dateRange, groupBy])

  const fetchRevenueData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        partnerId,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        groupBy
      })
      
      const response = await fetch(`/api/partner/revenue?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setRevenueData(data.revenue_data)
        setStats(data.stats)
      } else {
        // Fallback to mock data
        setRevenueData(getMockRevenueData())
        setStats(getMockStats())
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      setRevenueData(getMockRevenueData())
      setStats(getMockStats())
    } finally {
      setLoading(false)
    }
  }

  const getMockRevenueData = (): RevenueData[] => [
    { date: '2024-10-01', revenue: 45000, bookings: 8, occupancy_rate: 75 },
    { date: '2024-10-02', revenue: 32000, bookings: 6, occupancy_rate: 60 },
    { date: '2024-10-03', revenue: 58000, bookings: 10, occupancy_rate: 85 },
    { date: '2024-10-04', revenue: 41000, bookings: 7, occupancy_rate: 70 },
    { date: '2024-10-05', revenue: 67000, bookings: 12, occupancy_rate: 90 },
    { date: '2024-10-06', revenue: 39000, bookings: 6, occupancy_rate: 65 },
    { date: '2024-10-07', revenue: 52000, bookings: 9, occupancy_rate: 80 },
  ]

  const getMockStats = (): RevenueStats => ({
    total_revenue: 334000,
    total_bookings: 58,
    average_occupancy: 75,
    revenue_change: 12.5,
    bookings_change: 8.3,
    occupancy_change: -2.1,
    top_performing_property: {
      name: 'Luxury Downtown Loft',
      revenue: 145000
    },
    revenue_by_property: [
      { property_name: 'Luxury Downtown Loft', revenue: 145000, bookings: 25 },
      { property_name: 'Cozy Studio Apartment', revenue: 98000, bookings: 20 },
      { property_name: 'Family Villa with Garden', revenue: 91000, bookings: 13 }
    ]
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const setQuickDateRange = (days: number) => {
    const to = new Date()
    const from = subDays(to, days)
    setDateRange({ from, to })
  }

  const setMonthRange = (monthsBack: number) => {
    const date = subMonths(new Date(), monthsBack)
    const from = startOfMonth(date)
    const to = endOfMonth(date)
    setDateRange({ from, to })
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Revenue', 'Bookings', 'Occupancy Rate'],
      ...revenueData.map(item => [
        item.date,
        item.revenue.toString(),
        item.bookings.toString(),
        `${item.occupancy_rate}%`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revenue & Analytics</h1>
          <p className="text-gray-600">
            Track your property performance and earnings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRevenueData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                ) : (
                  'Select date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                    Last 7 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                    Last 30 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMonthRange(0)}>
                    This month
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMonthRange(1)}>
                    Last month
                  </Button>
                </div>
              </div>
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                    setCalendarOpen(false)
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Select value={groupBy} onValueChange={(value: 'day' | 'week' | 'month') => setGroupBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                  <div className="flex items-center text-green-100 text-sm mt-1">
                    {getChangeIcon(stats.revenue_change)}
                    <span className="ml-1">
                      {stats.revenue_change > 0 ? '+' : ''}{stats.revenue_change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.total_bookings}</p>
                  <div className="flex items-center text-blue-100 text-sm mt-1">
                    {getChangeIcon(stats.bookings_change)}
                    <span className="ml-1">
                      {stats.bookings_change > 0 ? '+' : ''}{stats.bookings_change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <CalendarDays className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Occupancy</p>
                  <p className="text-3xl font-bold">{stats.average_occupancy}%</p>
                  <div className="flex items-center text-purple-100 text-sm mt-1">
                    {getChangeIcon(stats.occupancy_change)}
                    <span className="ml-1">
                      {stats.occupancy_change > 0 ? '+' : ''}{stats.occupancy_change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-end justify-between gap-2 p-4">
            {revenueData.map((item, index) => {
              const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
              const height = (item.revenue / maxRevenue) * 100
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full">
                    <div
                      className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer group-hover:bg-blue-600"
                      style={{ height: `${height * 2.5}px`, minHeight: '20px' }}
                      title={`${format(new Date(item.date), 'MMM dd')}: ${formatCurrency(item.revenue)}`}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {format(new Date(item.date), groupBy === 'day' ? 'dd' : 'MMM dd')}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Property Performance */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Property</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h3 className="font-semibold text-green-800">
                      {stats.top_performing_property.name}
                    </h3>
                    <p className="text-sm text-green-600">Best revenue performer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(stats.top_performing_property.revenue)}
                    </p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Top Performer
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Property</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.revenue_by_property.map((property, index) => {
                  const maxRevenue = Math.max(...stats.revenue_by_property.map(p => p.revenue))
                  const percentage = (property.revenue / maxRevenue) * 100
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{property.property_name}</span>
                        <span className="text-gray-600">
                          {formatCurrency(property.revenue)} ({property.bookings} bookings)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Occupancy Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-end justify-between gap-2 p-4">
            {revenueData.map((item, index) => {
              const height = item.occupancy_rate
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full">
                    <div
                      className="bg-purple-500 hover:bg-purple-600 transition-colors rounded-t cursor-pointer"
                      style={{ height: `${height * 1.2}px`, minHeight: '10px' }}
                      title={`${format(new Date(item.date), 'MMM dd')}: ${item.occupancy_rate}%`}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.occupancy_rate}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {format(new Date(item.date), groupBy === 'day' ? 'dd' : 'MMM dd')}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}