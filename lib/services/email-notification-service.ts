interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailOptions {
  to: EmailRecipient | EmailRecipient[]
  template: EmailTemplate
  variables?: Record<string, any>
}

class EmailNotificationService {
  private apiKey: string | undefined
  private fromEmail: string
  private fromName: string

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@algerie-loft.com'
    this.fromName = process.env.FROM_NAME || 'Algérie Loft'
  }

  private replaceVariables(template: string, variables: Record<string, any> = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', {
          to: options.to,
          subject: this.replaceVariables(options.template.subject, options.variables),
          from: `${this.fromName} <${this.fromEmail}>`
        })
        return true
      }

      // In production, you would integrate with your email service
      // Example: SendGrid, Mailgun, AWS SES, etc.
      
      if (!this.apiKey) {
        console.warn('Email API key not configured')
        return false
      }

      // Placeholder for actual email sending logic
      // Replace with your email service integration
      
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendBookingConfirmation(
    recipientEmail: string, 
    recipientName: string,
    bookingDetails: any
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Confirmation de réservation - {{loftName}}',
      html: `
        <h2>Confirmation de réservation</h2>
        <p>Bonjour {{customerName}},</p>
        <p>Votre réservation a été confirmée :</p>
        <ul>
          <li><strong>Loft:</strong> {{loftName}}</li>
          <li><strong>Check-in:</strong> {{checkIn}}</li>
          <li><strong>Check-out:</strong> {{checkOut}}</li>
          <li><strong>Prix total:</strong> {{totalPrice}}€</li>
        </ul>
        <p>Merci de votre confiance !</p>
      `,
      text: `
        Confirmation de réservation
        
        Bonjour {{customerName}},
        
        Votre réservation a été confirmée :
        - Loft: {{loftName}}
        - Check-in: {{checkIn}}
        - Check-out: {{checkOut}}
        - Prix total: {{totalPrice}}€
        
        Merci de votre confiance !
      `
    }

    return this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      template,
      variables: {
        customerName: recipientName,
        loftName: bookingDetails.loftName,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        totalPrice: bookingDetails.totalPrice
      }
    })
  }

  async sendBookingCancellation(
    recipientEmail: string,
    recipientName: string,
    bookingDetails: any
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Annulation de réservation - {{loftName}}',
      html: `
        <h2>Annulation de réservation</h2>
        <p>Bonjour {{customerName}},</p>
        <p>Votre réservation a été annulée :</p>
        <ul>
          <li><strong>Loft:</strong> {{loftName}}</li>
          <li><strong>Dates:</strong> {{checkIn}} - {{checkOut}}</li>
          <li><strong>Raison:</strong> {{reason}}</li>
        </ul>
        {{#if refundAmount}}
        <p>Un remboursement de {{refundAmount}}€ sera traité sous 3-5 jours ouvrables.</p>
        {{/if}}
      `
    }

    return this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      template,
      variables: {
        customerName: recipientName,
        loftName: bookingDetails.loftName,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        reason: bookingDetails.reason,
        refundAmount: bookingDetails.refundAmount
      }
    })
  }

  async sendPartnerNotification(
    recipientEmail: string,
    recipientName: string,
    notificationData: any
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Notification partenaire - {{subject}}',
      html: `
        <h2>{{subject}}</h2>
        <p>Bonjour {{partnerName}},</p>
        <p>{{message}}</p>
        {{#if actionRequired}}
        <p><strong>Action requise:</strong> {{actionRequired}}</p>
        {{/if}}
      `
    }

    return this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      template,
      variables: {
        partnerName: recipientName,
        subject: notificationData.subject,
        message: notificationData.message,
        actionRequired: notificationData.actionRequired
      }
    })
  }

  async testEmailConfiguration(): Promise<boolean> {
    return this.sendEmail({
      to: { email: 'test@example.com', name: 'Test User' },
      template: {
        subject: 'Test Email Configuration',
        html: '<p>This is a test email to verify configuration.</p>',
        text: 'This is a test email to verify configuration.'
      }
    })
  }
}

export const emailNotificationService = new EmailNotificationService()
export default emailNotificationService