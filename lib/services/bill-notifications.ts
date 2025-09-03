import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { createNotification } from '@/lib/services/notifications'

interface BillDueAlert {
  loftId: string
  loftName: string
  ownerId: string
  utilityType: 'eau' | 'energie' | 'telephone' | 'internet'
  dueDate: string
  frequency: string
  daysUntilDue: number
}

const UTILITY_LABELS = {
  eau: 'Water',
  energie: 'Energy',
  telephone: 'Phone',
  internet: 'Internet'
}

export async function checkBillDueNotifications(): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Checking for bill due notifications')
    const supabase = await createClient()

    try {
      // Get all lofts with their bill information
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

      const today = new Date()
      const alertDays = [7, 3, 1] // Alert 7, 3, and 1 days before due date
      const billAlerts: BillDueAlert[] = []

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
            if (alertDays.includes(daysUntilDue) || daysUntilDue === 0) {
              billAlerts.push({
                loftId: loft.id,
                loftName: loft.name,
                ownerId: loft.owner_id,
                utilityType: utility,
                dueDate,
                frequency,
                daysUntilDue
              })
            }
          }
        }
      }

      // Send notifications for each alert
      for (const alert of billAlerts) {
        await sendBillDueNotification(alert)
      }

      // Check for overdue bills
      await checkOverdueBills()

      logger.info('Bill due notifications processed', { alertCount: billAlerts.length })
    } catch (error) {
      logger.error('Failed to process bill due notifications', error)
      throw error
    }
  }, 'checkBillDueNotifications')
}

async function sendBillDueNotification(alert: BillDueAlert): Promise<void> {
  const utilityLabel = UTILITY_LABELS[alert.utilityType]
  let title: string
  let message: string
  let type: 'info' | 'warning' | 'error' = 'info'

  if (alert.daysUntilDue === 0) {
    title = `${utilityLabel} Bill Due Today - ${alert.loftName}`
    message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is due today (${new Date(alert.dueDate).toLocaleDateString()}).`
    type = 'warning'
  } else if (alert.daysUntilDue === 1) {
    title = `${utilityLabel} Bill Due Tomorrow - ${alert.loftName}`
    message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is due tomorrow (${new Date(alert.dueDate).toLocaleDateString()}).`
    type = 'warning'
  } else {
    title = `${utilityLabel} Bill Due in ${alert.daysUntilDue} Days - ${alert.loftName}`
    message = `The ${utilityLabel.toLowerCase()} bill for ${alert.loftName} is due on ${new Date(alert.dueDate).toLocaleDateString()}.`
    type = 'info'
  }

  try {
    // Notify the loft owner
    if (alert.ownerId) {
      await createNotification(
        alert.ownerId,
        title,
        message,
        type,
        `/lofts/${alert.loftId}`
      )
    }

    // Notify admin users
    const supabase = await createClient()
    const { data: adminUsers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])

    for (const admin of adminUsers || []) {
      await createNotification(
        admin.id,
        title,
        message,
        type,
        `/lofts/${alert.loftId}`
      )
    }

    logger.info('Bill due notification sent', { 
      loftId: alert.loftId, 
      utilityType: alert.utilityType, 
      daysUntilDue: alert.daysUntilDue 
    })
  } catch (error) {
    logger.error('Failed to send bill due notification', error, { alert })
  }
}

async function checkOverdueBills(): Promise<void> {
  const supabase = await createClient()
  const today = new Date()

  try {
    // Get all lofts with overdue bills
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

    for (const loft of lofts || []) {
      const utilities = ['eau', 'energie', 'telephone', 'internet'] as const

      for (const utility of utilities) {
        const dueDate = loft[`prochaine_echeance_${utility}`]
        const frequency = loft[`frequence_paiement_${utility}`]

        if (dueDate && frequency) {
          const dueDateObj = new Date(dueDate)
          const daysOverdue = Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 3600 * 24))

          if (daysOverdue > 0) {
            const utilityLabel = UTILITY_LABELS[utility]
            const title = `${utilityLabel} Bill Overdue - ${loft.name}`
            const message = `The ${utilityLabel.toLowerCase()} bill for ${loft.name} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue (due: ${dueDateObj.toLocaleDateString()}).`

            // Notify the loft owner
            if (loft.owner_id) {
              await createNotification(
                loft.owner_id,
                title,
                message,
                'error',
                `/lofts/${loft.id}`
              )
            }

            // Notify admin users
            const { data: adminUsers } = await supabase
              .from('profiles')
              .select('id')
              .in('role', ['admin', 'manager'])

            for (const admin of adminUsers || []) {
              await createNotification(
                admin.id,
                title,
                message,
                'error',
                `/lofts/${loft.id}`
              )
            }
          }
        }
      }
    }

    logger.info('Overdue bill notifications processed')
  } catch (error) {
    logger.error('Failed to process overdue bill notifications', error)
    throw error
  }
}

export async function updateNextBillDate(
  loftId: string, 
  utilityType: 'eau' | 'energie' | 'telephone' | 'internet',
  frequency: string
): Promise<void> {
  const supabase = await createClient()

  try {
    const { data: loft, error: fetchError } = await supabase
      .from('lofts')
      .select(`
        prochaine_echeance_eau,
        prochaine_echeance_energie,
        prochaine_echeance_telephone,
        prochaine_echeance_internet
      `)
      .eq('id', loftId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    const currentDueDate = (loft as any)[`prochaine_echeance_${utilityType}`]
    if (!currentDueDate) {
      logger.warn('No current due date found for utility', { loftId, utilityType })
      return
    }

    const nextDueDate = calculateNextDueDate(new Date(currentDueDate), frequency)

    const { error: updateError } = await supabase
      .from('lofts')
      .update({ [`prochaine_echeance_${utilityType}`]: nextDueDate.toISOString().split('T')[0] } as any)
      .eq('id', loftId)

    if (updateError) {
      throw updateError
    }

    logger.info('Next bill date updated', { loftId, utilityType, nextDueDate })
  } catch (error) {
    logger.error('Failed to update next bill date', error, { loftId, utilityType })
    throw error
  }
}

function calculateNextDueDate(currentDate: Date, frequency: string): Date {
  const nextDate = new Date(currentDate)

  switch (frequency.toLowerCase()) {
    case 'monthly':
    case 'mensuel':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'quarterly':
    case 'trimestriel':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'semi-annual':
    case 'semestriel':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'annual':
    case 'annuel':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'bi-monthly':
    case 'bimestriel':
      nextDate.setMonth(nextDate.getMonth() + 2)
      break
    default:
      // Default to monthly if frequency is not recognized
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
  }

  return nextDate
}
