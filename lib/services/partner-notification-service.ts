/**
 * Partner Notification Service
 * 
 * Comprehensive notification system for partner dashboard
 * including email, in-app notifications, and preference management.
 */

import { createClient } from '@/utils/supabase/server';
import { EmailNotificationService } from './email-notification-service';

export interface PartnerNotification {
  id: string;
  partner_id: string;
  type: PartnerNotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: NotificationChannel[];
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export type PartnerNotificationType = 
  | 'registration_received'
  | 'registration_approved'
  | 'registration_rejected'
  | 'property_added'
  | 'property_updated'
  | 'property_removed'
  | 'new_reservation'
  | 'reservation_cancelled'
  | 'reservation_modified'
  | 'payment_received'
  | 'revenue_report'
  | 'system_maintenance'
  | 'account_update'
  | 'security_alert'
  | 'performance_summary';

export type NotificationChannel = 'email' | 'in_app' | 'sms' | 'push';

export interface PartnerNotificationPreferences {
  partner_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  preferences: {
    [key in PartnerNotificationType]: {
      enabled: boolean;
      channels: NotificationChannel[];
      frequency?: 'immediate' | 'daily' | 'weekly';
    };
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:MM format
    end_time: string;   // HH:MM format
    timezone: string;
  };
  updated_at: string;
}

export class PartnerNotificationService {
  
