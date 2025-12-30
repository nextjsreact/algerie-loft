import { createClient } from '@/utils/supabase/server'
import { CreateNotificationData, ExtendedNotification } from '@/lib/types-notification-extensions'

export class NotificationService {
  private supabase = createClient()

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<ExtendedNotification | null> {
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          booking_id: data.booking_id,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          notification_category: data.notification_category || 'general',
          priority: data.priority || 'normal',
          link: data.link,
          metadata: data.metadata || {}
        })
        .select(`
          *,
          sender:sender_id(id, full_name, email, avatar_url)
        `)
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return null
      }

      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  /**
   * Create booking-related notification for both client and partner
   */
  async createBookingNotification(
    bookingId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    try {
      // Get booking details to identify client and partner
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .select('client_id, partner_id')
        .eq('id', bookingId)
        .single()

      if (error || !booking) {
        console.error('Booking not found for notification:', bookingId)
        return
      }

      // Create notifications for both client and partner
      const notifications = [
        {
          user_id: booking.client_id,
          booking_id: bookingId,
          title,
          message,
          type,
          notification_category: 'booking' as const,
          priority,
          link: `/client/bookings/${bookingId}`,
          metadata: { recipient_type: 'client' }
        },
        {
          user_id: booking.partner_id,
          booking_id: bookingId,
          title,
          message,
          type,
          notification_category: 'booking' as const,
          priority,
          link: `/partner/bookings/${bookingId}`,
          metadata: { recipient_type: 'partner' }
        }
      ]

      await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      )

    } catch (error) {
      console.error('Error creating booking notifications:', error)
    }
  }

  /**
   * Create payment notification
   */
  async createPaymentNotification(
    userId: string,
    bookingId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      booking_id: bookingId,
      title,
      message,
      type,
      notification_category: 'payment',
      priority: 'high',
      link: `/bookings/${bookingId}/payment`,
      metadata: { payment_related: true }
    })
  }

  /**
   * Create message notification
   */
  async createMessageNotification(
    recipientId: string,
    senderId: string,
    bookingId: string,
    messagePreview: string
  ): Promise<void> {
    // Get sender info
    const { data: sender } = await this.supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', senderId)
      .single()

    const senderName = sender?.full_name || sender?.email || 'Someone'

    await this.createNotification({
      user_id: recipientId,
      booking_id: bookingId,
      title: `New message from ${senderName}`,
      message: messagePreview.length > 100 
        ? messagePreview.substring(0, 100) + '...' 
        : messagePreview,
      type: 'info',
      notification_category: 'message',
      priority: 'normal',
      link: `/bookings/${bookingId}/messages`,
      metadata: { 
        sender_id: senderId,
        message_notification: true 
      }
    })
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    link?: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      notification_category: 'system',
      priority,
      link,
      metadata: { system_notification: true }
    })
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Get notifications for a user with filtering and pagination
   */
  async getNotifications(
    userId: string,
    filters: {
      category?: string;
      unread_only?: boolean;
      booking_id?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    notifications: ExtendedNotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = this.supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id(id, full_name, email, avatar_url)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('notification_category', filters.category)
      }
      if (filters.unread_only) {
        query = query.eq('is_read', false)
      }
      if (filters.booking_id) {
        query = query.eq('booking_id', filters.booking_id)
      }

      // Apply pagination
      query = query.range(from, to)

      const { data: notifications, error, count } = await query

      if (error) {
        console.error('Error getting notifications:', error)
        return {
          notifications: [],
          total: 0,
          page,
          totalPages: 0
        }
      }

      return {
        notifications: notifications || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Error getting notifications:', error)
      return {
        notifications: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()