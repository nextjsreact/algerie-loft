#!/usr/bin/env node

/**
 * Bill Due Date Notification Checker (JavaScript version)
 * 
 * This script checks for upcoming and overdue bill due dates and sends notifications.
 * It should be run daily via a cron job or scheduled task.
 * 
 * Usage:
 * - Run manually: node scripts/check-bill-notifications.js
 * - Schedule daily: Add to cron job or Windows Task Scheduler
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const UTILITY_LABELS = {
  eau: 'Water',
  energie: 'Energy',
  telephone: 'Phone',
  internet: 'Internet'
}

const ALERT_DAYS = [7, 3, 1] // Send alerts 7, 3, and 1 days before due date

async function main() {
  console.log('🔍 Starting comprehensive bill monitoring check...')
  
  try {
    const alerts = await scanForBillAlerts()
    await processBillAlerts(alerts)
    await checkOverdueBills()
    
    console.log(`✅ Bill monitoring completed successfully! Processed ${alerts.length} alerts.`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Bill monitoring failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

async function scanForBillAlerts() {
  const today = new Date()
  const alerts = []

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

    console.log(`📊 Scanning ${lofts?.length || 0} lofts for bill alerts...`)

    // Process each loft
    for (const loft of lofts || []) {
      const utilities = ['eau', 'energie', 'telephone', 'internet']

      for (const utility of utilities) {
        const dueDate = loft[`prochaine_echeance_${utility}`]
        const frequency = loft[`frequence_paiement_${utility}`]

        if (dueDate && frequency) {
          const dueDateObj = new Date(dueDate)
          const timeDiff = dueDateObj.getTime() - today.getTime()
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24))

          // Check if we should send an alert
          let shouldAlert = false
          let alertType = 'upcoming'

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
    console.error('Failed to scan for bill alerts:', error)
    throw error
  }
}

async function processBillAlerts(alerts) {
  try {
    // Get admin users for notifications
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])

    if (adminError) {
      console.warn('Failed to fetch admin users:', adminError.message)
    }

    console.log(`📤 Processing ${alerts.length} bill alerts...`)

    // Process each alert
    for (const alert of alerts) {
      await sendBillAlert(alert, adminUsers || [])
    }
  } catch (error) {
    console.error('Failed to process bill alerts:', error)
    throw error
  }
}

async function sendBillAlert(alert, adminUsers) {
  const utilityLabel = UTILITY_LABELS[alert.utilityType]
  let title, message, type

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

    console.log(`✉️ Sent ${alert.alertType} alert for ${utilityLabel} bill in ${alert.loftName}`)
  } catch (error) {
    console.error(`Failed to send bill alert for ${alert.loftName}:`, error.message)
  }
}

async function createNotification(userId, title, message, type, link) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

async function checkOverdueBills() {
  try {
    // Use the database function to get overdue bills
    const { data: overdueBills, error } = await supabase
      .rpc('get_overdue_bills')

    if (error) {
      throw error
    }

    console.log(`📋 Found ${overdueBills?.length || 0} overdue bills`)

    // Send summary notification to admins if there are overdue bills
    if (overdueBills && overdueBills.length > 0) {
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'manager'])

      if (adminUsers && adminUsers.length > 0) {
        const overdueCount = overdueBills.length
        const loftNames = [...new Set(overdueBills.map(bill => bill.loft_name))].slice(0, 3)
        const loftList = loftNames.join(', ') + (overdueBills.length > 3 ? ` and ${overdueBills.length - 3} more` : '')

        for (const admin of adminUsers) {
          await createNotification(
            admin.id,
            `📊 Daily Overdue Bills Summary`,
            `There are ${overdueCount} overdue bills across properties: ${loftList}. Please review and take action.`,
            'warning',
            '/dashboard'
          )
        }

        console.log(`📤 Sent overdue summary to ${adminUsers.length} admin users`)
      }
    }
  } catch (error) {
    console.error('Failed to check overdue bills:', error)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

main()