import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
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

    // For now, return mock photos since we haven't implemented the photos table
    // In a real implementation, you would query a property_photos table
    const mockPhotos = [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        caption: 'Vue d\'ensemble du loft',
        is_primary: true,
        order_index: 0
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        caption: 'Cuisine moderne',
        is_primary: false,
        order_index: 1
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        caption: 'Chambre principale',
        is_primary: false,
        order_index: 2
      }
    ]

    return NextResponse.json({ photos: mockPhotos })

  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des photos' },
      { status: 500 }
    )
  }
}