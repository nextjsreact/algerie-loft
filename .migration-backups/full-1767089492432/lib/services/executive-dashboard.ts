import { createClient } from '@/utils/supabase/server'
import { Transaction, LoftStatus } from './executive-alerts'



export interface ExecutiveMetrics {
  // Métriques financières critiques
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  cashFlow: number
  
  // Métriques opérationnelles
  totalLofts: number
  occupancyRate: number
  averageRentPrice: number
  maintenanceCosts: number
  
  // Métriques de performance
  revenueGrowth: number
  expenseGrowth: number
  occupancyTrend: number
  
  // Métriques par propriétaire
  companyRevenue: number
  thirdPartyRevenue: number
  companyProfitShare: number
  
  // Alertes critiques
  criticalAlerts: CriticalAlert[]
  
  // Tendances temporelles
  monthlyTrends: MonthlyTrend[]
  yearOverYearComparison: YearComparison
}

export interface CriticalAlert {
  id: string
  type: 'revenue_drop' | 'occupancy_critical' | 'cash_flow' | 'maintenance_overdue' | 'payment_delay'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  data: any
  createdAt: string
  resolved: boolean
}

export interface MonthlyTrend {
  month: string
  revenue: number
  expenses: number
  profit: number
  occupancyRate: number
  newLofts: number
}

export interface YearComparison {
  currentYear: {
    revenue: number
    expenses: number
    profit: number
    occupancyRate: number
  }
  previousYear: {
    revenue: number
    expenses: number
    profit: number
    occupancyRate: number
  }
  growth: {
    revenue: number
    expenses: number
    profit: number
    occupancyRate: number
  }
}

