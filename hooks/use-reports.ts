/**
 * HOOKS POUR LA GÉNÉRATION DE RAPPORTS
 * ====================================
 * 
 * Hooks React pour récupérer les données et générer les rapports PDF
 * Version adaptée pour utiliser les réservations comme source de données
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { HTMLPDFGenerator, type Transaction, type Loft, type Owner, type ReportOptions } from '@/lib/html-pdf-generator'
import { toast } from 'sonner'

export interface ReportFilters {
  startDate: Date
  endDate: Date
  loftId?: string
  ownerId?: string
  category?: string
  transactionType?: 'income' | 'expense' | 'all'
}

export function useReports() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Récupérer les données de base (vraies tables)
  const fetchLofts = useCallback(async (): Promise<Loft[]> => {
    try {
      console.log('🔍 [DEBUG] Début fetchLofts...')
      
      // Récupérer les lofts avec leurs propriétaires
      const { data: loftsData, error: loftsError } = await supabase
        .from('lofts')
        .select(`
          id,
          name,
          address,
          price_per_night,
          owner_id
        `)
        .order('name')

      console.log('🔍 [DEBUG] Résultat requête lofts:', {
        count: loftsData?.length || 0,
        error: loftsError?.message,
        sampleData: loftsData?.[0]
      })

      if (loftsError) throw new Error(`Erreur lors de la récupération des lofts: ${loftsError.message}`)

      // Récupérer les propriétaires de la table owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owners')
        .select('id, name')

      console.log('🔍 [DEBUG] Résultat requête owners dans fetchLofts:', {
        count: ownersData?.length || 0,
        error: ownersError?.message,
        data: ownersData
      })

      if (ownersError) throw new Error(`Erreur lors de la récupération des propriétaires: ${ownersError.message}`)

      // Créer un map des propriétaires pour un accès rapide
      const ownersMap = new Map(ownersData?.map(owner => [owner.id, owner.name]) || [])

      console.log('🔍 [DEBUG] Map des propriétaires:', Object.fromEntries(ownersMap))

      const result = loftsData?.map(loft => ({
        id: loft.id,
        name: loft.name,
        address: loft.address,
        price_per_month: loft.price_per_night || 0,
        owner_name: ownersMap.get(loft.owner_id) || 'Propriétaire inconnu'
      })) || []

      console.log('🔍 [DEBUG] Résultat final fetchLofts:', result.length, 'lofts')

      return result
    } catch (error) {
      console.error('❌ [DEBUG] Error in fetchLofts:', error)
      throw error
    }
  }, [supabase])

  const fetchOwners = useCallback(async (): Promise<Owner[]> => {
    try {
      console.log('🔍 [DEBUG] Début fetchOwners...')
      
      // Récupérer les propriétaires de la table owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owners')
        .select(`
          id,
          name,
          email,
          phone
        `)
        .order('name')

      console.log('🔍 [DEBUG] Résultat requête owners:', {
        count: ownersData?.length || 0,
        error: ownersError?.message,
        data: ownersData
      })

      if (ownersError) throw new Error(`Erreur lors de la récupération des propriétaires: ${ownersError.message}`)

      // Compter les lofts pour chaque propriétaire
      const { data: loftsData, error: loftsError } = await supabase
        .from('lofts')
        .select('owner_id')

      console.log('🔍 [DEBUG] Résultat requête lofts pour comptage:', {
        count: loftsData?.length || 0,
        error: loftsError?.message,
        ownerIds: loftsData?.map(l => l.owner_id)
      })

      if (loftsError) {
        console.warn('Impossible de compter les lofts:', loftsError.message)
      }

      // Créer un map du nombre de lofts par propriétaire
      const loftCounts = new Map<string, number>()
      loftsData?.forEach(loft => {
        if (loft.owner_id) {
          loftCounts.set(loft.owner_id, (loftCounts.get(loft.owner_id) || 0) + 1)
        }
      })

      console.log('🔍 [DEBUG] Comptage des lofts par propriétaire:', Object.fromEntries(loftCounts))

      const result = ownersData?.map(owner => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        lofts_count: loftCounts.get(owner.id) || 0
      })) || []

      console.log('🔍 [DEBUG] Résultat final fetchOwners:', result)

      return result
    } catch (error) {
      console.error('❌ [DEBUG] Error in fetchOwners:', error)
      throw error
    }
  }, [supabase])

  const fetchTransactions = useCallback(async (filters: ReportFilters): Promise<Transaction[]> => {
    try {
      // Récupérer les transactions de la vraie table avec le montant converti
      let query = supabase
        .from('transactions')
        .select(`
          id,
          amount,
          equivalent_amount_default_currency,
          description,
          transaction_type,
          category,
          date,
          loft_id,
          currency_id
        `)
        .gte('date', filters.startDate.toISOString())
        .lte('date', filters.endDate.toISOString())
        .order('date', { ascending: true })

      // Filtres optionnels
      if (filters.loftId) {
        query = query.eq('loft_id', filters.loftId)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.transactionType && filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType)
      }

      const { data: transactionsData, error: transactionsError } = await query

      if (transactionsError) throw new Error(`Erreur lors de la récupération des transactions: ${transactionsError.message}`)

      // Récupérer les lofts et propriétaires pour enrichir les données
      const { data: loftsData, error: loftsError } = await supabase
        .from('lofts')
        .select('id, name, owner_id')

      // Récupérer les propriétaires de la table owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owners')
        .select('id, name')

      // Créer des maps pour un accès rapide
      const loftsMap = new Map(loftsData?.map(loft => [loft.id, loft]) || [])
      const ownersMap = new Map(ownersData?.map(owner => [owner.id, owner.name]) || [])

      return transactionsData?.map(transaction => {
        const loft = loftsMap.get(transaction.loft_id)
        const ownerName = loft ? ownersMap.get(loft.owner_id) : undefined

        return {
          id: transaction.id,
          // Utiliser equivalent_amount_default_currency (montant déjà converti en DZD)
          amount: transaction.equivalent_amount_default_currency || transaction.amount,
          description: transaction.description || '',
          transaction_type: transaction.transaction_type,
          category: transaction.category || 'Non catégorisé',
          date: transaction.date,
          loft_id: transaction.loft_id,
          loft_name: loft?.name || 'Loft inconnu',
          owner_name: ownerName || 'Propriétaire inconnu',
          currency: 'DZD' // Toujours DZD car on utilise equivalent_amount_default_currency
        }
      }) || []
    } catch (error) {
      console.error('Error in fetchTransactions:', error)
      throw error
    }
  }, [supabase])

  // Générer un rapport par loft
  const generateLoftReport = useCallback(async (
    loftId: string,
    filters: ReportFilters,
    options: Partial<ReportOptions> = {}
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Récupérer les données
      const [lofts, transactions] = await Promise.all([
        fetchLofts(),
        fetchTransactions({ ...filters, loftId })
      ])

      const loft = lofts.find(l => l.id === loftId)
      if (!loft) {
        throw new Error('Loft non trouvé')
      }

      // Configuration du rapport
      const reportOptions: ReportOptions = {
        title: `Rapport Financier - ${loft.name}`,
        subtitle: `Période du ${filters.startDate.toLocaleDateString()} au ${filters.endDate.toLocaleDateString()}`,
        period: {
          start: filters.startDate,
          end: filters.endDate
        },
        includeDetails: true,
        includeSummary: true,
        currency: 'DZD',
        ...options
      }

      // Générer le rapport HTML
      const generator = new HTMLPDFGenerator()
      await generator.generateLoftReport(loft, transactions, reportOptions)

      toast.success('Rapport généré avec succès! Utilisez Ctrl+P pour imprimer en PDF.')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(`Erreur lors de la génération du rapport: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [fetchLofts, fetchTransactions])

  // Générer un rapport par propriétaire
  const generateOwnerReport = useCallback(async (
    ownerId: string,
    filters: ReportFilters,
    options: Partial<ReportOptions> = {}
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Récupérer les données
      const [owners, lofts, allTransactions] = await Promise.all([
        fetchOwners(),
        fetchLofts(),
        fetchTransactions(filters)
      ])

      const owner = owners.find(o => o.id === ownerId)
      if (!owner) {
        throw new Error('Propriétaire non trouvé')
      }

      const ownerLofts = lofts.filter(loft => loft.owner_name === owner.name)
      const ownerLoftIds = ownerLofts.map(loft => loft.id)
      const transactions = allTransactions.filter(t => ownerLoftIds.includes(t.loft_id || ''))

      // Configuration du rapport
      const reportOptions: ReportOptions = {
        title: `Rapport Propriétaire - ${owner.name}`,
        subtitle: `Période du ${filters.startDate.toLocaleDateString()} au ${filters.endDate.toLocaleDateString()}`,
        period: {
          start: filters.startDate,
          end: filters.endDate
        },
        includeDetails: true,
        includeSummary: true,
        currency: 'DZD',
        ...options
      }

      // Générer le rapport HTML
      const generator = new HTMLPDFGenerator()
      await generator.generateOwnerReport(owner, ownerLofts, transactions, reportOptions)

      toast.success('Rapport généré avec succès! Utilisez Ctrl+P pour imprimer en PDF.')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(`Erreur lors de la génération du rapport: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [fetchOwners, fetchLofts, fetchTransactions])

  // Générer un rapport global
  const generateGlobalReport = useCallback(async (
    filters: ReportFilters,
    options: Partial<ReportOptions> = {}
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Récupérer les données
      const [lofts, transactions] = await Promise.all([
        fetchLofts(),
        fetchTransactions(filters)
      ])

      // Configuration du rapport
      const reportOptions: ReportOptions = {
        title: 'Rapport Global - Tous les Lofts',
        subtitle: `Période du ${filters.startDate.toLocaleDateString()} au ${filters.endDate.toLocaleDateString()}`,
        period: {
          start: filters.startDate,
          end: filters.endDate
        },
        includeDetails: true,
        includeSummary: true,
        currency: 'DZD',
        ...options
      }

      // Générer le rapport HTML
      const generator = new HTMLPDFGenerator()
      await generator.generateGlobalReport(lofts, transactions, reportOptions)

      toast.success('Rapport généré avec succès! Utilisez Ctrl+P pour imprimer en PDF.')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(`Erreur lors de la génération du rapport: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [fetchLofts, fetchTransactions])

  // Récupérer les statistiques rapides
  const getQuickStats = useCallback(async (filters: ReportFilters) => {
    try {
      const transactions = await fetchTransactions(filters)
      
      const totalIncome = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        totalIncome,
        totalExpenses,
        netResult: totalIncome - totalExpenses,
        transactionCount: transactions.length
      }
    } catch (err) {
      console.error('Erreur lors du calcul des statistiques:', err)
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netResult: 0,
        transactionCount: 0
      }
    }
  }, [fetchTransactions])

  return {
    isLoading,
    error,
    generateLoftReport,
    generateOwnerReport,
    generateGlobalReport,
    getQuickStats,
    fetchLofts,
    fetchOwners,
    fetchTransactions
  }
}