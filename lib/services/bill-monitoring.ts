import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { createNotification, sendBulkNotifications } from '@/lib/services/notifications'

interface OverdueBill {
  loft_name: string;
  // Add other properties if they are used from the overdueBills object
}

interface BillAlert {
  loftId: string
  loftName: string
  ownerId: string
  utilityType: 'eau' | 'energie' | 'telephone' | 'internet'
  dueDate: string
  frequency: string
  daysUntilDue: number
  alertType: 'upcoming' | 'due_today' | 'overdue'
}

interface UpcomingBill {
  due_date: string;
  loft_id: string;
}

const UTILITY_LABELS = {
  eau: 'Water',
  energie: 'Energy',
  telephone: 'Phone',
  internet: 'Internet'
}

const ALERT_DAYS = [7, 3, 1] // Send alerts 7, 3, and 1 days before due date

export async function runBillMonitoring(): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Starting bill monitoring cycle')
    
    try {
      const alerts = await scanForBillAlerts()
      await processBillAlerts(alerts)
      await checkOverdueBills()
      
      logger.info('Bill monitoring cycle completed', { alertsProcessed: alerts.length })
    } catch (error) {
      logger.error('Bill monitoring cycle failed', error)
      throw error
    }
  }, 'runBillMonitoring')
}

// Helper function to get the appropriate Supabase client
async function getSupabaseClient() {
  // Always use server client in API routes
  return await createClient()
}

