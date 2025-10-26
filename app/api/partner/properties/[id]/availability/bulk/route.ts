import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { updates } = await request.json()
    
    // Get current user and verify they own this property
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const propertyId = params.id

    // Verify property ownership
    const { data: property, error: propertyError } = await supabase
      .from('lofts')
      .select('owner_id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property || property.owner_id !== user.id) {
      return NextResponse.json({ error: 'Propriété non trouvée ou accès non autorisé' }, { status: 404 })
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Aucune mise à jour fournie' }, { status: 400 })
    }

    // Check for existing bookings on dates being blocked
    const datesToBlock = updates
      .filter(update => update.is_available === false)
      .map(update => update.date)

    if (datesToBlock.length > 0) {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('loft_id', propertyId)
        .in('status', ['confirmed', 'pending'])

      // Check if any booking overlaps with dates to block
      const hasConflict = existingBookings?.some(booking => {
        return datesToBlock.some(date => {
          const checkDate = new Date(date)
          const checkIn = new Date(booking.check_in)
          const checkOut = new Date(booking.check_out)
          return checkDate >= checkIn && checkDate < checkOut
        })
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Impossible de bloquer des dates avec des réservations actives' },
          { status: 400 }
        )
      }
    }

    // Prepare bulk upsert data
    const upsertData = updates.map(update => ({
      loft_id: propertyId,
      date: update.date,
      is_available: update.is_available ?? true,
      price_override: update.price_override || null,
      minimum_stay: update.minimum_stay || 1
    }))

    // Perform bulk upsert
    const { error: upsertError } = await supabase
      .from('loft_availability')
      .upsert(upsertData)

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({ 
      success: true,
      updated_count: updates.length
    })

  } catch (error) {
    console.error('Error bulk updating availability:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour en lot' },
      { status: 500 }
    )
  }
}