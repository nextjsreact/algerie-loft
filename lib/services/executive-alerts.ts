import { createClient } from '@/utils/supabase/server'
import { createCriticalAlert } from './executive-dashboard'

/**
 * Système d'alertes automatiques pour le niveau exécutif
 * Surveille les métriques critiques et génère des alertes
 */

export interface AlertThreshold {
  metric: string
  threshold: number
  comparison: 'greater_than' | 'less_than' | 'percentage_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface Transaction {
  amount: number;
  transaction_type: string;
}

// Seuils d'alerte configurables
const ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'occupancy_rate',
    threshold: 70, // Moins de 70% d'occupation
    comparison: 'less_than',
    severity: 'high'
  },
  {
    metric: 'revenue_drop',
    threshold: -15, // Baisse de revenus de plus de 15%
    comparison: 'less_than',
    severity: 'critical'
  },
  {
    metric: 'expense_increase',
    threshold: 25, // Augmentation des dépenses de plus de 25%
    comparison: 'greater_than',
    severity: 'high'
  },
  {
    metric: 'cash_flow',
    threshold: 0, // Cash flow négatif
    comparison: 'less_than',
    severity: 'critical'
  },
  {
    metric: 'maintenance_overdue',
    threshold: 5, // Plus de 5 tâches de maintenance en retard
    comparison: 'greater_than',
    severity: 'medium'
  }
]

export async function checkExecutiveAlerts(): Promise<void> {
  const supabase = await createClient()
  
  try {
    // Vérifier le taux d'occupation
    await checkOccupancyRate(supabase)
    
    // Vérifier les tendances financières
    await checkFinancialTrends(supabase)
    
    // Vérifier les tâches de maintenance
    await checkMaintenanceOverdue(supabase)
    
    // Vérifier les factures en retard
    await checkOverdueBills(supabase)
    
    // Vérifier les anomalies de transactions
    await checkTransactionAnomalies(supabase)
    
    console.log('Vérification des alertes exécutives terminée')
  } catch (error) {
    console.error('Erreur lors de la vérification des alertes:', error)
  }
}

export interface LoftStatus {
  status: string;
}

async function checkOccupancyRate(supabase: any): Promise<void> {
  const { data: lofts } = await supabase
    .from('lofts')
    .select('status')
  
  if (!lofts || lofts.length === 0) return
  
  const occupancyRate = (lofts.filter((l: LoftStatus) => l.status === 'occupied').length / lofts.length) * 100
  
  if (occupancyRate < 70) {
    await createCriticalAlert(
      'occupancy_critical',
      occupancyRate < 50 ? 'critical' : 'high',
      `Taux d'occupation critique: ${occupancyRate.toFixed(1)}%`,
      `Le taux d'occupation est tombé à ${occupancyRate.toFixed(1)}%, en dessous du seuil critique de 70%. Action immédiate requise pour améliorer la commercialisation.`,
      { occupancyRate, totalLofts: lofts.length, occupiedLofts: lofts.filter((l: LoftStatus) => l.status === 'occupied').length }
    )
  }
}

