'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, RefreshCw, Database, HardDrive, Shield } from 'lucide-react'

interface DbCheck {
  timestamp: string
  database: {
    connected: boolean
    loft_photos_table: boolean
    lofts_table: boolean
  }
  storage: {
    accessible: boolean
    loft_photos_bucket: boolean
  }
  auth: {
    service_available: boolean
  }
}

interface DbStatus {
  success: boolean
  checks: DbCheck | null
  recommendations: string[]
  error?: string
}

export function DbStatusChecker() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/check-db')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        success: false,
        checks: null,
        recommendations: ['❌ Impossible de contacter l\'API de vérification'],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const getStatusIcon = (isOk: boolean) => {
    return isOk ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (isOk: boolean) => {
    return isOk ? (
      <Badge className="bg-green-100 text-green-800">OK</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Erreur</Badge>
    )
  }

  const allChecksPass = status?.checks && 
    status.checks.database.connected &&
    status.checks.database.loft_photos_table &&
    status.checks.database.lofts_table &&
    status.checks.storage.accessible &&
    status.checks.storage.loft_photos_bucket &&
    status.checks.auth.service_available

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            État de la Configuration
          </CardTitle>
          <Button 
            onClick={checkStatus} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {status?.error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>Erreur:</strong> {status.error}
            </AlertDescription>
          </Alert>
        )}

        {status?.checks && (
          <>
            {/* Base de Données */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Database className="h-5 w-5" />
                Base de Données
              </h3>
              
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.checks.database.connected)}
                    <span>Connexion Supabase</span>
                  </div>
                  {getStatusBadge(status.checks.database.connected)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.checks.database.lofts_table)}
                    <span>Table 'lofts'</span>
                  </div>
                  {getStatusBadge(status.checks.database.lofts_table)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.checks.database.loft_photos_table)}
                    <span>Table 'loft_photos'</span>
                  </div>
                  {getStatusBadge(status.checks.database.loft_photos_table)}
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <HardDrive className="h-5 w-5" />
                Storage
              </h3>
              
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.checks.storage.accessible)}
                    <span>Service Storage</span>
                  </div>
                  {getStatusBadge(status.checks.storage.accessible)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.checks.storage.loft_photos_bucket)}
                    <span>Bucket 'loft-photos'</span>
                  </div>
                  {getStatusBadge(status.checks.storage.loft_photos_bucket)}
                </div>
              </div>
            </div>

            {/* Auth */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5" />
                Authentification
              </h3>
              
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.checks.auth.service_available)}
                    <span>Service Auth</span>
                  </div>
                  {getStatusBadge(status.checks.auth.service_available)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Recommandations */}
        {status?.recommendations && status.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Recommandations</h3>
            <div className="space-y-2">
              {status.recommendations.map((rec, index) => (
                <Alert key={index} className={allChecksPass ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                  <AlertDescription className={allChecksPass ? "text-green-700" : "text-orange-700"}>
                    {rec}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Statut global */}
        {status?.checks && (
          <Alert className={allChecksPass ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription className={allChecksPass ? "text-green-700" : "text-red-700"}>
              <strong>
                {allChecksPass 
                  ? "✅ Configuration complète ! L'upload de photos devrait fonctionner."
                  : "⚠️ Configuration incomplète. Suivez les recommandations ci-dessus."
                }
              </strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Timestamp */}
        {status?.checks && (
          <p className="text-xs text-gray-500 text-center">
            Dernière vérification: {new Date(status.checks.timestamp).toLocaleString('fr-FR')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}