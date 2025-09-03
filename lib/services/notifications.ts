import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'email' | 'in_app' | 'sms'
  variables: string[]
}

export interface NotificationRule {
  id: string
  name: string
  trigger: 'payment_overdue' | 'maintenance_due' | 'lease_expiring' | 'occupancy_change'
  conditions: Record<string, any>
  template_id: string
  recipients: string[]
  is_active: boolean
}

export interface NotificationQueue {
  id: string
  user_id: string
  template_id: string
  subject: string
  body: string
  type: 'email' | 'in_app' | 'sms'
  status: 'pending' | 'sent' | 'failed'
  scheduled_at: string
  sent_at?: string
  error_message?: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  link?: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating notification', { userId, title, type })
    const supabase = await createClient()

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

      logger.info('Notification created successfully', { userId, title })
    } catch (error) {
      logger.error('Failed to create notification', error, { userId, title })
      throw error
    }
  }, 'createNotification')
}

export async function sendBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Sending bulk notifications', { userCount: userIds.length, title })
    const supabase = await createClient()

    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        throw error
      }

      logger.info('Bulk notifications sent successfully', { count: userIds.length })
    } catch (error) {
      logger.error('Failed to send bulk notifications', error, { userCount: userIds.length })
      throw error
    }
  }, 'sendBulkNotifications')
}

export async function checkPaymentOverdueNotifications(): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Checking for overdue payment notifications')
    const supabase = await createClient()

    try {
      // Get overdue payments
      const { data: overduePayments, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          due_date,
          loft:lofts(name, owner_id),
          tenant_name
        `)
        .eq('status', 'pending')
        .eq('transaction_type', 'income')
        .lt('due_date', new Date().toISOString())

      if (error) {
        throw error
      }

      // Create notifications for each overdue payment
      for (const payment of overduePayments || []) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        const title = `Payment Overdue - ${payment.loft?.[0]?.name}`
        const message = `Payment of $${payment.amount} from ${payment.tenant_name} is ${daysOverdue} days overdue.`

        // Notify property owner
        if (payment.loft?.[0]?.owner_id) {
          await createNotification(
            payment.loft[0].owner_id,
            title,
            message,
            'warning',
            `/transactions/${payment.id}`
          )
        }

        // Notify admin users
        const { data: adminUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')

        for (const admin of adminUsers || []) {
          await createNotification(
            admin.id,
            title,
            message,
            'warning',
            `/transactions/${payment.id}`
          )
        }
      }

      logger.info('Overdue payment notifications processed', { count: overduePayments?.length || 0 })
    } catch (error) {
      logger.error('Failed to process overdue payment notifications', error)
      throw error
    }
  }, 'checkPaymentOverdueNotifications')
}

export async function checkMaintenanceDueNotifications(): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Checking for maintenance due notifications')
    const supabase = await createClient()

    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get maintenance tasks due tomorrow
      const { data: dueTasks, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          id,
          description,
          scheduled_date,
          loft:lofts(name, owner_id),
          assigned_to
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_date', tomorrow.toISOString())

      if (error) {
        throw error
      }

      // Create notifications for each due task
      for (const task of dueTasks || []) {
        const title = `Maintenance Due - ${task.loft?.[0]?.name}`
        const message = `Maintenance task "${task.description}" is due on ${new Date(task.scheduled_date).toLocaleDateString()}.`

        // Notify assigned user
        if (task.assigned_to) {
          await createNotification(
            task.assigned_to,
            title,
            message,
            'info',
            `/tasks/${task.id}`
          )
        }

        // Notify property owner
        if (task.loft?.[0]?.owner_id) {
          await createNotification(
            task.loft[0].owner_id,
            title,
            message,
            'info',
            `/tasks/${task.id}`
          )
        }
      }

      logger.info('Maintenance due notifications processed', { count: dueTasks?.length || 0 })
    } catch (error) {
      logger.error('Failed to process maintenance due notifications', error)
      throw error
    }
  }, 'checkMaintenanceDueNotifications')
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    logger.info('Notification marked as read', { notificationId, userId })
  } catch (error) {
    logger.error('Failed to mark notification as read', error, { notificationId, userId })
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw error
    }

    logger.info('All notifications marked as read', { userId })
  } catch (error) {
    logger.error('Failed to mark all notifications as read', error, { userId })
    throw error
  }
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    logger.info('Notification deleted', { notificationId, userId })
  } catch (error) {
    logger.error('Failed to delete notification', error, { notificationId, userId })
    throw error
  }
}

// Scheduled job to run notification checks
export async function runNotificationChecks(): Promise<void> {
  logger.info('Running scheduled notification checks')
  
  try {
    const { runBillMonitoring } = await import('@/lib/services/bill-monitoring')
    
    await Promise.all([
      checkPaymentOverdueNotifications(),
      checkMaintenanceDueNotifications(),
      runBillMonitoring()
    ])
    
    logger.info('Notification checks completed successfully')
  } catch (error) {
    logger.error('Notification checks failed', error)
    throw error
  }
}