import { createScriptClient } from '@/utils/supabase/script'
import { logger, measurePerformance } from '@/lib/logger'

export async function createScriptNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  link?: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating script notification', { userId, title, type })
    const supabase = createScriptClient()

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

      logger.info('Script notification created successfully', { userId, title })
    } catch (error) {
      logger.error('Failed to create script notification', error, { userId, title })
      throw error
    }
  }, 'createScriptNotification')
}

export async function sendScriptBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Sending script bulk notifications', { userCount: userIds.length, title })
    const supabase = createScriptClient()

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

      logger.info('Script bulk notifications sent successfully', { count: userIds.length })
    } catch (error) {
      logger.error('Failed to send script bulk notifications', error, { userCount: userIds.length })
      throw error
    }
  }, 'sendScriptBulkNotifications')
}