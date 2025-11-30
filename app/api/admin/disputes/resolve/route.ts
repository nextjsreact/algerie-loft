import { NextRequest, NextResponse } from 'next/server'
import { requireRoleAPI } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleAPI(['admin', 'manager'])
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { disputeId, status, resolution, refund_amount, compensation } = await request.json()

    if (!disputeId || !status || !resolution) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createClient()

    // Start a transaction
    const { data: dispute, error: fetchError } = await supabase
      .from('booking_disputes')
      .select(`
        *,
        bookings (
          id,
          client_id,
          partner_id,
          total_price
        )
      `)
      .eq('id', disputeId)
      .single()

    if (fetchError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Update dispute status and resolution
    const { error: updateError } = await supabase
      .from('booking_disputes')
      .update({
        status,
        resolution_notes: resolution,
        resolved_by: session.user.id,
        resolved_at: new Date().toISOString(),
        refund_amount: refund_amount || 0,
        compensation_amount: compensation || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)

    if (updateError) {
      console.error('Error updating dispute:', updateError)
      return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 })
    }

    // If there's a refund amount, create a refund transaction
    if (refund_amount && refund_amount > 0) {
      const { error: refundError } = await supabase
        .from('transactions')
        .insert({
          loft_id: dispute.bookings.id,
          amount: -Math.abs(refund_amount), // Negative amount for refund
          type: 'refund',
          description: `Dispute resolution refund - Dispute #${disputeId.slice(0, 8)}`,
          reference_type: 'dispute_refund',
          reference_id: disputeId,
          created_by: session.user.id,
          status: 'completed'
        })

      if (refundError) {
        console.error('Error creating refund transaction:', refundError)
        // Don't fail the entire operation, but log the error
      }
    }

    // If there's compensation, create a compensation transaction
    if (compensation && compensation > 0) {
      const { error: compensationError } = await supabase
        .from('transactions')
        .insert({
          loft_id: dispute.bookings.id,
          amount: Math.abs(compensation), // Positive amount for compensation
          type: 'compensation',
          description: `Dispute resolution compensation - Dispute #${disputeId.slice(0, 8)}`,
          reference_type: 'dispute_compensation',
          reference_id: disputeId,
          created_by: session.user.id,
          status: 'completed'
        })

      if (compensationError) {
        console.error('Error creating compensation transaction:', compensationError)
        // Don't fail the entire operation, but log the error
      }
    }

    // Send notification to involved parties
    const notifications = []

    // Notify client
    notifications.push({
      user_id: dispute.bookings.client_id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Your dispute has been ${status}. ${resolution}`,
      reference_type: 'dispute',
      reference_id: disputeId
    })

    // Notify partner
    notifications.push({
      user_id: dispute.bookings.partner_id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `A dispute regarding your property has been ${status}. ${resolution}`,
      reference_type: 'dispute',
      reference_id: disputeId
    })

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error sending notifications:', notificationError)
        // Don't fail the operation, but log the error
      }
    }

    // Log the admin action
    await supabase
      .schema('audit')
      .from('audit_logs')
      .insert({
        table_name: 'booking_disputes',
        record_id: disputeId,
        action: 'RESOLVE',
        old_values: { status: dispute.status },
        new_values: { 
          status, 
          resolution_notes: resolution,
          refund_amount: refund_amount || 0,
          compensation_amount: compensation || 0
        },
        user_id: session.user.id,
        user_role: session.user.role,
        metadata: {
          admin_action: 'dispute_resolution',
          refund_amount: refund_amount || 0,
          compensation_amount: compensation || 0
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}