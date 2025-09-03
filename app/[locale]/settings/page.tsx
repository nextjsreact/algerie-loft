"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Bell, Database } from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import type { AuthSession } from "@/lib/types"

export default function SettingsPage() {
  const t = useTranslations();
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession()
        if (!sessionData || (sessionData.user.role !== 'admin' && sessionData.user.role !== 'manager')) {
          // Redirect to unauthorized or handle access control
          window.location.href = '/unauthorized'
          return
        }
        setSession(sessionData)
      } catch (error) {
        console.error('Failed to fetch session:', error)
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  if (loading) {
    return <div className="p-8">{t('common.loading')}</div>
  }

  if (!session) {
    return null
  }

  const userRoleTranslationKeys = {
    admin: "auth.admin",
    manager: "auth.manager",
    member: "auth.member",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.profileInfo')}
            </CardTitle>
            <CardDescription>{t('settings.updatePersonalInfo')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('settings.fullName')}</Label>
              <Input id="fullName" defaultValue={session.user.full_name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.email')}</Label>
              <Input id="email" type="email" defaultValue={session.user.email || ''} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.role')}</Label>
              <div>
                <Badge variant="secondary" className="capitalize">
                  {t(userRoleTranslationKeys[session.user.role])}
                </Badge>
              </div>
            </div>
            <Button>{t('settings.updateProfile')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.security')}
            </CardTitle>
            <CardDescription>{t('settings.manageAccountSecurity')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button>{t('settings.changePassword')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notifications')}
            </CardTitle>
            <CardDescription>{t('settings.configureNotifications')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.taskAssignments')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.taskAssignmentsDesc')}</p>
              </div>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.dueDateReminders')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.dueDateRemindersDesc')}</p>
              </div>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.financialReports')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.financialReportsDesc')}</p>
              </div>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('settings.dataPrivacy')}
            </CardTitle>
            <CardDescription>{t('settings.manageDataPrivacy')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">{t('settings.dataExport')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.dataExportDesc')}</p>
              <Button variant="outline" size="sm">
                {t('settings.exportData')}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="font-medium">{t('settings.accountDeletion')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.accountDeletionDesc')}</p>
              <Button variant="destructive" size="sm">
                {t('settings.deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('settings.paymentMethods')}
            </CardTitle>
            <CardDescription>{t('settings.managePaymentMethods')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/payment-methods">
                {t('settings.managePaymentMethodsBtn')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}