'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building, 
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DateRange } from 'react-day-picker'
import { addDays, format, subDays } from 'date-fns'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, Bar, BarChart, Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, Legend } from 'recharts'

interface FinancialReport {
  period: string
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  partnerEarnings: number
  platformFees: number
  refunds: number
  disputes: number
  growthRate: number
}

interface UserActivityReport {
  period: string
  newUsers: number
  activeUsers: number
  bookingUsers: number
  retentionRate: number
  usersByRole: {
    clients: number
    partners: number
    employees: number
  }
}

interface PlatformAnalytics {
  totalProperties: number
  activeProperties: number
  averageOccupancy: number
  topPerformingProperties: Array<{
    id: string
    name: string
    bookings: number
    revenue: number
    rating: number
  }>
  bookingTrends: Array<{
    month: string
    bookings: number
    revenue: number
  }>
  userGrowth: Array<{
    month: string
    clients: number
    partners: number
  }>
}

interface ReportFilters {
  dateRange: DateRange | undefined
  reportType: 'financial' | 'users' | 'analytics'
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  userRole?: 'all' | 'client' | 'partner' | 'employee'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ComprehensiveReporting() {
  const t = useTranslations('admin.reports')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    },
    reportType: 'financial',
    period: 'monthly'
  })

  // Mock data - in real implementation, this would come from API
  const [financialReport, setFinancialReport] = useState<FinancialReport>({
    period: 'Last 30 days',
    totalRevenue: 125000,
    totalBookings: 342,
    averageBookingValue: 365,
    partnerEarnings: 87500,
    platformFees: 37500,
    refunds: 2800,
    disputes: 7,
    growthRate: 12.5
  })

  const [userActivityReport, setUserActivityReport] = useState<UserActivityReport>({
    period: 'Last 30 days',
    newUsers: 89,
    activeUsers: 1247,
    bookingUsers: 234,
    retentionRate: 78.5,
    usersByRole: {
      clients: 892,
      partners: 156,
      employees: 199
    }
  })

  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics>({
    totalProperties: 156,
    activeProperties: 142,
    averageOccupancy: 73.2,
    topPerformingProperties: [
      { id: '1', name: 'Loft Artistique Hydra', bookings: 28, revenue: 12400, rating: 4.8 },
      { id: '2', name: 'Loft Moderne Centre-Ville', bookings: 25, revenue: 11200, rating: 4.7 },
      { id: '3', name: 'Loft Industriel Kouba', bookings: 22, revenue: 9800, rating: 4.6 },
      { id: '4', name: 'Loft Panoramique Alger', bookings: 20, revenue: 9200, rating: 4.9 },
      { id: '5', name: 'Loft Cosy Bab Ezzouar', bookings: 18, revenue: 8100, rating: 4.5 }
    ],
    bookingTrends: [
      { month: 'Jan', bookings: 45, revenue: 18500 },
      { month: 'Feb', bookings: 52, revenue: 21200 },
      { month: 'Mar', bookings: 48, revenue: 19800 },
      { month: 'Apr', bookings: 61, revenue: 25100 },
      { month: 'May', bookings: 58, revenue: 23800 },
      { month: 'Jun', bookings: 67, revenue: 27500 }
    ],
    userGrowth: [
      { month: 'Jan', clients: 45, partners: 8 },
      { month: 'Feb', clients: 52, partners: 12 },
      { month: 'Mar', clients: 48, partners: 9 },
      { month: 'Apr', clients: 61, partners: 15 },
      { month: 'May', clients: 58, partners: 11 },
      { month: 'Jun', clients: 67, partners: 18 }
    ]
  })

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true)
    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: filters.reportType,
          format,
          dateRange: filters.dateRange,
          period: filters.period
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filters.reportType}-report-${format}.${format === 'excel' ? 'xlsx' : format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const userRoleData = [
    { name: t('roles.clients'), value: userActivityReport.usersByRole.clients, color: '#0088FE' },
    { name: t('roles.partners'), value: userActivityReport.usersByRole.partners, color: '#00C49F' },
    { name: t('roles.employees'), value: userActivityReport.usersByRole.employees, color: '#FFBB28' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {t('title')}
          </h2>
          <p className="text-gray-600">{t('description')}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportReport('pdf')}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {t('exportPdf')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('excel')}
            disabled={exporting}
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('exportExcel')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">{t('filters.reportType')}</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">{t('types.financial')}</SelectItem>
                  <SelectItem value="users">{t('types.users')}</SelectItem>
                  <SelectItem value="analytics">{t('types.analytics')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">{t('filters.period')}</Label>
              <Select
                value={filters.period}
                onValueChange={(value) => setFilters(prev => ({ ...prev, period: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('periods.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('periods.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('periods.monthly')}</SelectItem>
                  <SelectItem value="yearly">{t('periods.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('filters.dateRange')}</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={() => setLoading(true)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                {t('generateReport')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as any }))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">{t('types.financial')}</TabsTrigger>
          <TabsTrigger value="users">{t('types.users')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('types.analytics')}</TabsTrigger>
        </TabsList>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('financial.totalRevenue')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(financialReport.totalRevenue)}</p>
                    <div className="flex items-center text-green-600 text-sm mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{formatPercentage(financialReport.growthRate)}
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('financial.totalBookings')}</p>
                    <p className="text-2xl font-bold">{financialReport.totalBookings}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(financialReport.averageBookingValue)} {t('financial.avgValue')}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('financial.partnerEarnings')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(financialReport.partnerEarnings)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPercentage((financialReport.partnerEarnings / financialReport.totalRevenue) * 100)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('financial.platformFees')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(financialReport.platformFees)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPercentage((financialReport.platformFees / financialReport.totalRevenue) * 100)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('financial.bookingTrends')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={platformAnalytics.bookingTrends}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0088FE"
                        strokeWidth={3}
                        dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('financial.revenueBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('financial.partnerEarnings')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="font-medium">{formatCurrency(financialReport.partnerEarnings)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('financial.platformFees')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="font-medium">{formatCurrency(financialReport.platformFees)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('financial.refunds')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="font-medium">-{formatCurrency(financialReport.refunds)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Activity Reports */}
        <TabsContent value="users" className="space-y-6">
          {/* User KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('users.newUsers')}</p>
                    <p className="text-2xl font-bold">{userActivityReport.newUsers}</p>
                    <p className="text-sm text-gray-500 mt-1">{userActivityReport.period}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('users.activeUsers')}</p>
                    <p className="text-2xl font-bold">{userActivityReport.activeUsers}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('users.totalActive')}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('users.bookingUsers')}</p>
                    <p className="text-2xl font-bold">{userActivityReport.bookingUsers}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPercentage((userActivityReport.bookingUsers / userActivityReport.activeUsers) * 100)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('users.retentionRate')}</p>
                    <p className="text-2xl font-bold">{formatPercentage(userActivityReport.retentionRate)}</p>
                    <div className="flex items-center text-green-600 text-sm mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +2.3%
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('users.userGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformAnalytics.userGrowth}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="clients" fill="#0088FE" />
                      <Bar dataKey="partners" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('users.roleDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Platform Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('analytics.totalProperties')}</p>
                    <p className="text-2xl font-bold">{platformAnalytics.totalProperties}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {platformAnalytics.activeProperties} {t('analytics.active')}
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('analytics.occupancyRate')}</p>
                    <p className="text-2xl font-bold">{formatPercentage(platformAnalytics.averageOccupancy)}</p>
                    <div className="flex items-center text-green-600 text-sm mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +5.2%
                    </div>
                  </div>
                  <PieChart className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('analytics.avgBookingValue')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(financialReport.averageBookingValue)}</p>
                    <div className="flex items-center text-green-600 text-sm mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +8.1%
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('analytics.disputeRate')}</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage((financialReport.disputes / financialReport.totalBookings) * 100)}
                    </p>
                    <div className="flex items-center text-red-600 text-sm mt-1">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      -1.2%
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Properties */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.topProperties')}</CardTitle>
              <CardDescription>{t('analytics.topPropertiesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformAnalytics.topPerformingProperties.map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{property.name}</h4>
                        <p className="text-sm text-gray-600">
                          {property.bookings} {t('analytics.bookings')} • ⭐ {property.rating}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(property.revenue)}</p>
                      <p className="text-sm text-gray-600">{t('analytics.revenue')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}