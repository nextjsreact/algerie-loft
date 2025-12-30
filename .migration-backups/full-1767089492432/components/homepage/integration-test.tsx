'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  Users, 
  Calendar,
  CreditCard,
  Settings,
  Wifi
} from 'lucide-react'

interface IntegrationStatus {
  name: string
  status: 'connected' | 'error' | 'testing' | 'not_tested'
  message: string
  lastTested?: string
  responseTime?: number
}

interface IntegrationTestProps {
  locale?: string
}

export function IntegrationTest({ locale = 'fr' }: IntegrationTestProps) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      name: 'Système d\'authentification',
      status: 'not_tested',
      message: 'Non testé'
    },
    {
      name: 'API de disponibilité',
      status: 'not_tested',
      message: 'Non testé'
    },
    {
      name: 'Système de réservation',
      status: 'not_tested',
      message: 'Non testé'
    },
    {
      name: 'Gestion des propriétés',
      status: 'not_tested',
      message: 'Non testé'
    },
    {
      name: 'Base de données',
      status: 'not_tested',
      message: 'Non testé'
    },
    {
      name: 'Notifications',
      status: 'not_tested',
      message: 'Non testé'
    }
  ])

  const [isTestingAll, setIsTestingAll] = useState(false)

  const testIntegration = async (index: number) => {
    const integration = integrations[index]
    
    // Update status to testing
    setIntegrations(prev => prev.map((item, i) => 
      i === index ? { ...item, status: 'testing', message: 'Test en cours...' } : item
    ))

    try {
      const startTime = Date.now()
      let result: { success: boolean; message: string }

      switch (integration.name) {
        case 'Système d\'authentification':
          result = await testAuthSystem()
          break
        case 'API de disponibilité':
          result = await testAvailabilityAPI()
          break
        case 'Système de réservation':
          result = await testBookingSystem()
          break
        case 'Gestion des propriétés':
          result = await testPropertyManagement()
          break
        case 'Base de données':
          result = await testDatabase()
          break
        case 'Notifications':
          result = await testNotifications()
          break
        default:
          result = { success: false, message: 'Test non implémenté' }
      }

      const responseTime = Date.now() - startTime

      setIntegrations(prev => prev.map((item, i) => 
        i === index ? {
          ...item,
          status: result.success ? 'connected' : 'error',
          message: result.message,
          lastTested: new Date().toISOString(),
          responseTime
        } : item
      ))
    } catch (error) {
      setIntegrations(prev => prev.map((item, i) => 
        i === index ? {
          ...item,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          lastTested: new Date().toISOString()
        } : item
      ))
    }
  }

  const testAllIntegrations = async () => {
    setIsTestingAll(true)
    
    for (let i = 0; i < integrations.length; i++) {
      await testIntegration(i)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsTestingAll(false)
  }

  // Individual test functions
  const testAuthSystem = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        return { success: true, message: 'Système d\'authentification opérationnel' }
      } else {
        return { success: false, message: 'Erreur d\'authentification' }
      }
    } catch (error) {
      return { success: false, message: 'Impossible de contacter le service d\'authentification' }
    }
  }

  const testAvailabilityAPI = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Test with dummy data
      const testParams = new URLSearchParams({
        loft_id: '00000000-0000-0000-0000-000000000000',
        check_in_date: '2024-12-01',
        check_out_date: '2024-12-03',
        guest_count: '2'
      })
      
      const response = await fetch(`/api/availability?${testParams}`)
      
      if (response.ok || response.status === 404) {
        return { success: true, message: 'API de disponibilité accessible' }
      } else {
        return { success: false, message: 'Erreur API de disponibilité' }
      }
    } catch (error) {
      return { success: false, message: 'API de disponibilité inaccessible' }
    }
  }

  const testBookingSystem = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/bookings')
      
      if (response.ok || response.status === 401) {
        return { success: true, message: 'Système de réservation accessible' }
      } else {
        return { success: false, message: 'Erreur système de réservation' }
      }
    } catch (error) {
      return { success: false, message: 'Système de réservation inaccessible' }
    }
  }

  const testPropertyManagement = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/partner/dashboard/metrics')
      
      if (response.ok || response.status === 401) {
        return { success: true, message: 'Gestion des propriétés accessible' }
      } else {
        return { success: false, message: 'Erreur gestion des propriétés' }
      }
    } catch (error) {
      return { success: false, message: 'Gestion des propriétés inaccessible' }
    }
  }

  const testDatabase = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/health')
      
      if (response.ok) {
        return { success: true, message: 'Base de données connectée' }
      } else {
        return { success: false, message: 'Erreur de connexion à la base de données' }
      }
    } catch (error) {
      return { success: false, message: 'Base de données inaccessible' }
    }
  }

  const testNotifications = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/notifications')
      
      if (response.ok || response.status === 401) {
        return { success: true, message: 'Système de notifications opérationnel' }
      } else {
        return { success: false, message: 'Erreur système de notifications' }
      }
    } catch (error) {
      return { success: false, message: 'Système de notifications inaccessible' }
    }
  }

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'testing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Wifi className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connecté</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'testing':
        return <Badge variant="secondary">Test...</Badge>
      default:
        return <Badge variant="outline">Non testé</Badge>
    }
  }

  const getIntegrationIcon = (name: string) => {
    switch (name) {
      case 'Système d\'authentification':
        return <Users className="h-5 w-5" />
      case 'API de disponibilité':
        return <Calendar className="h-5 w-5" />
      case 'Système de réservation':
        return <CreditCard className="h-5 w-5" />
      case 'Gestion des propriétés':
        return <Settings className="h-5 w-5" />
      case 'Base de données':
        return <Database className="h-5 w-5" />
      case 'Notifications':
        return <Wifi className="h-5 w-5" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test d'intégration des systèmes
          </CardTitle>
          <Button 
            onClick={testAllIntegrations}
            disabled={isTestingAll}
            size="sm"
          >
            {isTestingAll ? 'Test en cours...' : 'Tester tout'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration, index) => (
            <div 
              key={integration.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getIntegrationIcon(integration.name)}
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-sm text-gray-600">{integration.message}</div>
                  {integration.lastTested && (
                    <div className="text-xs text-gray-500">
                      Testé: {new Date(integration.lastTested).toLocaleTimeString('fr-FR')}
                      {integration.responseTime && ` (${integration.responseTime}ms)`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusBadge(integration.status)}
                {getStatusIcon(integration.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testIntegration(index)}
                  disabled={integration.status === 'testing' || isTestingAll}
                >
                  Tester
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Résumé des intégrations</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {integrations.filter(i => i.status === 'connected').length}
              </div>
              <div className="text-gray-600">Connectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {integrations.filter(i => i.status === 'error').length}
              </div>
              <div className="text-gray-600">Erreurs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {integrations.filter(i => i.status === 'not_tested').length}
              </div>
              <div className="text-gray-600">Non testés</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}