import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    
    // Get current user and verify they own this property
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params;
    const propertyId = id;

    // Get property with ownership verification
    const { data: property, error } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', propertyId)
      .eq('owner_id', user.id)
      .single()

    if (error || !property) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ property })

  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la propriété' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const updates = await request.json()
    
    // Get current user and verify they own this property
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params;
    const propertyId = id;

    // Verify property ownership
    const { data: existingProperty, error: fetchError } = await supabase
      .from('lofts')
      .select('owner_id')
      .eq('id', propertyId)
      .single()

    if (fetchError || !existingProperty || existingProperty.owner_id !== user.id) {
      return NextResponse.json({ error: 'Propriété non trouvée ou accès non autorisé' }, { status: 404 })
    }

    // Update property
    const { data: updatedProperty, error: updateError } = await supabase
      .from('lofts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ property: updatedProperty })

  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la propriété' },
      { status: 500 }
    )
  }
}