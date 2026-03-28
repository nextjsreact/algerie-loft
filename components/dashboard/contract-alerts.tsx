'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, FileWarning, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface ContractAlert {
  id: string
  name: string
  owner_name: string
  contract_start_date: string
  contract_duration_months: number
  expiry_date: Date
  days_remaining: number
}

export function ContractAlerts() {
  const locale = useLocale()
  const [alerts, setAlerts] = useState<ContractAlert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/lofts/contract-alerts')
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => {})
  }, [])

  const visible = alerts.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-3">
      {visible.map(alert => {
        const isCritical = alert.days_remaining <= 15
        return (
          <Alert
            key={alert.id}
            className={`border-l-4 ${isCritical
              ? 'border-l-red-500 bg-red-50 dark:bg-red-950/30'
              : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {isCritical
                  ? <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  : <FileWarning className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <AlertTitle className={`font-semibold ${isCritical ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    Contrat expirant — {alert.name}
                  </AlertTitle>
                  <AlertDescription className={`text-sm mt-1 ${isCritical ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    Propriétaire : <strong>{alert.owner_name}</strong> •{' '}
                    Expire le <strong>{alert.expiry_date.toLocaleDateString('fr-FR')}</strong>
                  </AlertDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={isCritical ? 'destructive' : 'outline'} className={!isCritical ? 'border-amber-500 text-amber-700' : ''}>
                      {alert.days_remaining <= 0
                        ? 'Expiré'
                        : `${alert.days_remaining} jour${alert.days_remaining > 1 ? 's' : ''} restant${alert.days_remaining > 1 ? 's' : ''}`
                      }
                    </Badge>
                    <Link href={`/${locale}/lofts`}>
                      <Button variant="link" size="sm" className={`h-auto p-0 text-xs ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
                        Renouveler →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
