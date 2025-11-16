import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current session - only admins and executives can reject
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or executive
    if (!['admin', 'executive'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Executive access required' },
        { status: 403 }
      )
    }

    const { partnerId, reason } = await request.json()

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get partner info first
    const { data: partnerProfile, error: fetchError } = await supabase
      .from('partner_profiles')
      .select('user_id, business_name')
      .eq('id', partnerId)
      .single()

    if (fetchError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Update partner status to rejected
    const { error } = await supabase
      .from('partner_profiles')
      .update({ 
        verification_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId)

    if (error) {
      console.error('Error rejecting partner:', error)
      return NextResponse.json(
        { error: 'Failed to reject partner' },
        { status: 500 }
      )
    }

    // Delete all notifications about this partner registration for all admins/managers
    const { error: deleteNotifError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'partner_registration')
      .eq('related_id', partnerId)

    if (deleteNotifError) {
      console.error('Error deleting notifications:', deleteNotifError)
      // Don't fail the rejection for this
    }

    // Create notification for the partner
    const reasonMessage = reason 
      ? `Raison: ${reason}` 
      : 'Pour plus d\'informations, veuillez contacter notre équipe.'

    const { error: partnerNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: partnerProfile.user_id,
        title: 'Demande de partenariat refusée',
        message: `Votre demande de partenariat n'a pas été approuvée. ${reasonMessage}`,
        type: 'partner_rejected',
        related_id: partnerId,
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (partnerNotifError) {
      console.error('Error creating partner notification:', partnerNotifError)
      // Don't fail the rejection for this
    }

    // TODO: Send email notification to partner with reason

    return NextResponse.json({
      success: true,
      message: 'Partner rejected'
    })

  } catch (error) {
    console.error('Reject partner API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
