"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Trash2, 
  Shield, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GDPRDashboardProps {
  userRole: UserRole
  userId: string
  className?: string
}

interface ConsentStatus {
  consent_type: string
  consent_given: boolean
  consent_date: string
  consent_version: string
}

interface DeletionRequest {
  id: string
  status: string
  requested_at: string
  deletion_type: string
  reason: string
}

export function GDPRDashboard({ userRole, userId, className }: GDPRDashboardProps) {
  const t = useTranslations('gdpr')
  
  const [consents, setConsents] = useState<ConsentStatus[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = ['admin', 'manager'].includes(userRole)

  useEffect(() => {
    fetchGDPRData()
  }, [userId])

  const fetchGDPRData = async () => {
    try {
      setLoading(true)
      
      // Fetch consents
      const consentResponse = await fetch(`/api/gdpr/consent?user_id=${userId}`)
      const consentData = await consentResponse.json()
      
      if (consentData.success) {
        setConsents(consentData.consents)
      }

      // Fetch deletion requests
      const deletionResponse = await fetch(`/api/gdpr/deletion?user_id=${userId}`)
      const deletionData = await deletionResponse.json()
      
      if (deletionData.success) {
        setDeletionRequests(deletionData.requests)
      }

    } catch (err) {
      console.error('Failed to fetch GDPR data:', err)
      setError('Failed to load GDPR data')
    } finally {
      setLoading(false)
    }
  }

  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gdpr_export_${userId}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Export failed')
      }
    } catch (err) {
      setError('Data export failed')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* GDPR Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('gdprActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleDataExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('exportMyData')}
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {/* Open deletion request modal */}}
            >
              <Trash2 className="h-4 w-4" />
              {t('requestDeletion')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t('consentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consents.length === 0 ? (
              <p className="text-muted-foreground">{t('noConsentsRecorded')}</p>
            ) : (
              consents.map((consent) => (
                <div key={consent.consent_type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{t(`consentTypes.${consent.consent_type}`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(consent.consent_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={consent.consent_given ? "default" : "secondary"}>
                    {consent.consent_given ? t('granted') : t('withdrawn')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deletion Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('deletionRequests')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deletionRequests.length === 0 ? (
              <p className="text-muted-foreground">{t('noDeletionRequests')}</p>
            ) : (
              deletionRequests.map((request) => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={
                      request.status === 'completed' ? 'default' :
                      request.status === 'pending' ? 'secondary' :
                      request.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {t(`deletionStatus.${request.status}`)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{request.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('deletionType')}: {t(`deletionTypes.${request.deletion_type}`)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}