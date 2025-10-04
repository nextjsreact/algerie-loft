import { Suspense } from 'react'
import { requireRole } from '@/lib/auth'
import { AuditPermissionManager } from '@/lib/permissions/audit-permissions'
import { AuditDashboard } from '@/components/audit/audit-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function AuditPage() {
  // Require admin or manager role
  const session = await requireRole(["admin", "manager"])
  const t = await getTranslations('audit')

  // Check if user has permission to access audit dashboard
  if (!AuditPermissionManager.canAccessAuditDashboard(session.user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('accessDenied')} {t('auditDashboardAccessRequired')}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              {t('auditDashboard')}
            </h1>
            <p className="text-muted-foreground">
              {t('auditDashboardDescription')}
            </p>
          </div>
          
          {/* Access Level Badge */}
          <Card className="bg-white/50 backdrop-blur-sm border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {t('accessLevel')}: {t(`accessLevels.${AuditPermissionManager.getAuditAccessLevel(session.user.role)}`)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific information */}
        {session.user.role === 'manager' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('managerAccessNote')}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>{t('loadingAuditData')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        }>
          <AuditDashboard 
            userRole={session.user.role}
            userId={session.user.id}
          />
        </Suspense>
      </div>
    </div>
  )
}