  /**
   * Send notification to partner through specified channels
   */
  static async sendNotification(
    partnerId: string,
    type: PartnerNotificationType,
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    channels?: NotificationChannel[]
  ): Promise<string> {
    try {
      const supabase = await createClient();
      
      // Get partner preferences
      const preferences = await this.getPartnerNotificationPreferences(partnerId);
      
      // Determine which channels to use
      const effectiveChannels = channels || this.getEffectiveChannels(type, preferences);
      
      // Check if notification should be sent based on preferences
      if (!this.shouldSendNotification(type, preferences)) {
        console.log(`[PARTNER NOTIFICATION] Skipping ${type} for partner ${partnerId} - disabled in preferences`);
        return '';
      }

      // Create notification record
      const { data: notification, error } = await supabase
        .from('partner_notifications')
        .insert({
          partner_id: partnerId,
          type,
          title,
          message,
          data,
          priority,
          channels: effectiveChannels,
          read: false,
          created_at: new Date().toISOString(),
          expires_at: this.getExpirationDate(type)
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      // Send through each channel
      await Promise.allSettled([
        effectiveChannels.includes('email') ? this.sendEmailNotification(partnerId, type, title, message, data) : Promise.resolve(),
        effectiveChannels.includes('in_app') ? this.sendInAppNotification(partnerId, notification.id) : Promise.resolve(),
        effectiveChannels.includes('sms') ? this.sendSMSNotification(partnerId, title, message) : Promise.resolve(),
        effectiveChannels.includes('push') ? this.sendPushNotification(partnerId, title, message, data) : Promise.resolve()
      ]);

      return notification.id;
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send registration status notifications
   */
  static async sendRegistrationStatusNotification(
    partnerId: string,
    status: 'received' | 'approved' | 'rejected',
    partnerEmail: string,
    partnerName: string,
    rejectionReason?: string
  ): Promise<void> {
    switch (status) {
      case 'received':
        await this.sendNotification(
          partnerId,
          'registration_received',
          'Application Received',
          'Your partner application has been received and is under review.',
          { status: 'received' },
          'medium',
          ['email', 'in_app']
        );
        await EmailNotificationService.sendPartnerConfirmationEmail(partnerEmail, partnerName);
        break;

      case 'approved':
        await this.sendNotification(
          partnerId,
          'registration_approved',
          'Application Approved!',
          'Congratulations! Your partner application has been approved. You can now access your dashboard.',
          { status: 'approved', dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/partner/dashboard` },
          'high',
          ['email', 'in_app']
        );
        await EmailNotificationService.sendPartnerApprovalEmail(
          partnerEmail, 
          partnerName, 
          `${process.env.NEXT_PUBLIC_APP_URL}/partner/dashboard`
        );
        break;

      case 'rejected':
        await this.sendNotification(
          partnerId,
          'registration_rejected',
          'Application Update',
          `Your partner application could not be approved. ${rejectionReason || 'Please contact support for more information.'}`,
          { status: 'rejected', reason: rejectionReason },
          'medium',
          ['email', 'in_app']
        );
        await EmailNotificationService.sendPartnerRejectionEmail(
          partnerEmail, 
          partnerName, 
          rejectionReason || 'Please contact support for more information.'
        );
        break;
    }
  }

  /**
   * Send property-related notifications
   */
  static async sendPropertyNotification(
    partnerId: string,
    type: 'property_added' | 'property_updated' | 'property_removed',
    propertyName: string,
    propertyId: string,
    details?: any
  ): Promise<void> {
    const messages = {
      property_added: `New property "${propertyName}" has been added to your portfolio.`,
      property_updated: `Property "${propertyName}" has been updated.`,
      property_removed: `Property "${propertyName}" has been removed from your portfolio.`
    };

    await this.sendNotification(
      partnerId,
      type,
      'Property Update',
      messages[type],
      { property_id: propertyId, property_name: propertyName, ...details },
      'medium',
      ['in_app', 'email']
    );
  }

  /**
   * Send reservation notifications
   */
  static async sendReservationNotification(
    partnerId: string,
    type: 'new_reservation' | 'reservation_cancelled' | 'reservation_modified',
    reservationData: {
      id: string;
      property_name: string;
      guest_name: string;
      check_in: string;
      check_out: string;
      total_amount: number;
    }
  ): Promise<void> {
    const messages = {
      new_reservation: `New reservation for "${reservationData.property_name}" by ${reservationData.guest_name}.`,
      reservation_cancelled: `Reservation for "${reservationData.property_name}" by ${reservationData.guest_name} has been cancelled.`,
      reservation_modified: `Reservation for "${reservationData.property_name}" by ${reservationData.guest_name} has been modified.`
    };

    await this.sendNotification(
      partnerId,
      type,
      'Reservation Update',
      messages[type],
      reservationData,
      type === 'new_reservation' ? 'high' : 'medium',
      ['in_app', 'email']
    );
  }

  /**
   * Send payment notifications
   */
  static async sendPaymentNotification(
    partnerId: string,
    amount: number,
    currency: string,
    propertyName: string,
    reservationId: string
  ): Promise<void> {
    await this.sendNotification(
      partnerId,
      'payment_received',
      'Payment Received',
      `Payment of ${amount} ${currency} received for "${propertyName}".`,
      { 
        amount, 
        currency, 
        property_name: propertyName, 
        reservation_id: reservationId 
      },
      'high',
      ['in_app', 'email']
    );
  }

  /**
   * Send monthly revenue report notification
   */
  static async sendRevenueReportNotification(
    partnerId: string,
    reportData: {
      month: string;
      total_revenue: number;
      total_reservations: number;
      currency: string;
    }
  ): Promise<void> {
    await this.sendNotification(
      partnerId,
      'revenue_report',
      'Monthly Revenue Report',
      `Your revenue report for ${reportData.month} is ready. Total: ${reportData.total_revenue} ${reportData.currency} from ${reportData.total_reservations} reservations.`,
      reportData,
      'low',
      ['in_app', 'email']
    );
  }

  /**
   * Send system maintenance notifications
   */
  static async sendMaintenanceNotification(
    partnerId: string,
    maintenanceDetails: {
      start_time: string;
      end_time: string;
      description: string;
      affected_services: string[];
    }
  ): Promise<void> {
    await this.sendNotification(
      partnerId,
      'system_maintenance',
      'Scheduled Maintenance',
      `System maintenance scheduled from ${maintenanceDetails.start_time} to ${maintenanceDetails.end_time}. ${maintenanceDetails.description}`,
      maintenanceDetails,
      'medium',
      ['in_app', 'email']
    );
  }

  /**
   * Get partner notifications with pagination
   */
  static async getPartnerNotifications(
    partnerId: string,
    options: {
      limit?: number;
      offset?: number;
      unread_only?: boolean;
      type?: PartnerNotificationType;
      priority?: string;
    } = {}
  ): Promise<{ notifications: PartnerNotification[]; total: number }> {
    try {
      const supabase = await createClient();
      
      let query = supabase
        .from('partner_notifications')
        .select('*', { count: 'exact' })
        .eq('partner_id', partnerId);

      if (options.unread_only) {
        query = query.eq('read', false);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return {
        notifications: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string, partnerId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('partner_notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('partner_id', partnerId);

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to mark as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(partnerId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('partner_notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('partner_id', partnerId)
        .eq('read', false);

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, partnerId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('partner_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('partner_id', partnerId);

      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Get partner notification preferences
   */
  static async getPartnerNotificationPreferences(partnerId: string): Promise<PartnerNotificationPreferences> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('partner_notification_preferences')
        .select('*')
        .eq('partner_id', partnerId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(`Failed to get preferences: ${error.message}`);
      }

      // Return default preferences if none exist
      if (!data) {
        return this.getDefaultNotificationPreferences(partnerId);
      }

      return data;
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to get preferences:', error);
      return this.getDefaultNotificationPreferences(partnerId);
    }
  }

  /**
   * Update partner notification preferences
   */
  static async updatePartnerNotificationPreferences(
    partnerId: string,
    preferences: Partial<Omit<PartnerNotificationPreferences, 'partner_id' | 'updated_at'>>
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('partner_notification_preferences')
        .upsert({
          partner_id: partnerId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to update preferences: ${error.message}`);
      }
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadNotificationCount(partnerId: string): Promise<number> {
    try {
      const supabase = await createClient();
      
      const { count, error } = await supabase
        .from('partner_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('read', false)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        throw new Error(`Failed to get unread count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('partner_notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup expired notifications: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('[PARTNER NOTIFICATION] Failed to cleanup expired notifications:', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */
  private static getDefaultNotificationPreferences(partnerId: string): PartnerNotificationPreferences {
    const defaultChannels: NotificationChannel[] = ['email', 'in_app'];
    
    return {
      partner_id: partnerId,
      email_enabled: true,
      in_app_enabled: true,
      sms_enabled: false,
      push_enabled: false,
      preferences: {
        registration_received: { enabled: true, channels: defaultChannels },
        registration_approved: { enabled: true, channels: defaultChannels },
        registration_rejected: { enabled: true, channels: defaultChannels },
        property_added: { enabled: true, channels: ['in_app'] },
        property_updated: { enabled: true, channels: ['in_app'] },
        property_removed: { enabled: true, channels: defaultChannels },
        new_reservation: { enabled: true, channels: defaultChannels },
        reservation_cancelled: { enabled: true, channels: defaultChannels },
        reservation_modified: { enabled: true, channels: ['in_app'] },
        payment_received: { enabled: true, channels: defaultChannels },
        revenue_report: { enabled: true, channels: ['email'], frequency: 'weekly' },
        system_maintenance: { enabled: true, channels: defaultChannels },
        account_update: { enabled: true, channels: defaultChannels },
        security_alert: { enabled: true, channels: defaultChannels },
        performance_summary: { enabled: true, channels: ['email'], frequency: 'weekly' }
      },
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'Africa/Algiers'
      },
      updated_at: new Date().toISOString()
    };
  }

  private static getEffectiveChannels(
    type: PartnerNotificationType,
    preferences: PartnerNotificationPreferences
  ): NotificationChannel[] {
    const typePrefs = preferences.preferences[type];
    if (!typePrefs || !typePrefs.enabled) {
      return [];
    }

    return typePrefs.channels.filter(channel => {
      switch (channel) {
        case 'email': return preferences.email_enabled;
        case 'in_app': return preferences.in_app_enabled;
        case 'sms': return preferences.sms_enabled;
        case 'push': return preferences.push_enabled;
        default: return false;
      }
    });
  }

  private static shouldSendNotification(
    type: PartnerNotificationType,
    preferences: PartnerNotificationPreferences
  ): boolean {
    const typePrefs = preferences.preferences[type];
    return typePrefs?.enabled ?? true;
  }

  private static getExpirationDate(type: PartnerNotificationType): string | null {
    // Set expiration based on notification type
    const expirationDays = {
      registration_received: 30,
      registration_approved: null, // Never expires
      registration_rejected: null, // Never expires
      property_added: 7,
      property_updated: 7,
      property_removed: 30,
      new_reservation: 30,
      reservation_cancelled: 30,
      reservation_modified: 30,
      payment_received: 90,
      revenue_report: 90,
      system_maintenance: 1,
      account_update: 30,
      security_alert: null, // Never expires
      performance_summary: 30
    };

    const days = expirationDays[type];
    if (days === null) return null;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate.toISOString();
  }

  private static async sendEmailNotification(
    partnerId: string,
    type: PartnerNotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    // Email notifications are handled by the existing EmailNotificationService
    // This is a placeholder for additional email logic if needed
    console.log(`[PARTNER NOTIFICATION] Email notification sent: ${type} to partner ${partnerId}`);
  }

  private static async sendInAppNotification(partnerId: string, notificationId: string): Promise<void> {
    // In-app notifications are stored in the database and displayed in the UI
    // This could trigger real-time updates via WebSocket or Server-Sent Events
    console.log(`[PARTNER NOTIFICATION] In-app notification created: ${notificationId} for partner ${partnerId}`);
  }

  private static async sendSMSNotification(partnerId: string, title: string, message: string): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`[PARTNER NOTIFICATION] SMS notification: ${title} to partner ${partnerId}`);
  }

  private static async sendPushNotification(
    partnerId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
    console.log(`[PARTNER NOTIFICATION] Push notification: ${title} to partner ${partnerId}`);
  }
}