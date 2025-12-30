"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Cookie, 
  Settings, 
  FileText, 
  CreditCard,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CookieConsentBanner } from './cookie-consent-banner'
import { GDPRRequestForm } from './gdpr-request-form'
import { PrivacySettingsPanel } from './privacy-settings-panel'
import { SecurePaymentForm } from './secure-payment-form'
import { GDPRDashboard } from '@/components/gdpr/gdpr-dashboard'
import type { UserRole } from '@/lib/types'

interface PrivacyDashboardProps {
  userId: string
  userRole: UserRole
  className?: string
}

export function PrivacyDashboard({ userId, userRole, className }: PrivacyDashboardProps) {
  const t = useTranslations('privacy.dashboard')
  const [activeTab, setActiveTab] = useState('overview')

  const privacyTabs = [
    {
      id: 'overview',
      label: t('tabs.overview'),
      icon: <Shield className="w-4 h-4" />,
      description: t('tabs.overviewDesc')
    },
    {
      id: 'cookies',
      label: t('tabs.cookies'),
      icon: <Cookie className="w-4 h-4" />,
      description: t('tabs.cookiesDesc')
    },
    {
      id: 'settings',
      label: t('tabs.settings'),
      icon: <Settings className="w-4 h-4" />,
      description: t('tabs.settingsDesc')
    },
    {
      id: 'gdpr',
      label: t('tabs.gdpr'),
      icon: <FileText className="w-4 h-4" />,
      description: t('tabs.gdprDesc')
    },
    {
      id: 'payments',
      label: t('tabs.payments'),
      icon: <CreditCard className="w-4 h-4" />,
      description: t('tabs.paymentsDesc')
    }
  ]

  const privacyStats = [
    {
      title: t('stats.dataProcessing'),
      value: t('stats.active'),
      icon: <Shield className="w-5 h-5" />,
      status: 'success' as const,
      description: t('stats.dataProcessingDesc')
    },
    {
      title: t('stats.cookieConsent'),
      value: t('stats.granted'),
      icon: <Cookie className="w-5 h-5" />,
      status: 'success' as const,
      description: t('stats.cookieConsentDesc')
    },
    {
      title: t('stats.dataRetention'),
      value: '3 years',
      icon: <Clock className="w-5 h-5" />,
      status: 'info' as const,
      description: t('stats.dataRetentionDesc')
    },
    {
      title: t('stats.gdprRequests'),
      value: '0',
      icon: <FileText className="w-5 h-5" />,
      status: 'info' as const,
      description: t('stats.gdprRequestsDesc')
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {t('gdprCompliant')}
        </Badge>
      </div>

      {/* Privacy Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {privacyStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded", getStatusColor(stat.status))}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Privacy Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {privacyTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 text-xs"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('overview.rights.title')}
                </CardTitle>
                <CardDescription>
                  {t('overview.rights.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{t('overview.rights.export')}</span>
                  </div>
                  <Badge variant="outline">{t('overview.available')}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">{t('overview.rights.delete')}</span>
                  </div>
                  <Badge variant="outline">{t('overview.available')}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{t('overview.rights.modify')}</span>
                  </div>
                  <Badge variant="outline">{t('overview.available')}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Data Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('overview.data.title')}
                </CardTitle>
                <CardDescription>
                  {t('overview.data.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'personal', icon: '👤', status: 'active' },
                  { key: 'booking', icon: '🏠', status: 'active' },
                  { key: 'payment', icon: '💳', status: 'encrypted' },
                  { key: 'communication', icon: '💬', status: 'active' },
                  { key: 'analytics', icon: '📊', status: 'anonymized' }
                ].map((category) => (
                  <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">
                        {t(`overview.data.categories.${category.key}`)}
                      </span>
                    </div>
                    <Badge 
                      variant={category.status === 'encrypted' ? 'default' : 'outline'}
                      className={category.status === 'encrypted' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {t(`overview.data.status.${category.status}`)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cookie Consent Tab */}
        <TabsContent value="cookies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5" />
                {t('cookies.title')}
              </CardTitle>
              <CardDescription>
                {t('cookies.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CookieConsentBanner
                userId={userId}
                className="relative border-0 shadow-none bg-transparent p-0"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings Tab */}
        <TabsContent value="settings">
          <PrivacySettingsPanel userId={userId} />
        </TabsContent>

        {/* GDPR Tab */}
        <TabsContent value="gdpr" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GDPR Request Form */}
            <GDPRRequestForm />
            
            {/* GDPR Dashboard */}
            <GDPRDashboard userId={userId} userRole={userRole} />
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t('payments.title')}
              </CardTitle>
              <CardDescription>
                {t('payments.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('payments.noPayments')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('payments.noPaymentsDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legal Notice */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t('legal.title')}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('legal.description')}
              </p>
              <div className="flex gap-4 mt-2">
                <a 
                  href="/privacy-policy" 
                  className="text-sm text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('legal.privacyPolicy')}
                </a>
                <a 
                  href="/terms-of-service" 
                  className="text-sm text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('legal.termsOfService')}
                </a>
                <a 
                  href="/cookie-policy" 
                  className="text-sm text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('legal.cookiePolicy')}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}