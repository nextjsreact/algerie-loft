import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { action } = await request.json()
    
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

    const userId = params.id

    // Prevent admin from modifying their own account
    if (userId === user.id) {
      return NextResponse.json({ error: 'Impossible de modifier votre propre compte' }, { status: 400 })
    }

    switch (action) {
      case 'activate':
        const { error: activateError } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .eq('id', userId)

        if (activateError) throw activateError
        break

      case 'deactivate':
        const { error: deactivateError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', userId)

        if (deactivateError) throw deactivateError
        break

      case 'delete':
        // First check if user has active bookings
        const { count: activeBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', userId)
          .in('status', ['pending', 'confirmed'])

        if (activeBookings && activeBookings > 0) {
          return NextResponse.json(
            { error: 'Impossible de supprimer un utilisateur avec des réservations actives' },
            { status: 400 }
          )
        }

        // Delete user profile (this will cascade to related data)
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId)

        if (deleteError) throw deleteError
        break

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'utilisateur' },
      { status: 500 }
    )
  }
}