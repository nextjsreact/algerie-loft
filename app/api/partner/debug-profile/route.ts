import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // Get partner profile
    const { data: partnerProfile } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      partnerProfile,
      hasPartnerProfile: !!partnerProfile,
      partnerStatus: partnerProfile?.verification_status || 'none'
    })
    
  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Delete partner profile
    const { error: deleteError } = await supabase
      .from('partner_profiles')
      .delete()
      .eq('user_id', user.id)
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Partner profile deleted successfully' 
    })
    
  } catch (error) {
    console.error('Delete profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
