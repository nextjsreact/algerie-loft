import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { role } = await request.json()
    
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

    // Validate role
    const validRoles = ['client', 'employee', 'manager', 'executive', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const userId = params.id

    // Prevent admin from modifying their own account
    if (userId === user.id) {
      return NextResponse.json({ error: 'Impossible de modifier votre propre rôle' }, { status: 400 })
    }

    // Update role in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    // Update role in auth.users metadata using admin client
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          role: role,
          active_role: role,
          last_role_update: new Date().toISOString()
        }
      }
    )

    if (metadataError) {
      console.error('Metadata update error:', metadataError)
      // Don't fail the request if metadata update fails, but log it
    }

    return NextResponse.json({ 
      success: true,
      message: 'Rôle mis à jour avec succès'
    })

  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    )
  }
}