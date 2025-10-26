import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user and verify admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager', 'executive'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Get all users with their profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        created_at,
        last_login,
        is_active,
        partner_profiles(verification_status)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform the data to include verification status for partners
    const transformedUsers = users?.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active,
      verification_status: user.partner_profiles?.[0]?.verification_status
    })) || []

    return NextResponse.json({ users: transformedUsers })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 }
    )
  }
}