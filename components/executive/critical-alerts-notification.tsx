"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"
// Removed next-intl dependency

interface CriticalAlert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  data: any
  resolved: boolean
  created_at: string
}

interface CriticalAlertsNotificationProps {
  userId: string
  userRole: string
}

export function CriticalAlertsNotification({ userId, userRole }: CriticalAlertsNotificationProps) {
  // Retour anticipé si l'utilisateur n'est pas executive
  if (userRole !== 'executive') {
    return null;
  }

  // Simple French text instead of translations
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'criticalAlerts': 'Alertes Critiques',
      'resolve': 'Résoudre',
      'dismiss': 'Ignorer'
    }
    return translations[key] || key
  }
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAlerts()
    
    // Écouter les nouvelles alertes en temps réel
    const channel = supabase
      .channel('critical_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'critical_alerts'
        },
        (payload) => {
          const newAlert = payload.new as CriticalAlert
          setAlerts(prev => [newAlert, ...prev])
          
          // Notification toast pour les alertes critiques
          if (newAlert.severity === 'critical') {
            toast.error(`🚨 ${newAlert.title}`, {
              description: newAlert.description,
              duration: 10000,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'critical_alerts'
        },
        (payload) => {
          const updatedAlert = payload.new as CriticalAlert
          setAlerts(prev => prev.map(alert => 
            alert.id === updatedAlert.id ? updatedAlert : alert
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userRole, supabase])

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('critical_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('critical_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      toast.success(t('alerts.resolved'))
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error || 'Unknown error')
      toast.error(t('alerts.resolveError'))
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      case 'low': return 'ℹ️'
      default: return '📋'
    }
  }

  if (loading) return null

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {alerts.slice(0, 3).map((alert) => (
        <Alert 
          key={alert.id} 
          className={`border-l-4 shadow-lg ${getSeverityColor(alert.severity)} animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
              <div className="flex-1">
                <AlertTitle className="flex items-center justify-between text-sm">
                  {alert.title}
                  <Badge variant="outline" className={`ml-2 ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {alert.description}
                </AlertDescription>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString('fr-FR')}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
{t('alerts.resolve')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Alert>
      ))}
      
      {alerts.length > 3 && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            +{alerts.length - 3} autres alertes
          </Badge>
        </div>
      )}
    </div>
  )
}