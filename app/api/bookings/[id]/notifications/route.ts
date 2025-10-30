import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'
import { emailNotificationService } from '@/lib/services/email-notification-service'
import { notificationService } from '@/lib/services/notification-service'

// POST /api/bookings/[id]/notifications - Send booking-related notifications
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const body = await request.json()
    const {
      notification_type,
      custom_message,
      send_email = true,
      send_in_app = true
    } = body

    if (!notification_type) {
      return NextResponse.json(
        { error: 'Notification type is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        loft:lofts(name, address),
        client:profiles!bookings_client_id_fkey(full_name, email),
        partner:profiles!bookings_partner_id_fkey(full_name, email, business_name)
      `)
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in this booking or is admin/manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAdmin = profile?.role && ['admin', 'manager'].includes(profile.role)
    const isInvolved = booking.client_id === session.user.id || booking.partner_id === session.user.id

    if (!isAdmin && !isInvolved) {
      return NextResponse.json(
        { error: 'Unauthorized to send notifications for this booking' },
        { status: 403 }
      )
    }

    const results = {
      email_sent: false,
      in_app_sent: false,
      errors: [] as string[]
    }

    // Handle different notification types
    switch (notification_type) {
      case 'booking_confirmation':
        if (send_email) {
          try {
            await emailNotificationService.sendBookingConfirmationEmails(params.id)
            results.email_sent = true
          } catch (error) {
            results.errors.push('Failed to send confirmation emails')
            console.error('Error sending confirmation emails:', error)
          }
        }

        if (send_in_app) {
          try {
            await notificationService.createBookingNotification(
              params.id,
              'Booking Confirmed',
              `Your booking for ${booking.loft.name} has been confirmed.`,
              'success',
              'high'
            )
            results.in_app_sent = true
          } catch (error) {
            results.errors.push('Failed to send in-app notifications')
            console.error('Error sending in-app notifications:', error)
          }
        }
        break

      case 'booking_reminder':
        if (send_email) {
          try {
            await emailNotificationService.sendBookingReminderEmail(params.id)
            results.email_sent = true
          } catch (error) {
            results.errors.push('Failed to send reminder email')
            console.error('Error sending reminder email:', error)
          }
        }

        if (send_in_app) {
          try {
            await notificationService.createBookingNotification(
              params.id,
              'Check-in Reminder',
              `Your check-in at ${booking.loft.name} is tomorrow!`,
              'info',
              'normal'
            )
            results.in_app_sent = true
          } catch (error) {
            results.errors.push('Failed to send in-app reminder')
            console.error('Error sending in-app reminder:', error)
          }
        }
        break

      case 'booking_cancellation':
        if (send_email) {
          try {
            await emailNotificationService.sendBookingCancellationEmails(
              params.id,
              custom_message || 'Booking cancelled'
            )
            results.email_sent = true
          } catch (error) {
            results.errors.push('Failed to send cancellation emails')
            console.error('Error sending cancellation emails:', error)
          }
        }

        if (send_in_app) {
          try {
            await notificationService.createBookingNotification(
              params.id,
              'Booking Cancelled',
              custom_message || `Your booking for ${booking.loft.name} has been cancelled.`,
              'warning',
              'high'
            )
            results.in_app_sent = true
          } catch (error) {
            results.errors.push('Failed to send in-app cancellation notification')
            console.error('Error sending in-app cancellation notification:', error)
          }
        }
        break

      case 'payment_received':
        if (send_in_app) {
          try {
            await notificationService.createPaymentNotification(
              booking.partner_id,
              params.id,
              'Payment Received',
              `Payment received for booking ${booking.booking_reference}`,
              'success'
            )
            results.in_app_sent = true
          } catch (error) {
            results.errors.push('Failed to send payment notification')
            console.error('Error sending payment notification:', error)
          }
        }
        break

      case 'custom':
        if (!custom_message) {
          return NextResponse.json(
            { error: 'Custom message is required for custom notifications' },
            { status: 400 }
          )
        }

        if (send_in_app) {
          try {
            await notificationService.createBookingNotification(
              params.id,
              'Booking Update',
              custom_message,
              'info',
              'normal'
            )
            results.in_app_sent = true
          } catch (error) {
            results.errors.push('Failed to send custom notification')
            console.error('Error sending custom notification:', error)
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Notifications processed for ${notification_type}`
    })

  } catch (error) {
    console.error('Unexpected error sending booking notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}