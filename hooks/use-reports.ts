/**
 * HOOKS POUR LA GÉNÉRATION DE RAPPORTS
 * ====================================
 * 
 * Hooks React pour récupérer les données et générer les rapports PDF
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PDFReportGenerator, type Transaction, type Loft, type Owner, type ReportOptions } from '@/lib/pdf-generator'
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

  // Récupérer les données de base
  const fetchLofts = useCallback(async (): Promise<Loft[]> => {
    const { data, error } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        address,
        price_per_month,
        loft_owners (
          name
        )
      `)
      .order('name')

    if (error) throw new Error(`Erreur lors de la récupération des lofts: ${error.message}`)

    return data.map(loft => ({
      id: loft.id,
      name: loft.name,
      address: loft.address,
      price_per_month: loft.price_per_month,
      owner_name: loft.loft_owners?.name || 'Propriétaire inconnu'
    }))
  }, [supabase])

  const fetchOwners = useCallback(async (): Promise<Owner[]> => {
    const { data, error } = await supabase
      .from('loft_owners')
      .select(`
        id,
        name,
        email,
        phone,
        lofts (count)
      `)
      .order('name')

    if (error) throw new Error(`Erreur lors de la récupération des propriétaires: ${error.message}`)

    return data.map(owner => ({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      lofts_count: owner.lofts?.[0]?.count || 0
    }))
  }, [supabase])

  const fetchTransactions = useCallback(async (filters: ReportFilters): Promise<Transaction[]> => {
    let query = supabase
      .from('transactions')
      .select(`
        id,
        amount,
        description,
        transaction_type,
        category,
        date,
        loft_id,
        currency_id,
        lofts (
          id,
          name,
          loft_owners (
            name
          )
        )
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

    const { data, error } = await query

    if (error) throw new Error(`Erreur lors de la récupération des transactions: ${error.message}`)

    return data.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description || '',
      transaction_type: transaction.transaction_type,
      category: transaction.category || 'Non catégorisé',
      date: transaction.date,
      loft_id: transaction.loft_id,
      loft_name: transaction.lofts?.name || 'Loft inconnu',
      owner_name: transaction.lofts?.loft_owners?.name || 'Propriétaire inconnu',
      currency: transaction.currency_id || 'DZD'
    }))
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

      // Générer le PDF
      const generator = new PDFReportGenerator()
      const pdfBuffer = await generator.generateLoftReport(loft, transactions, reportOptions)

      // Télécharger le fichier
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport_loft_${loft.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Rapport généré avec succès!')

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

      // Générer le PDF
      const generator = new PDFReportGenerator()
      const pdfBuffer = await generator.generateOwnerReport(owner, ownerLofts, transactions, reportOptions)

      // Télécharger le fichier
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport_proprietaire_${owner.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Rapport généré avec succès!')

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

      // Générer le PDF
      const generator = new PDFReportGenerator()
      const pdfBuffer = await generator.generateGlobalReport(lofts, transactions, reportOptions)

      // Télécharger le fichier
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport_global_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Rapport généré avec succès!')

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