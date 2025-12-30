"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Clock,
  Eye
} from 'lucide-react'
import { AuditLog } from '@/lib/types'
import { cn } from '@/lib/utils'

// Mapping des noms de champs
const FIELD_DISPLAY_NAMES: Record<string, Record<string, string>> = {
  transactions: {
    amount: 'Montant',
    transaction_type: 'Type de transaction',
    status: 'Statut',
    description: 'Description',
    date: 'Date',
    category: 'Catégorie',
    loft_id: 'Loft',
    currency_id: 'Devise',
    payment_method_id: 'Méthode de paiement',
    ratio_at_transaction: 'Taux de change',
    equivalent_amount_default_currency: 'Montant équivalent'
  }
}

// Fonction pour obtenir le nom d'affichage d'un champ
function getFieldDisplayName(tableName: string, fieldName: string): string {
  return FIELD_DISPLAY_NAMES[tableName]?.[fieldName] || fieldName
}

// Fonction pour formater les valeurs
function formatAuditValue(tableName: string, fieldName: string, value: string | null, enrichedData?: any): string {
  if (!value) return 'Vide'

  // Mapping des devises - utiliser les données enrichies si disponibles
  if (fieldName === 'currency_id') {
    if (enrichedData?.currency_code) {
      return enrichedData.currency_code
    }
    // Fallback pour les devises communes
    const commonCurrencies: Record<string, string> = {
      'a0e57cd8-d74e-4a2d-8bfa-a94c5b4c0c7c': 'EUR (€)',
      '0fa82c9a-6e85-4ba3-ae71-cf438466df7b': 'DZD (DA)'
    }
    return commonCurrencies[value] || `Devise: ${value.substring(0, 8)}...`
  }

  // Mapping des méthodes de paiement
  if (fieldName === 'payment_method_id') {
    const paymentMethods: Record<string, string> = {
      '993465f2-b191-40ee-bd1e-c8567aa2531b': 'Carte bancaire',
      '251170fd-1729-4779-b2d0-0f70213bce9e': 'Virement bancaire',
      '9b8dad46-a14d-4460-8bf6-68ad8c7057b8': 'Espèces'
    }
    return paymentMethods[value] || `Paiement: ${value.substring(0, 8)}...`
  }

  // Mapping des lofts - utiliser les données enrichies si disponibles
  if (fieldName === 'loft_id') {
    if (enrichedData?.loft_name) {
      return enrichedData.loft_name
    }
    return `Loft: ${value.substring(0, 8)}...`
  }

  // Mapping des statuts
  if (fieldName === 'status') {
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Terminé',
      failed: 'Échoué',
      cancelled: 'Annulé'
    }
    return statusLabels[value] || value
  }

  // Mapping des types de transaction
  if (fieldName === 'transaction_type') {
    const typeLabels: Record<string, string> = {
      income: 'Recette',
      expense: 'Dépense',
      transfer: 'Virement'
    }
    return typeLabels[value] || value
  }

  return value
}

interface AuditLogItemProps {
  log: AuditLog
  className?: string
  showDetails?: boolean
}

export function AuditLogItem({ log, className, showDetails = false }: AuditLogItemProps) {
  const t = useTranslations('audit')
  const [isExpanded, setIsExpanded] = useState(showDetails)

  // Get action icon and color
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'INSERT':
        return {
          icon: Plus,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          variant: 'default' as const,
          label: t('actions.created')
        }
      case 'UPDATE':
        return {
          icon: Edit,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          variant: 'secondary' as const,
          label: t('actions.updated')
        }
      case 'DELETE':
        return {
          icon: Trash2,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          variant: 'destructive' as const,
          label: t('actions.deleted')
        }
      default:
        return {
          icon: Eye,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          variant: 'outline' as const,
          label: action
        }
    }
  }

  const actionConfig = getActionConfig(log.action)
  const ActionIcon = actionConfig.icon

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  const { date, time } = formatTimestamp(log.timestamp)

  // Get table display name
  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      transactions: t('tables.transactions'),
      tasks: t('tables.tasks'),
      reservations: t('tables.reservations'),
      lofts: t('tables.lofts')
    }
    return tableNames[tableName] || tableName
  }

  // Format field changes for display
  const formatFieldChanges = () => {
    if (!log.changedFields || log.changedFields.length === 0) {
      return null
    }

    return log.changedFields.map(field => {
      let oldValue = log.oldValues?.[field]
      let newValue = log.newValues?.[field]
      
      // Pour loft_id, utiliser le nom du loft si disponible
      if (field === 'loft_id') {
        if (log.oldValues?.loft_name) {
          oldValue = log.oldValues.loft_name
        }
        if (log.newValues?.loft_name) {
          newValue = log.newValues.loft_name
        }
      }
      
      // Pour currency_id, utiliser le code de la devise si disponible
      if (field === 'currency_id') {
        if (log.oldValues?.currency_code) {
          oldValue = log.oldValues.currency_code
        }
        if (log.newValues?.currency_code) {
          newValue = log.newValues.currency_code
        }
      }
      
      return {
        field,
        oldValue: oldValue !== undefined ? String(oldValue) : null,
        newValue: newValue !== undefined ? String(newValue) : null
      }
    })
  }

  const fieldChanges = formatFieldChanges()

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              actionConfig.bgColor,
              actionConfig.borderColor,
              "border"
            )}>
              <ActionIcon className={cn("h-4 w-4", actionConfig.color)} />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={actionConfig.variant} className="text-xs">
                  {actionConfig.label}
                </Badge>
                <span className="text-sm font-medium">
                  {getTableDisplayName(log.tableName)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{log.userEmail || t('unknownUser')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{date} {time}</span>
                </div>
              </div>
            </div>
          </div>

          {(fieldChanges || log.oldValues || log.newValues) && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
      </CardHeader>

      {(fieldChanges || log.oldValues || log.newValues) && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              
              {/* Field Changes for UPDATE operations */}
              {log.action === 'UPDATE' && fieldChanges && fieldChanges.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('changedFields')}
                  </h4>
                  <div className="space-y-2">
                    {fieldChanges.map(({ field, oldValue, newValue }) => (
                      <div key={field} className="grid grid-cols-3 gap-4 text-sm">
                        <div className="font-medium text-muted-foreground min-w-0">
                          {getFieldDisplayName(log.tableName, field)}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {t('oldValue')}
                          </div>
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs break-words">
                            {formatAuditValue(log.tableName, field, oldValue, log.oldValues)}
                          </div>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {t('newValue')}
                          </div>
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800 text-xs break-words">
                            {formatAuditValue(log.tableName, field, newValue, log.newValues)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full data for INSERT operations */}
              {log.action === 'INSERT' && log.newValues && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('createdData')}
                  </h4>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <pre className="text-xs font-mono text-green-800 whitespace-pre-wrap">
                      {JSON.stringify(log.newValues, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Full data for DELETE operations */}
              {log.action === 'DELETE' && log.oldValues && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('deletedData')}
                  </h4>
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <pre className="text-xs font-mono text-red-800 whitespace-pre-wrap">
                      {JSON.stringify(log.oldValues, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Additional metadata */}
              {(log.ipAddress || log.userAgent) && (
                <div className="mt-4 pt-3 border-t space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('metadata')}
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {log.ipAddress && (
                      <div>
                        <span className="font-medium">{t('ipAddress')}:</span> {log.ipAddress}
                      </div>
                    )}
                    {log.userAgent && (
                      <div>
                        <span className="font-medium">{t('userAgent')}:</span> {log.userAgent}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  )
}