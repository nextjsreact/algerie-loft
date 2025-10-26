import { createClient } from '@/utils/supabase/server'

interface EmailTemplate {
  id: string
  template_key: string
  template_name: string
  subject_template: string
  body_template: string
  template_type: string
  variables: string[]
  is_active: boolean
}

interface EmailNotificationData {
  to: string
  template_key: string
  variables: Record<string, any>
  booking_id?: string
  user_id?: string
}

interface NotificationPreferences {
  email_notifications: boolean
  booking_confirmations: boolean
  booking_reminders: boolean
  payment_notifications: boolean
  message_notifications: boolean
  system_notifications: boolean
}

export class EmailNotificationService {
  private supabase = createClient()

  /**
   * Send an email notification using a template
   */
  async sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      // Get the email template
      const template = await this.getEmailTemplate(data.template_key)
      if (!template) {
        console.error(`Email template not found: ${data.template_key}`)
        return false
      }

      // Check user preferences if user_id is provided
      if (data.user_id) {
        const preferences = await this.getUserNotificationPreferences(data.user_id)
        if (!this.shouldSendEmail(template.template_type, preferences)) {
          console.log(`Email notification skipped due to user preferences: ${data.template_key}`)
          return true // Return true as it's not an error, just user preference
        }
      }

      // Process the template with variables
      const subject = this.processTemplate(template.subject_template, data.variables)
      const body = this.processTemplate(template.body_template, data.variables)

      // Send the email (integrate with your email service)
      const emailSent = await this.sendEmail({
        to: data.to,
        subject,
        body,
        template_type: template.template_type
      })

      // Log the notification attempt
      await this.logNotificationHistory({
        user_id: data.user_id,
        booking_id: data.booking_id,
        template_key: data.template_key,
        delivery_method: 'email',
        delivery_status: emailSent ? 'sent' : 'failed',
        recipient: data.to
      })

