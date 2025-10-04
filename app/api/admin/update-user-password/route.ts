import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, new_password } = await request.json()
    const supabase = await createClient()

    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User not authenticated:', userError)
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a le rôle admin
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      console.error('Error getting current user profile:', profileError)
      return NextResponse.json(
        { error: 'Error getting user profile' },
        { status: 500 }
      )
    }

    if (currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Vérifier que les paramètres sont valides
    if (!user_id || !new_password) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user_id)
      .single()

    if (targetError || !targetUser) {
      console.error('Target user not found:', targetError)
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Utiliser le service role key pour mettre à jour le mot de passe d'un autre utilisateur
    const serviceSupabase = await createClient(true) // Service role pour les opérations admin
    
    // D'abord, obtenir l'utilisateur auth Supabase
    const { data: authUser, error: authError } = await serviceSupabase
      .from('auth.users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (authError || !authUser) {
      console.error('Auth user not found:', authError)
      return NextResponse.json(
        { error: 'User not found in auth system' },
        { status: 404 }
      )
    }

    // Mettre à jour le mot de passe via l'API REST de Supabase
    const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(user_id, {
      password: new_password
    })

    if (updateError) {
      console.error('Error updating user password:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    console.log(`Password updated successfully for user ${targetUser.email} by admin ${user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully',
      updatedUser: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name
      }
    })

  } catch (error) {
    console.error('Admin password update exception:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
