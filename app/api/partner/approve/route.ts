import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current session - only admins and executives can approve
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

    const { partnerId } = await request.json()

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

    // Update partner status to verified
    const { error } = await supabase
      .from('partner_profiles')
      .update({ 
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId)

    if (error) {
      console.error('Error approving partner:', error)
      return NextResponse.json(
        { error: 'Failed to approve partner' },
        { status: 500 }
      )
    }

    // Update user role to 'partner' in profiles table
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ 
        role: 'partner',
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerProfile.user_id)

    if (roleError) {
      console.error('Error updating user role:', roleError)
      // Don't fail the approval, but log the error
    } else {
      console.log(`✅ User ${partnerProfile.user_id} role updated to 'partner'`)
    }

    // Delete all notifications about this partner registration for all admins/managers
    const { error: deleteNotifError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'partner_registration')
      .eq('related_id', partnerId)

    if (deleteNotifError) {
      console.error('Error deleting notifications:', deleteNotifError)
      // Don't fail the approval for this
    }

    // Create notification for the partner
    const { error: partnerNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: partnerProfile.user_id,
        title_key: 'partner.notifications.approved.title',
        message_key: 'partner.notifications.approved.message',
        type: 'partner_approved',
        related_id: partnerId,
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (partnerNotifError) {
      console.error('Error creating partner notification:', partnerNotifError)
      // Don't fail the approval for this
    }

    // TODO: Send email notification to partner

    return NextResponse.json({
      success: true,
      message: 'Partner approved successfully'
    })

  } catch (error) {
    console.error('Approve partner API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
