import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireRoleAPI } from '@/lib/auth'
import type { PartnerRejectionRequest } from '@/types/partner'

// POST /api/admin/partners/[id]/reject - Reject partner application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const session = await requireRoleAPI(['admin'])
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const partnerId = params.id
    const body: PartnerRejectionRequest = await request.json()

    if (!body.rejection_reason || body.rejection_reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get partner information
    const { data: partner, error: partnerError } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError)
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', partner.user_id)
      .single()

    if (partner.verification_status === 'rejected') {
      return NextResponse.json(
        { error: 'Partner is already rejected' },
        { status: 400 }
      )
    }

    // Update partner status to rejected
    const { error: updateError } = await supabase
      .from('partner_profiles')
      .update({
        verification_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: session.user.id,
        rejection_reason: body.rejection_reason,
        verification_notes: body.admin_notes || body.notes || body.rejection_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId)

    if (updateError) {
      console.error('Error updating partner status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update partner status' },
        { status: 500 }
      )
    }

    // Update validation request status
    const { error: requestUpdateError } = await supabase
      .from('partner_validation_requests')
      .update({
        status: 'rejected',
        admin_notes: body.admin_notes,
        processed_by: session.user.id,
        processed_at: new Date().toISOString()
      })
      .eq('partner_id', partnerId)

    if (requestUpdateError) {
      console.error('Error updating validation request:', requestUpdateError)
      // Don't fail the rejection for this
    }

    // Send rejection email
    if (userProfile?.email) {
      try {
        const { EmailNotificationService } = await import('@/lib/services/email-notification-service')
        
        await EmailNotificationService.sendPartnerRejectionEmail(
          userProfile.email,
          userProfile.full_name || 'Partner',
          body.rejection_reason
        )
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError)
        // Don't fail the rejection for email issues
      }
    }

    // Create notification for partner
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: partner.user_id,
          type: 'partner_rejected',
          title: 'Partner Application Update',
          message: `Your partner application has been reviewed. Reason: ${body.rejection_reason}`,
          data: {
            partner_id: partnerId,
            rejected_by: session.user.id,
            rejection_reason: body.rejection_reason
          },
          read: false,
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('Failed to create rejection notification:', notificationError)
      }
    } catch (notificationError) {
      console.error('Error creating rejection notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Partner rejected successfully',
      partner_id: partnerId
    })

  } catch (error) {
    console.error('Unexpected error in partner rejection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}