export async function getExecutiveMetrics(userId: string): Promise<ExecutiveMetrics> {
  const supabase = await createClient()
  
  // Vérifier les permissions executive
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
    
  if (!profile || profile.role !== 'executive') {
    throw new Error('Accès non autorisé - Niveau executive requis')
  }

  // Calculer les métriques financières
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', new Date(new Date().getFullYear(), 0, 1).toISOString())

  const revenue = transactions?.filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0
    
  const expenses = transactions?.filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  // Calculer les métriques des lofts
  const { data: lofts } = await supabase
    .from('lofts')
    .select(`
      *,
      loft_owners (
        name,
        ownership_type
      )
    `)

  const totalLofts = lofts?.length || 0
  const occupiedLofts = lofts?.filter(l => l.status === 'occupied').length || 0
  const occupancyRate = totalLofts > 0 ? (occupiedLofts / totalLofts) * 100 : 0

  // Calculer les revenus par type de propriétaire
  const companyRevenue = lofts?.filter(l => l.loft_owners?.ownership_type === 'company')
    .reduce((sum, l) => sum + (Number(l.price_per_month) * (l.company_percentage / 100)), 0) || 0
    
  const thirdPartyRevenue = lofts?.filter(l => l.loft_owners?.ownership_type === 'third_party')
    .reduce((sum, l) => sum + (Number(l.price_per_month) * (l.company_percentage / 100)), 0) || 0

  // Récupérer les alertes critiques
  const { data: alerts } = await supabase
    .from('critical_alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  // Calculer les tendances mensuelles (12 derniers mois)
  const monthlyTrends = await calculateMonthlyTrends(supabase)
  
  // Calculer la comparaison année sur année
  const yearOverYearComparison = await calculateYearOverYear(supabase)

  return {
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: revenue - expenses,
    profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
    cashFlow: revenue - expenses,
    
    totalLofts,
    occupancyRate,
    averageRentPrice: totalLofts > 0 ? lofts!.reduce((sum, l) => sum + Number(l.price_per_month), 0) / totalLofts : 0,
    maintenanceCosts: transactions?.filter(t => t.category === 'maintenance')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    
    revenueGrowth: await calculateGrowthRate(supabase, 'income'),
    expenseGrowth: await calculateGrowthRate(supabase, 'expense'),
    occupancyTrend: await calculateOccupancyTrend(supabase),
    
    companyRevenue,
    thirdPartyRevenue,
    companyProfitShare: companyRevenue + thirdPartyRevenue > 0 ? 
      (companyRevenue / (companyRevenue + thirdPartyRevenue)) * 100 : 0,
    
    criticalAlerts: alerts?.map(alert => ({
      id: alert.id,
      type: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      data: alert.data,
      createdAt: alert.created_at,
      resolved: alert.resolved
    })) || [],
    
    monthlyTrends,
    yearOverYearComparison
  }
}

async function calculateMonthlyTrends(supabase: any): Promise<MonthlyTrend[]> {
  const trends: MonthlyTrend[] = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    
    const { data: monthTransactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', date.toISOString())
      .lt('date', nextDate.toISOString())
    
    const revenue = monthTransactions?.filter((t: Transaction) => t.transaction_type === 'income')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
    const expenses = monthTransactions?.filter((t: Transaction) => t.transaction_type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
    
    // Calculer le taux d'occupation pour ce mois (approximation)
    const { data: lofts } = await supabase
      .from('lofts')
      .select('status')
    
    const occupancyRate = lofts ? 
      (lofts.filter((l: LoftStatus) => l.status === 'occupied').length / lofts.length) * 100 : 0
    
    trends.push({
      month: date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
      revenue,
      expenses,
      profit: revenue - expenses,
      occupancyRate,
      newLofts: 0 // À implémenter si nécessaire
    })
  }
  
  return trends
}

async function calculateYearOverYear(supabase: any): Promise<YearComparison> {
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1
  
  // Données année courante
  const { data: currentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', new Date(currentYear, 0, 1).toISOString())
    .lt('date', new Date(currentYear + 1, 0, 1).toISOString())
  
  // Données année précédente
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', new Date(previousYear, 0, 1).toISOString())
    .lt('date', new Date(previousYear + 1, 0, 1).toISOString())
  
  const currentRevenue = currentTransactions?.filter((t: Transaction) => t.transaction_type === 'income')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  const currentExpenses = currentTransactions?.filter((t: Transaction) => t.transaction_type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
    
  const previousRevenue = previousTransactions?.filter((t: Transaction) => t.transaction_type === 'income')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  const previousExpenses = previousTransactions?.filter((t: Transaction) => t.transaction_type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  
  return {
    currentYear: {
      revenue: currentRevenue,
      expenses: currentExpenses,
      profit: currentRevenue - currentExpenses,
      occupancyRate: 0 // À calculer si historique disponible
    },
    previousYear: {
      revenue: previousRevenue,
      expenses: previousExpenses,
      profit: previousRevenue - previousExpenses,
      occupancyRate: 0
    },
    growth: {
      revenue: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      expenses: previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0,
      profit: previousRevenue - previousExpenses > 0 ? 
        (((currentRevenue - currentExpenses) - (previousRevenue - previousExpenses)) / (previousRevenue - previousExpenses)) * 100 : 0,
      occupancyRate: 0
    }
  }
}

async function calculateGrowthRate(supabase: any, type: 'income' | 'expense'): Promise<number> {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  
  const { data: currentData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('transaction_type', type)
    .gte('date', currentMonth.toISOString())
  
  const { data: previousData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('transaction_type', type)
    .gte('date', previousMonth.toISOString())
    .lt('date', currentMonth.toISOString())
  
  const currentTotal = currentData?.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  const previousTotal = previousData?.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  
  return previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
}

async function calculateOccupancyTrend(supabase: any): Promise<number> {
  // Implémentation simplifiée - à améliorer avec des données historiques
  const { data: lofts } = await supabase
    .from('lofts')
    .select('status')
  
  if (!lofts || lofts.length === 0) return 0
  
  const occupancyRate = (lofts.filter((l: LoftStatus) => l.status === 'occupied').length / lofts.length) * 100
  
  // Retourner une tendance simulée (à remplacer par des données réelles)
  return Math.random() * 10 - 5 // Entre -5% et +5%
}

export async function createCriticalAlert(
  type: string,
  severity: string,
  title: string,
  description: string,
  data?: any
): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('critical_alerts')
    .insert({
      alert_type: type,
      severity,
      title,
      description,
      data: data || {}
    })
}

export async function resolveCriticalAlert(alertId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('critical_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId
    })
    .eq('id', alertId)
}