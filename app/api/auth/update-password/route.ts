import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

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

    console.log('Updating password for user:', user.email)

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    console.log('Password updated successfully for user:', user.email)

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully' 
    })

  } catch (error) {
    console.error('Password update exception:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}