async function scanForBillAlerts(): Promise<BillAlert[]> {
  const supabase = await getSupabaseClient()
  const today = new Date()
  const alerts: BillAlert[] = []

  try {
    // Get all lofts with bill information
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        owner_id,
        frequence_paiement_eau,
        prochaine_echeance_eau,
        frequence_paiement_energie,
        prochaine_echeance_energie,
        frequence_paiement_telephone,
        prochaine_echeance_telephone,
        frequence_paiement_internet,
        prochaine_echeance_internet
      `)

    if (error) {
      throw error
    }

    // Process each loft
    for (const loft of lofts || []) {
      const utilities = ['eau', 'energie', 'telephone', 'internet'] as const

      for (const utility of utilities) {
        const dueDate = loft[`prochaine_echeance_${utility}`]
        const frequency = loft[`frequence_paiement_${utility}`]

        if (dueDate && frequency) {
          const dueDateObj = new Date(dueDate)
          const timeDiff = dueDateObj.getTime() - today.getTime()
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24))

          // Check if we should send an alert
          let shouldAlert = false
          let alertType: 'upcoming' | 'due_today' | 'overdue' = 'upcoming'

          if (daysUntilDue < 0) {
            shouldAlert = true
            alertType = 'overdue'
          } else if (daysUntilDue === 0) {
            shouldAlert = true
            alertType = 'due_today'
          } else if (ALERT_DAYS.includes(daysUntilDue)) {
            shouldAlert = true
            alertType = 'upcoming'
          }

          if (shouldAlert) {
            alerts.push({
              loftId: loft.id,
              loftName: loft.name,
              ownerId: loft.owner_id,
              utilityType: utility,
              dueDate,
              frequency,
              daysUntilDue,
              alertType
            })
          }
        }
      }
    }

    return alerts
  } catch (error) {
    logger.error('Failed to scan for bill alerts', error)
    throw error
  }
}

async function processBillAlerts(alerts: BillAlert[]): Promise<void> {
  const supabase = await getSupabaseClient()

  try {
    // Get admin users for notifications
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])

    if (adminError) {
      logger.warn('Failed to fetch admin users', adminError)
    }

    // Process each alert
    for (const alert of alerts) {
      await sendBillAlert(alert, adminUsers || [])
    }
  } catch (error) {
    logger.error('Failed to process bill alerts', error)
    throw error
  }
}

async function sendBillAlert(alert: BillAlert, adminUsers: { id: string }[]): Promise<void> {
  const utilityLabel = UTILITY_LABELS[alert.utilityType]
  let title: string
  let message: string
  let type: 'info' | 'warning' | 'error' = 'info'

  // Determine notification content based on alert type
  switch (alert.alertType) {
    case 'overdue':
      title = `🚨 ${utilityLabel} Bill Overdue - ${alert.loftName}`
      message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is ${Math.abs(alert.daysUntilDue)} day${Math.abs(alert.daysUntilDue) !== 1 ? 's' : ''} overdue (due: ${new Date(alert.dueDate).toLocaleDateString()}).`
      type = 'error'
      break
    
    case 'due_today':
      title = `⚠️ ${utilityLabel} Bill Due Today - ${alert.loftName}`
      message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is due today (${new Date(alert.dueDate).toLocaleDateString()}).`
      type = 'warning'
      break
    
    case 'upcoming':
      if (alert.daysUntilDue === 1) {
        title = `⏰ ${utilityLabel} Bill Due Tomorrow - ${alert.loftName}`
        message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is due tomorrow (${new Date(alert.dueDate).toLocaleDateString()}).`
        type = 'warning'
      } else {
        title = `📅 ${utilityLabel} Bill Due in ${alert.daysUntilDue} Days - ${alert.loftName}`
        message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is due on ${new Date(alert.dueDate).toLocaleDateString()}.`
        type = 'info'
      }
      break
  }

  try {
    // Send notification to loft owner
    if (alert.ownerId) {
      await createNotification(
        alert.ownerId,
        title,
        message,
        type,
        `/lofts/${alert.loftId}`
      )
    }

    // Send notification to admin users
    for (const admin of adminUsers) {
      await createNotification(
        admin.id,
        title,
        message,
        type,
        `/lofts/${alert.loftId}`
      )
    }

    logger.info('Bill alert sent', {
      loftId: alert.loftId,
      utilityType: alert.utilityType,
      alertType: alert.alertType,
      daysUntilDue: alert.daysUntilDue
    })
  } catch (error) {
    logger.error('Failed to send bill alert', error, { alert })
  }
}

async function checkOverdueBills(): Promise<void> {
  const supabase = await getSupabaseClient()

  try {
    // Use the database function to get overdue bills
    const { data: overdueBills, error } = await supabase
      .rpc('get_overdue_bills')

    if (error) {
      throw error
    }

    // Send summary notification to admins if there are overdue bills
    if (overdueBills && overdueBills.length > 0) {
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'manager'])

      if (adminUsers && adminUsers.length > 0) {
        const adminIds = adminUsers.map(user => user.id)
        const overdueCount = overdueBills.length
        const loftNames = [...new Set(overdueBills.map((bill: OverdueBill) => bill.loft_name))].slice(0, 3)
        const loftList = loftNames.join(', ') + (overdueBills.length > 3 ? ` and ${overdueBills.length - 3} more` : '')

        await sendBulkNotifications(
          adminIds,
          `📊 Daily Overdue Bills Summary`,
          `There are ${overdueCount} overdue bills across properties: ${loftList}. Please review and take action.`,
          'warning'
        )
      }
    }

    logger.info('Overdue bills check completed', { overdueCount: overdueBills?.length || 0 })
  } catch (error) {
    logger.error('Failed to check overdue bills', error)
  }
}

// Function to get bill monitoring statistics
export async function getBillMonitoringStats(): Promise<{
  upcomingBills: number
  overdueBills: number
  dueToday: number
  totalLoftsWithBills: number
}> {
  const supabase = await getSupabaseClient()

  try {
    // Get upcoming bills (next 30 days)
    const { data: upcomingBills, error: upcomingError } = await supabase
      .rpc('get_upcoming_bills', { days_ahead: 30 })

    // Get overdue bills
    const { data: overdueBills, error: overdueError } = await supabase
      .rpc('get_overdue_bills')

    if (upcomingError || overdueError) {
      throw new Error('Failed to fetch bill statistics')
    }

    const today = new Date().toISOString().split('T')[0]
    const dueToday = (upcomingBills || []).filter((bill: UpcomingBill) => 
      bill.due_date === today
    ).length

    // Count unique lofts with bills
    const allBills = [...(upcomingBills || []), ...(overdueBills || [])]
    const uniqueLofts = new Set(allBills.map(bill => bill.loft_id))

    return {
      upcomingBills: (upcomingBills || []).length,
      overdueBills: (overdueBills || []).length,
      dueToday,
      totalLoftsWithBills: uniqueLofts.size
    }
  } catch (error) {
    logger.error('Failed to get bill monitoring stats', error)
    return {
      upcomingBills: 0,
      overdueBills: 0,
      dueToday: 0,
      totalLoftsWithBills: 0
    }
  }
}