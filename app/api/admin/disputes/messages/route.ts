import { NextRequest, NextResponse } from 'next/server'
import { requireRoleAPI } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleAPI(['admin', 'manager'])
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { disputeId, message } = await request.json()

    if (!disputeId || !message?.trim()) {
      return NextResponse.json({ error: 'Dispute ID and message are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify dispute exists
    const { data: dispute, error: disputeError } = await supabase
      .from('booking_disputes')
      .select('id, bookings(client_id, partner_id)')
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Add message to dispute
    const { error: messageError } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: disputeId,
        sender_id: session.user.id,
        sender_role: 'admin',
        message: message.trim()
      })

    if (messageError) {
      console.error('Error adding dispute message:', messageError)
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
    }

    // Update dispute's updated_at timestamp
    await supabase
      .from('booking_disputes')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', disputeId)

    // Send notifications to client and partner
    const notifications = [
      {
        user_id: dispute.bookings.client_id,
        type: 'dispute_message',
        title: 'New Message in Dispute',
        message: 'An admin has added a message to your dispute case.',
        reference_type: 'dispute',
        reference_id: disputeId
      },
      {
        user_id: dispute.bookings.partner_id,
        type: 'dispute_message',
        title: 'New Message in Dispute',
        message: 'An admin has added a message to the dispute case.',
        reference_type: 'dispute',
        reference_id: disputeId
      }
    ]

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the operation, but log the error
    }

    // Log the admin action
    await supabase
      .schema('audit')
      .from('audit_logs')
      .insert({
        table_name: 'dispute_messages',
        record_id: disputeId,
        action: 'INSERT',
        old_values: {},
        new_values: { message: message.trim() },
        user_id: session.user.id,
        user_role: session.user.role,
        metadata: {
          admin_action: 'dispute_message',
          dispute_id: disputeId
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding dispute message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}