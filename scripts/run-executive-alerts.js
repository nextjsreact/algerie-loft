#!/usr/bin/env node

/**
 * Script pour exécuter les vérifications d'alertes exécutives
 * À utiliser avec un cron job ou un scheduler
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkExecutiveAlerts() {
  console.log('🔍 Démarrage de la vérification des alertes exécutives...')
  
  try {
    // Vérifier le taux d'occupation
    await checkOccupancyRate()
    
    // Vérifier les tendances financières
    await checkFinancialTrends()
    
    // Vérifier les tâches de maintenance
    await checkMaintenanceOverdue()
    
    console.log('✅ Vérification des alertes terminée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des alertes:', error)
    process.exit(1)
  }
}

async function checkOccupancyRate() {
  const { data: lofts, error } = await supabase
    .from('lofts')
    .select('status')
  
  if (error) {
    console.error('Erreur lors de la récupération des lofts:', error)
    return
  }
  
  if (!lofts || lofts.length === 0) {
    console.log('ℹ️ Aucun loft trouvé')
    return
  }
  
  const occupancyRate = (lofts.filter(l => l.status === 'occupied').length / lofts.length) * 100
  console.log(`📊 Taux d'occupation actuel: ${occupancyRate.toFixed(1)}%`)
  
  if (occupancyRate < 70) {
    await createCriticalAlert(
      'occupancy_critical',
      occupancyRate < 50 ? 'critical' : 'high',
      `Taux d'occupation critique: ${occupancyRate.toFixed(1)}%`,
      `Le taux d'occupation est tombé à ${occupancyRate.toFixed(1)}%, en dessous du seuil critique de 70%. Action immédiate requise.`,
      { occupancyRate, totalLofts: lofts.length, occupiedLofts: lofts.filter(l => l.status === 'occupied').length }
    )
    console.log('⚠️ Alerte d\'occupation critique créée')
  }
}

async function checkFinancialTrends() {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
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
  
  const currentTotal = currentRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const previousTotal = previousRevenue?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  
  console.log(`💰 Revenus - Courant: ${currentTotal.toLocaleString()} DZD, Précédent: ${previousTotal.toLocaleString()} DZD`)
  
  if (previousTotal > 0) {
    const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100
    console.log(`📈 Variation des revenus: ${changePercent.toFixed(1)}%`)
    
    if (changePercent < -15) {
      await createCriticalAlert(
        'revenue_drop',
        'critical',
        `Chute critique des revenus: ${changePercent.toFixed(1)}%`,
        `Les revenus ont chuté de ${Math.abs(changePercent).toFixed(1)}% par rapport au mois précédent.`,
        { currentRevenue: currentTotal, previousRevenue: previousTotal, changePercent }
      )
      console.log('🚨 Alerte de chute de revenus critique créée')
    }
  }
}

async function checkMaintenanceOverdue() {
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .ilike('description', '%maintenance%')
    .lt('due_date', new Date().toISOString())
  
  const overdueCount = overdueTasks?.length || 0
  console.log(`🔧 Tâches de maintenance en retard: ${overdueCount}`)
  
  if (overdueCount > 5) {
    await createCriticalAlert(
      'maintenance_overdue',
      'medium',
      `${overdueCount} tâches de maintenance en retard`,
      `Il y a ${overdueCount} tâches de maintenance en retard qui nécessitent une attention immédiate.`,
      { overdueCount, tasks: overdueTasks?.slice(0, 5) }
    )
    console.log('⚠️ Alerte de maintenance en retard créée')
  }
}

async function createCriticalAlert(type, severity, title, description, data = {}) {
  const { error } = await supabase
    .from('critical_alerts')
    .insert({
      alert_type: type,
      severity,
      title,
      description,
      data,
      resolved: false,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Erreur lors de la création de l\'alerte:', error)
  }
}

// Exécuter le script
if (require.main === module) {
  checkExecutiveAlerts()
    .then(() => {
      console.log('🎯 Script d\'alertes exécutives terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { checkExecutiveAlerts }