'use client'

/**
 * COMPOSANT DE GÉNÉRATION DE RAPPORTS
 * ===================================
 * 
 * Interface utilisateur pour générer des rapports PDF
 * Supporte les rapports par loft, par propriétaire, et globaux
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Temporarily removing Select components to fix Radix errors
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, FileText, Download, TrendingUp, TrendingDown, DollarSign, Hash } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useReports, type ReportFilters } from '@/hooks/use-reports'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface QuickStats {
  totalIncome: number
  totalExpenses: number
  netResult: number
  transactionCount: number
}

export function ReportGenerator() {
  const t = useTranslations('reports')
  const {
    isLoading,
    error,
    generateLoftReport,
    generateOwnerReport,
    generateGlobalReport,
    getQuickStats,
    fetchLofts,
    fetchOwners
  } = useReports()

  // États pour les données
  const [lofts, setLofts] = useState<any[]>([])
  const [owners, setOwners] = useState<any[]>([])
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // États pour les filtres
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    transactionType: 'all'
  })

  // États pour les options de rapport
  const [reportOptions, setReportOptions] = useState({
    includeDetails: true,
    includeSummary: true,
    groupBy: 'category'
  })

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true)
      try {
        console.log('🔄 Chargement des vraies données depuis les tables lofts, owners et transactions...')
        
        const [loftsData, ownersData] = await Promise.all([
          fetchLofts().catch(err => {
            console.error('❌ Erreur fetchLofts:', err)
            toast.error(`Erreur lors du chargement des lofts: ${err.message}`)
            return []
          }),
          fetchOwners().catch(err => {
            console.error('❌ Erreur fetchOwners:', err)
            toast.error(`Erreur lors du chargement des propriétaires: ${err.message}`)
            return []
          })
        ])
        
        console.log('✅ Données chargées depuis les vraies tables:', { 
          lofts: loftsData.length, 
          owners: ownersData.length 
        })
        
        setLofts(loftsData)
        setOwners(ownersData)
        
        if (loftsData.length === 0) {
          toast.warning('Aucun loft trouvé. Vérifiez les permissions RLS ou ajoutez des lofts.')
        }
        if (ownersData.length === 0) {
          toast.warning('Aucun propriétaire trouvé. Vérifiez les permissions RLS ou ajoutez des propriétaires.')
        } else {
          toast.success(`${loftsData.length} lofts et ${ownersData.length} propriétaires chargés depuis la base de données`)
        }
        
      } catch (err) {
        console.error('❌ Erreur générale lors du chargement des données:', err)
        toast.error(`Erreur lors du chargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [fetchLofts, fetchOwners, t])

  // Mettre à jour les statistiques quand les filtres changent
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await getQuickStats(filters)
        setQuickStats(stats)
      } catch (err) {
        console.error('Erreur lors du calcul des statistiques:', err)
        setQuickStats({
          totalIncome: 0,
          totalExpenses: 0,
          netResult: 0,
          transactionCount: 0
        })
      }
    }

    updateStats()
  }, [filters, getQuickStats])

  // Gestionnaires d'événements
  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleQuickDateRange = (range: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'week':
        startDate = subDays(now, 7)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        startDate = quarterStart
        endDate = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default:
        return
    }

    setFilters(prev => ({ ...prev, startDate, endDate }))
  }

  const handleGenerateReport = async (type: 'loft' | 'owner' | 'global', id?: string) => {
    try {
      switch (type) {
        case 'loft':
          if (!id) {
            toast.error(t('selectLoftError'))
            return
          }
          await generateLoftReport(id, filters, reportOptions)
          break
        case 'owner':
          if (!id) {
            toast.error(t('selectOwnerError'))
            return
          }
          await generateOwnerReport(id, filters, reportOptions)
          break
        case 'global':
          await generateGlobalReport(filters, reportOptions)
          break
      }
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête amélioré */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
          <FileText className="w-4 h-4" />
          {t('pdfGeneration')}
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          {t('financialReports')}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('generateDetailedReports')}
        </p>
      </div>

      {/* Statistiques rapides améliorées */}
      {quickStats && (
        <>
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">📊</span>
              <h4 className="font-semibold text-green-800">Données de la base de données</h4>
            </div>
            <p className="text-sm text-green-700">
              Les rapports utilisent les vraies données de vos tables <code>lofts</code>, <code>owners</code> et <code>transactions</code>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('revenue')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {quickStats.totalIncome.toLocaleString()} DA
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{t('expenses')}</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {quickStats.totalExpenses.toLocaleString()} DA
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-full">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('netResult')}</p>
                  <p className={`text-2xl font-bold ${quickStats.netResult >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {quickStats.netResult.toLocaleString()} DA
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('transactionsCount')}</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {quickStats.transactionCount}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-full">
                  <Hash className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filtres améliorés */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-800/50 dark:to-slate-800/50 border-0 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-500 to-slate-500"></div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                {t('reportFilters')}
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              {t('configureFilters')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Période rapide */}
            <div>
              <Label className="text-sm font-medium">{t('quickPeriod')}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { key: 'today', label: t('today') },
                  { key: 'week', label: t('sevenDays') },
                  { key: 'month', label: t('thisMonth') },
                  { key: 'quarter', label: t('quarter') },
                  { key: 'year', label: t('thisYear') }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateRange(key)}
                    className="hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all duration-300"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Dates personnalisées */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="startDate">{t('startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={format(filters.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleFilterChange('startDate', new Date(e.target.value))}
                  placeholder="jj/mm/aaaa"
                />
              </div>

              <div>
                <Label htmlFor="endDate">{t('endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={format(filters.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleFilterChange('endDate', new Date(e.target.value))}
                  placeholder="jj/mm/aaaa"
                />
              </div>
            </div>

            <Separator />

            {/* Type de transaction */}
            <div>
              <Label>{t('transactionType')}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              >
                <option value="all">{t('allTransactions')}</option>
                <option value="income">{t('revenueOnly')}</option>
                <option value="expense">{t('expensesOnly')}</option>
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <Label>{t('category')}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              >
                <option value="">{t('allCategories')}</option>
                <option value="rent">{t('rent')}</option>
                <option value="maintenance">{t('maintenance')}</option>
                <option value="utilities">{t('utilities')}</option>
                <option value="insurance">{t('insurance')}</option>
                <option value="taxes">{t('taxes')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>

            <Separator />

            {/* Options du rapport */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('reportOptions')}</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={reportOptions.includeDetails}
                  onCheckedChange={(checked) => 
                    setReportOptions(prev => ({ ...prev, includeDetails: !!checked }))
                  }
                />
                <Label htmlFor="includeDetails" className="text-sm">
                  {t('includeDetails')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={reportOptions.includeSummary}
                  onCheckedChange={(checked) => 
                    setReportOptions(prev => ({ ...prev, includeSummary: !!checked }))
                  }
                />
                <Label htmlFor="includeSummary" className="text-sm">
                  {t('includeSummary')}
                </Label>
              </div>

              <div>
                <Label className="text-sm">{t('groupBy')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={reportOptions.groupBy}
                  onChange={(e) => 
                    setReportOptions(prev => ({ ...prev, groupBy: e.target.value }))
                  }
                >
                  <option value="category">{t('groupByCategory')}</option>
                  <option value="loft">{t('groupByLoft')}</option>
                  <option value="month">{t('groupByMonth')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Génération de rapports */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('generateReports')}</CardTitle>
            <CardDescription>
              {t('chooseReportType')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="loft" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="loft">{t('byLoft')}</TabsTrigger>
                <TabsTrigger value="owner">{t('byOwner')}</TabsTrigger>
                <TabsTrigger value="global">{t('globalReportTab')}</TabsTrigger>
              </TabsList>

              {/* Rapport par loft */}
              <TabsContent value="loft" className="space-y-4">
                <div>
                  <Label>{t('selectLoft')}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setFilters(prev => ({ ...prev, loftId: e.target.value }))}
                    defaultValue=""
                    disabled={dataLoading}
                  >
                    <option value="">
                      {dataLoading ? 'Chargement...' : lofts.length === 0 ? 'Aucun loft disponible' : t('chooseLoft')}
                    </option>
                    {lofts.map((loft) => (
                      <option key={loft.id} value={loft.id}>
                        {loft.name} - {loft.owner_name}
                      </option>
                    ))}
                  </select>
                  {!dataLoading && lofts.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Aucun loft accessible. Vérifiez les permissions RLS ou l'authentification.
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleGenerateReport('loft', filters.loftId)}
                  disabled={isLoading || !filters.loftId}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isLoading ? t('generatingInProgress') : t('generateLoftReport')}
                </Button>
                
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    💡 Le rapport s'ouvrira dans une nouvelle fenêtre. Utilisez <strong>Ctrl+P</strong> (ou Cmd+P sur Mac) pour l'imprimer en PDF.
                  </p>
                </div>
              </TabsContent>

              {/* Rapport par propriétaire */}
              <TabsContent value="owner" className="space-y-4">
                <div>
                  <Label>{t('selectOwner')}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setFilters(prev => ({ ...prev, ownerId: e.target.value }))}
                    defaultValue=""
                    disabled={dataLoading}
                  >
                    <option value="">
                      {dataLoading ? 'Chargement...' : owners.length === 0 ? 'Aucun propriétaire disponible' : t('chooseOwner')}
                    </option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.lofts_count} loft{owner.lofts_count > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  {!dataLoading && owners.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Aucun propriétaire accessible. Vérifiez les permissions RLS ou l'authentification.
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleGenerateReport('owner', filters.ownerId)}
                  disabled={isLoading || !filters.ownerId}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isLoading ? t('generatingInProgress') : t('generateOwnerReport')}
                </Button>
                
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    💡 Le rapport s'ouvrira dans une nouvelle fenêtre. Utilisez <strong>Ctrl+P</strong> (ou Cmd+P sur Mac) pour l'imprimer en PDF.
                  </p>
                </div>
              </TabsContent>

              {/* Rapport global */}
              <TabsContent value="global" className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{t('globalReport')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('globalReportDescription')}
                  </p>
                </div>

                <Button
                  onClick={() => handleGenerateReport('global')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isLoading ? t('generatingInProgress') : t('generateGlobalReport')}
                </Button>
                
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    💡 Le rapport s'ouvrira dans une nouvelle fenêtre. Utilisez <strong>Ctrl+P</strong> (ou Cmd+P sur Mac) pour l'imprimer en PDF.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Affichage des erreurs */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informations sur les rapports */}
      <Card>
        <CardHeader>
          <CardTitle>{t('aboutPdfReports')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Comment utiliser les rapports PDF</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Configurez vos filtres et options de rapport</li>
              <li>2. Cliquez sur "Générer le rapport" - une nouvelle fenêtre s'ouvrira</li>
              <li>3. Dans la nouvelle fenêtre, utilisez <strong>Ctrl+P</strong> (ou Cmd+P sur Mac)</li>
              <li>4. Sélectionnez "Enregistrer au format PDF" comme destination</li>
              <li>5. Choisissez votre dossier de téléchargement et enregistrez</li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">{t('loftReportTitle')}</h4>
              <div className="text-muted-foreground whitespace-pre-line">
                {t('loftReportInfo')}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">{t('ownerReportTitle')}</h4>
              <div className="text-muted-foreground whitespace-pre-line">
                {t('ownerReportInfo')}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">{t('globalReportTitle')}</h4>
              <div className="text-muted-foreground whitespace-pre-line">
                {t('globalReportInfo')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}