      return emailSent

    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  /**
   * Send booking confirmation emails to both client and partner
   */
  async sendBookingConfirmationEmails(bookingId: string): Promise<void> {
    try {
      // Get booking details with related data
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          loft:lofts(name, address, price_per_night),
          client:profiles!bookings_client_id_fkey(full_name, email),
          partner:profiles!bookings_partner_id_fkey(full_name, email, business_name)
        `)
        .eq('id', bookingId)
        .single()

      if (error || !booking) {
        console.error('Booking not found for confirmation emails:', bookingId)
        return
      }

      const commonVariables = {
        loft_name: booking.loft.name,
        loft_address: booking.loft.address,
        check_in_date: new Date(booking.check_in).toLocaleDateString(),
        check_out_date: new Date(booking.check_out).toLocaleDateString(),
        guest_count: booking.guests.toString(),
        total_price: booking.total_price.toFixed(2),
        currency: 'DZD',
        booking_reference: booking.booking_reference
      }

      // Send confirmation email to client
      await this.sendEmailNotification({
        to: booking.client.email,
        template_key: 'booking_confirmation_client',
        user_id: booking.client_id,
        booking_id: bookingId,
        variables: {
          ...commonVariables,
          client_name: booking.client.full_name,
          partner_name: booking.partner.business_name || booking.partner.full_name
        }
      })

      // Send confirmation email to partner
      await this.sendEmailNotification({
        to: booking.partner.email,
        template_key: 'booking_confirmation_partner',
        user_id: booking.partner_id,
        booking_id: bookingId,
        variables: {
          ...commonVariables,
          partner_name: booking.partner.business_name || booking.partner.full_name,
          client_name: booking.client.full_name,
          booking_link: `${process.env.NEXT_PUBLIC_APP_URL}/partner/bookings/${bookingId}`
        }
      })

    } catch (error) {
      console.error('Error sending booking confirmation emails:', error)
    }
  }

  /**
   * Send booking reminder email to client
   */
  async sendBookingReminderEmail(bookingId: string): Promise<void> {
    try {
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          loft:lofts(name, address),
          client:profiles!bookings_client_id_fkey(full_name, email),
          partner:profiles!bookings_partner_id_fkey(full_name, email, phone, business_name)
        `)
        .eq('id', bookingId)
        .single()

      if (error || !booking) {
        console.error('Booking not found for reminder email:', bookingId)
        return
      }

      await this.sendEmailNotification({
        to: booking.client.email,
        template_key: 'booking_reminder_client',
        user_id: booking.client_id,
        booking_id: bookingId,
        variables: {
          client_name: booking.client.full_name,
          loft_name: booking.loft.name,
          loft_address: booking.loft.address,
          check_in_date: new Date(booking.check_in).toLocaleDateString(),
          check_in_time: '15:00', // Default check-in time
          check_out_date: new Date(booking.check_out).toLocaleDateString(),
          booking_reference: booking.booking_reference,
          check_in_instructions: 'Please contact your host for specific check-in instructions.',
          partner_contact: booking.partner.phone || booking.partner.email
        }
      })

    } catch (error) {
      console.error('Error sending booking reminder email:', error)
    }
  }

  /**
   * Send booking cancellation emails
   */
  async sendBookingCancellationEmails(bookingId: string, cancellationReason?: string): Promise<void> {
    try {
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          loft:lofts(name),
          client:profiles!bookings_client_id_fkey(full_name, email),
          partner:profiles!bookings_partner_id_fkey(full_name, email, business_name)
        `)
        .eq('id', bookingId)
        .single()

      if (error || !booking) {
        console.error('Booking not found for cancellation emails:', bookingId)
        return
      }

      const commonVariables = {
        loft_name: booking.loft.name,
        check_in_date: new Date(booking.check_in).toLocaleDateString(),
        check_out_date: new Date(booking.check_out).toLocaleDateString(),
        booking_reference: booking.booking_reference,
        cancellation_date: new Date().toLocaleDateString()
      }

      // Send cancellation email to client
      await this.sendEmailNotification({
        to: booking.client.email,
        template_key: 'booking_cancellation_client',
        user_id: booking.client_id,
        booking_id: bookingId,
        variables: {
          ...commonVariables,
          client_name: booking.client.full_name,
          refund_details: 'Your refund will be processed according to our cancellation policy.'
        }
      })

      // Send cancellation email to partner
      await this.sendEmailNotification({
        to: booking.partner.email,
        template_key: 'booking_cancellation_partner',
        user_id: booking.partner_id,
        booking_id: bookingId,
        variables: {
          ...commonVariables,
          partner_name: booking.partner.business_name || booking.partner.full_name,
          client_name: booking.client.full_name,
          cancellation_reason: cancellationReason || 'No reason provided'
        }
      })

    } catch (error) {
      console.error('Error sending booking cancellation emails:', error)
    }
  }

  /**
   * Get email template by key
   */
  private async getEmailTemplate(templateKey: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching email template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting email template:', error)
      return null
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        // Return default preferences if none found
        return {
          email_notifications: true,
          booking_confirmations: true,
          booking_reminders: true,
          payment_notifications: true,
          message_notifications: true,
          system_notifications: true
        }
      }

      return data
    } catch (error) {
      console.error('Error getting user notification preferences:', error)
      // Return default preferences on error
      return {
        email_notifications: true,
        booking_confirmations: true,
        booking_reminders: true,
        payment_notifications: true,
        message_notifications: true,
        system_notifications: true
      }
    }
  }

  /**
   * Check if email should be sent based on template type and user preferences
   */
  private shouldSendEmail(templateType: string, preferences: NotificationPreferences): boolean {
    if (!preferences.email_notifications) return false

    switch (templateType) {
      case 'booking':
        return preferences.booking_confirmations
      case 'reminder':
        return preferences.booking_reminders
      case 'payment':
        return preferences.payment_notifications
      case 'system':
        return preferences.system_notifications
      default:
        return true
    }
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return processed
  }

  /**
   * Send email using your preferred email service
   * This is a placeholder - integrate with your actual email service
   */
  private async sendEmail(data: {
    to: string
    subject: string
    body: string
    template_type: string
  }): Promise<boolean> {
    try {
      // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
      console.log('Sending email:', {
        to: data.to,
        subject: data.subject,
        type: data.template_type
      })

      // For now, just log the email content
      console.log('Email body:', data.body)

      // Return true to simulate successful sending
      return true

    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  /**
   * Log notification history
   */
  private async logNotificationHistory(data: {
    user_id?: string
    booking_id?: string
    template_key: string
    delivery_method: string
    delivery_status: string
    recipient: string
  }): Promise<void> {
    try {
      await this.supabase
        .from('notification_history')
        .insert({
          user_id: data.user_id,
          delivery_method: data.delivery_method,
          delivery_status: data.delivery_status,
          sent_at: data.delivery_status === 'sent' ? new Date().toISOString() : null,
          error_message: data.delivery_status === 'failed' ? 'Email sending failed' : null
        })

    } catch (error) {
      console.error('Error logging notification history:', error)
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService()