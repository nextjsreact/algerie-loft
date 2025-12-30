'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  Building, 
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserManagement } from './user-management'
import { PartnerVerificationManager } from './partner-verification-manager'
import { BookingDisputeResolution } from './booking-dispute-resolution'
import { ComprehensiveReporting } from './comprehensive-reporting'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingPartners: number
  openDisputes: number
  clientUsers: number
  partnerUsers: number
  employeeUsers: number
}

export function AdminManagementDashboard() {
  const t = useTranslations('admin')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingPartners: 0,
    openDisputes: 0,
    clientUsers: 0,
    partnerUsers: 0,
    employeeUsers: 0
  })
  const [loading, setLoading] = useState(false)

  // This would be fetched from API in real implementation
  const mockStats: AdminStats = {
    totalUsers: 1247,
    activeUsers: 1189,
    pendingPartners: 23,
    openDisputes: 7,
    clientUsers: 892,
    partnerUsers: 156,
    employeeUsers: 199
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          {t('management.title')}
        </h1>
        <p className="text-gray-600 mt-2">{t('management.description')}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t('stats.totalUsers')}</p>
                <p className="text-3xl font-bold">{mockStats.totalUsers.toLocaleString()}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {mockStats.activeUsers} {t('stats.active')}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t('stats.clients')}</p>
                <p className="text-3xl font-bold">{mockStats.clientUsers}</p>
                <p className="text-green-100 text-xs mt-1">
                  {((mockStats.clientUsers / mockStats.totalUsers) * 100).toFixed(1)}% {t('stats.ofTotal')}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">{t('stats.partners')}</p>
                <p className="text-3xl font-bold">{mockStats.partnerUsers}</p>
                <p className="text-purple-100 text-xs mt-1">
                  {mockStats.pendingPartners} {t('stats.pending')}
                </p>
              </div>
              <Building className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">{t('stats.disputes')}</p>
                <p className="text-3xl font-bold">{mockStats.openDisputes}</p>
                <p className="text-orange-100 text-xs mt-1">
                  {t('stats.needsAttention')}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Role Distribution */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            {t('userDistribution.title')}
          </CardTitle>
          <CardDescription>{t('userDistribution.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{mockStats.clientUsers}</div>
              <div className="text-sm text-gray-600">{t('roles.client')}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((mockStats.clientUsers / mockStats.totalUsers) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">{mockStats.partnerUsers}</div>
              <div className="text-sm text-gray-600">{t('roles.partner')}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((mockStats.partnerUsers / mockStats.totalUsers) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{mockStats.employeeUsers}</div>
              <div className="text-sm text-gray-600">{t('roles.employees')}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((mockStats.employeeUsers / mockStats.totalUsers) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-gray-600">{mockStats.totalUsers - mockStats.activeUsers}</div>
              <div className="text-sm text-gray-600">{t('stats.inactive')}</div>
              <div className="text-xs text-gray-500 mt-1">
                {(((mockStats.totalUsers - mockStats.activeUsers) / mockStats.totalUsers) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('tabs.userManagement')}
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            {t('tabs.partnerVerification')}
            {mockStats.pendingPartners > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {mockStats.pendingPartners}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {t('tabs.disputeResolution')}
            {mockStats.openDisputes > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {mockStats.openDisputes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('tabs.reports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <PartnerVerificationManager />
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <BookingDisputeResolution />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ComprehensiveReporting />
        </TabsContent>
      </Tabs>
    </div>
  )
}