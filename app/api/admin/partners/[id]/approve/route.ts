import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireRoleAPI } from '@/lib/auth'
import type { PartnerApprovalRequest } from '@/types/partner'

// POST /api/admin/partners/[id]/approve - Approve partner application
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
    const body: PartnerApprovalRequest = await request.json()

    const supabase = await createClient()

    // Get partner information
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select(`
        id,
        user_id,
        business_name,
        business_type,
        verification_status,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    if (partner.verification_status === 'approved') {
      return NextResponse.json(
        { error: 'Partner is already approved' },
        { status: 400 }
      )
    }

    // Update partner status to approved
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        verification_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
        admin_notes: body.admin_notes,
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
        status: 'approved',
        admin_notes: body.admin_notes,
        processed_by: session.user.id,
        processed_at: new Date().toISOString()
      })
      .eq('partner_id', partnerId)

    if (requestUpdateError) {
      console.error('Error updating validation request:', requestUpdateError)
      // Don't fail the approval for this
    }

    // Send approval email
    try {
      const { EmailNotificationService } = await import('@/lib/services/email-notification-service')
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/partner/dashboard`
      
      await EmailNotificationService.sendPartnerApprovalEmail(
        partner.profiles.email,
        partner.profiles.full_name,
        dashboardUrl
      )
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Don't fail the approval for email issues
    }

    // Create notification for partner
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: partner.user_id,
          type: 'partner_approved',
          title: 'Partner Application Approved',
          message: 'Congratulations! Your partner application has been approved. You can now access your partner dashboard.',
          data: {
            partner_id: partnerId,
            approved_by: session.user.id,
            dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/partner/dashboard`
          },
          read: false,
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('Failed to create approval notification:', notificationError)
      }
    } catch (notificationError) {
      console.error('Error creating approval notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Partner approved successfully',
      partner_id: partnerId
    })

  } catch (error) {
    console.error('Unexpected error in partner approval:', error)
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