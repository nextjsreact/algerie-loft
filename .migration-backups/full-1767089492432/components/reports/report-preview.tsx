'use client'

/**
 * COMPOSANT D'APERÇU DE RAPPORT
 * =============================
 * 
 * Affiche un aperçu du rapport avant génération PDF
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useReports, type ReportFilters } from '@/hooks/use-reports'
import { useTranslations } from 'next-intl'
import type { Transaction, Loft, Owner } from '@/lib/pdf-generator'

interface ReportPreviewProps {
  type: 'loft' | 'owner' | 'global'
  filters: ReportFilters
  selectedId?: string
  onGeneratePDF: () => void
}

export function ReportPreview({ type, filters, selectedId, onGeneratePDF }: ReportPreviewProps) {
  const { fetchLofts, fetchOwners, fetchTransactions, isLoading } = useReports()
  const t = useTranslations('reports')
  
  const [data, setData] = useState<{
    loft?: Loft
    owner?: Owner
    lofts?: Loft[]
    transactions: Transaction[]
    summary: {
      totalIncome: number
      totalExpenses: number
      netResult: number
      transactionCount: number
    }
  }>({
    transactions: [],
    summary: { totalIncome: 0, totalExpenses: 0, netResult: 0, transactionCount: 0 }
  })

  useEffect(() => {
    const loadPreviewData = async () => {
      try {
        const transactions = await fetchTransactions(filters)
        
        let loft: Loft | undefined
        let owner: Owner | undefined
        let lofts: Loft[] | undefined

        if (type === 'loft' && selectedId) {
          const allLofts = await fetchLofts()
          loft = allLofts.find(l => l.id === selectedId)
        } else if (type === 'owner' && selectedId) {
          const [allOwners, allLofts] = await Promise.all([fetchOwners(), fetchLofts()])
          owner = allOwners.find(o => o.id === selectedId)
          if (owner) {
            lofts = allLofts.filter(l => l.owner_name === owner.name)
          }
        } else if (type === 'global') {
          lofts = await fetchLofts()
        }

        // Calculer le résumé
        const totalIncome = transactions
          .filter(t => t.transaction_type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const totalExpenses = transactions
          .filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        setData({
          loft,
          owner,
          lofts,
          transactions,
          summary: {
            totalIncome,
            totalExpenses,
            netResult: totalIncome - totalExpenses,
            transactionCount: transactions.length
          }
        })
      } catch (error) {
        console.error('Erreur lors du chargement de l\'aperçu:', error)
      }
    }

    if (selectedId || type === 'global') {
      loadPreviewData()
    }
  }, [type, filters, selectedId, fetchLofts, fetchOwners, fetchTransactions])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">{t('loadingPreview')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!selectedId && type !== 'global') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('selectForPreview', { type: type === 'loft' ? 'loft' : tCommon('owner') })}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête de l'aperçu */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t('previewTitle')}
              </CardTitle>
              <CardDescription>
                {type === 'loft' && data.loft && t('loftReportFor', { name: data.loft.name })}
                {type === 'owner' && data.owner && t('ownerReportFor', { name: data.owner.name })}
                {type === 'global' && t('globalReportTitle')}
              </CardDescription>
            </div>
            <Button onClick={onGeneratePDF} className="gap-2">
              <Download className="w-4 h-4" />
              {t('generatePdf')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(filters.startDate, 'dd/MM/yyyy', { locale: fr })} - {format(filters.endDate, 'dd/MM/yyyy', { locale: fr })}
            </div>
            <Badge variant="outline">
              {data.summary.transactionCount} transaction{data.summary.transactionCount > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Informations spécifiques */}
      {type === 'loft' && data.loft && (
        <Card>
          <CardHeader>
            <CardTitle>{t('loftInformation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('name')}</p>
                <p className="font-medium">{data.loft.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('owner')}</p>
                <p className="font-medium">{data.loft.owner_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('address')}</p>
                <p className="font-medium">{data.loft.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('pricePerNight')}</p>
                <p className="font-medium">{data.loft.price_per_night.toLocaleString()} DA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'owner' && data.owner && (
        <Card>
          <CardHeader>
            <CardTitle>{t('ownerInformation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('name')}</p>
                <p className="font-medium">{data.owner.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('email')}</p>
                <p className="font-medium">{data.owner.email || t('notProvided')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('phone')}</p>
                <p className="font-medium">{data.owner.phone || t('notProvided')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('numberOfLofts')}</p>
                <p className="font-medium">{data.owner.lofts_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé financier */}
      <Card>
        <CardHeader>
          <CardTitle>{t('financialSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                <p className="text-xl font-bold text-green-600">
                  {data.summary.totalIncome.toLocaleString()} DA
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
              <TrendingDown className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('totalExpenses')}</p>
                <p className="text-xl font-bold text-red-600">
                  {data.summary.totalExpenses.toLocaleString()} DA
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('netResult')}</p>
                <p className={`text-xl font-bold ${data.summary.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.summary.netResult.toLocaleString()} DA
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des lofts (pour propriétaire et global) */}
      {(type === 'owner' || type === 'global') && data.lofts && data.lofts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {type === 'owner' ? t('ownerLofts') : t('allLofts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('owner')}</TableHead>
                  <TableHead>{t('address')}</TableHead>
                  <TableHead className="text-right">{t('pricePerNight')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lofts.map((loft) => (
                  <TableRow key={loft.id}>
                    <TableCell className="font-medium">{loft.name}</TableCell>
                    <TableCell>{loft.owner_name}</TableCell>
                    <TableCell>{loft.address}</TableCell>
                    <TableCell className="text-right">
                      {loft.price_per_night.toLocaleString()} DA
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Aperçu des transactions */}
      {data.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('transactionPreview')}</CardTitle>
            <CardDescription>
              {data.transactions.length > 10 
                ? t('showingFirst', { count: 10, total: data.transactions.length })
                : t('totalTransactions', { 
                    count: data.transactions.length, 
                    plural: data.transactions.length > 1 ? 's' : '' 
                  })
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.transaction_type === 'income' ? 'default' : 'secondary'}>
                        {transaction.transaction_type === 'income' ? t('revenue') : t('expenses')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.amount.toLocaleString()} DA
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {data.transactions.length > 10 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('andOthers', { count: data.transactions.length - 10 })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.transactions.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>{t('noTransactionsFound')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}