async function checkFinancialTrends(supabase: any): Promise<void> {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  
  // Revenus du mois courant
  const { data: currentRevenue } = await supabase
    .from('transactions')
    .select('amount')
    .eq('transaction_type', 'income')
    .gte('date', currentMonth.toISOString())
  
  // Revenus du mois précédent
  const { data: previousRevenue } = await supabase
    .from('transactions')
    .select('amount')
    .eq('transaction_type', 'income')
    .gte('date', previousMonth.toISOString())
    .lt('date', currentMonth.toISOString())
  
  const currentTotal = currentRevenue?.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  const previousTotal = previousRevenue?.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  
  if (previousTotal > 0) {
    const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100
    
    if (changePercent < -15) {
      await createCriticalAlert(
        'revenue_drop',
        'critical',
        `Chute critique des revenus: ${changePercent.toFixed(1)}%`,
        `Les revenus ont chuté de ${Math.abs(changePercent).toFixed(1)}% par rapport au mois précédent. Investigation urgente nécessaire.`,
        { currentRevenue: currentTotal, previousRevenue: previousTotal, changePercent }
      )
    }
  }
  
  // Vérifier les dépenses
  const { data: currentExpenses } = await supabase
    .from('transactions')
    .select('amount')
    .eq('transaction_type', 'expense')
    .gte('date', currentMonth.toISOString())
  
  const { data: previousExpenses } = await supabase
    .from('transactions')
    .select('amount')
    .eq('transaction_type', 'expense')
    .gte('date', previousMonth.toISOString())
    .lt('date', currentMonth.toISOString())
  
  const currentExpenseTotal = currentExpenses?.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  const previousExpenseTotal = previousExpenses?.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
  
  if (previousExpenseTotal > 0) {
    const expenseChangePercent = ((currentExpenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100
    
    if (expenseChangePercent > 25) {
      await createCriticalAlert(
        'expense_spike',
        'high',
        `Augmentation importante des dépenses: +${expenseChangePercent.toFixed(1)}%`,
        `Les dépenses ont augmenté de ${expenseChangePercent.toFixed(1)}% par rapport au mois précédent. Révision budgétaire recommandée.`,
        { currentExpenses: currentExpenseTotal, previousExpenses: previousExpenseTotal, changePercent: expenseChangePercent }
      )
    }
  }
  
  // Vérifier le cash flow
  const cashFlow = currentTotal - currentExpenseTotal
  if (cashFlow < 0) {
    await createCriticalAlert(
      'cash_flow',
      'critical',
      'Cash flow négatif détecté',
      `Le cash flow du mois courant est négatif (${cashFlow.toLocaleString()} DZD). Mesures correctives urgentes requises.`,
      { cashFlow, revenue: currentTotal, expenses: currentExpenseTotal }
    )
  }
}

async function checkMaintenanceOverdue(supabase: any): Promise<void> {
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .like('description', '%maintenance%')
    .lt('due_date', new Date().toISOString())
  
  if (overdueTasks && overdueTasks.length > 5) {
    await createCriticalAlert(
      'maintenance_overdue',
      'medium',
      `${overdueTasks.length} tâches de maintenance en retard`,
      `Il y a ${overdueTasks.length} tâches de maintenance en retard. Cela peut affecter la satisfaction des locataires et la valeur des propriétés.`,
      { overdueCount: overdueTasks.length, tasks: overdueTasks.slice(0, 5) }
    )
  }
}

async function checkOverdueBills(supabase: any): Promise<void> {
  // Cette fonction nécessiterait une table de factures
  // Pour l'instant, on simule avec les données des lofts
  const { data: lofts } = await supabase
    .from('lofts')
    .select('*')
  
  // Simulation d'alertes de factures (à remplacer par la vraie logique)
  const overdueBillsCount = Math.floor(Math.random() * 3) // Simulation
  
  if (overdueBillsCount > 0) {
    await createCriticalAlert(
      'payment_delay',
      'medium',
      `${overdueBillsCount} factures en retard de paiement`,
      `Des factures sont en retard de paiement, ce qui peut affecter les relations avec les fournisseurs et le cash flow.`,
      { overdueCount: overdueBillsCount }
    )
  }
}

async function checkTransactionAnomalies(supabase: any): Promise<void> {
  // Vérifier les transactions inhabituellement élevées
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 derniers jours
    .order('amount', { ascending: false })
    .limit(10)
  
  if (recentTransactions && recentTransactions.length > 0) {
    // Calculer la moyenne des transactions
    const amounts = recentTransactions.map((t: Transaction) => Number(t.amount))
    const average = amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length
    const maxAmount = Math.max(...amounts)
    
    // Si une transaction dépasse 3x la moyenne
    if (maxAmount > average * 3) {
      const anomalousTransaction = recentTransactions.find((t: Transaction) => Number(t.amount) === maxAmount)
      
      await createCriticalAlert(
        'transaction_anomaly',
        'medium',
        'Transaction inhabituelle détectée',
        `Une transaction de ${maxAmount.toLocaleString()} DZD a été détectée, soit ${((maxAmount / average) * 100).toFixed(0)}% au-dessus de la moyenne. Vérification recommandée.`,
        { transaction: anomalousTransaction, average, ratio: maxAmount / average }
      )
    }
  }
}

// Fonction à exécuter périodiquement (cron job)
export async function runExecutiveAlertsCheck(): Promise<void> {
  console.log('Démarrage de la vérification des alertes exécutives...')
  await checkExecutiveAlerts()
  console.log('Vérification des alertes exécutives terminée.')
}

// Fonction pour configurer les seuils d'alerte
export async function updateAlertThreshold(
  metric: string,
  threshold: number,
  comparison: string,
  severity: string
): Promise<void> {
  // Cette fonction permettrait de configurer les seuils dynamiquement
  // À implémenter avec une table de configuration
  console.log(`Mise à jour du seuil d'alerte: ${metric} = ${threshold}`)
}