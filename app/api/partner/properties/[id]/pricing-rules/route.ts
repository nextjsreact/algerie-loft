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

    // Get pricing rules for this property
    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('loft_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ rules: rules || [] })

  } catch (error) {
    console.error('Error fetching pricing rules:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des règles de tarification' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { 
      name, 
      description, 
      start_date, 
      end_date, 
      price_multiplier, 
      minimum_stay, 
      rule_type 
    } = await request.json()
    
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

    // Validate input
    if (!name || !start_date || !end_date || !price_multiplier) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 })
    }

    if (price_multiplier <= 0 || price_multiplier > 10) {
      return NextResponse.json({ error: 'Le multiplicateur de prix doit être entre 0.1 et 10' }, { status: 400 })
    }

    // Check for overlapping rules
    const { data: overlappingRules } = await supabase
      .from('pricing_rules')
      .select('id, name')
      .eq('loft_id', propertyId)
      .eq('is_active', true)
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)

    if (overlappingRules && overlappingRules.length > 0) {
      return NextResponse.json(
        { 
          error: `Cette période chevauche avec la règle existante: ${overlappingRules[0].name}`,
          overlapping_rules: overlappingRules
        },
        { status: 400 }
      )
    }

    // Create pricing rule
    const { data: newRule, error: insertError } = await supabase
      .from('pricing_rules')
      .insert({
        loft_id: propertyId,
        name,
        description: description || null,
        start_date,
        end_date,
        price_multiplier,
        minimum_stay: minimum_stay || 1,
        rule_type: rule_type || 'custom',
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ rule: newRule })

  } catch (error) {
    console.error('Error creating pricing rule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la règle de tarification' },
      { status: 500 }
    )
  }
}