import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
) {
  try {
    const supabase = createClient()
    const updates = await request.json()
    
    // Get current user and verify they own this property
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const propertyId = params.id
    const ruleId = params.ruleId

    // Verify property ownership and rule ownership
    const { data: rule, error: ruleError } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        lofts!inner(owner_id)
      `)
      .eq('id', ruleId)
      .eq('loft_id', propertyId)
      .single()

    if (ruleError || !rule || rule.lofts.owner_id !== user.id) {
      return NextResponse.json({ error: 'Règle non trouvée ou accès non autorisé' }, { status: 404 })
    }

    // Validate updates if dates are being changed
    if (updates.start_date || updates.end_date) {
      const startDate = updates.start_date || rule.start_date
      const endDate = updates.end_date || rule.end_date

      if (new Date(startDate) >= new Date(endDate)) {
        return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 })
      }

      // Check for overlapping rules (excluding current rule)
      const { data: overlappingRules } = await supabase
        .from('pricing_rules')
        .select('id, name')
        .eq('loft_id', propertyId)
        .eq('is_active', true)
        .neq('id', ruleId)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

      if (overlappingRules && overlappingRules.length > 0) {
        return NextResponse.json(
          { 
            error: `Cette période chevauche avec la règle existante: ${overlappingRules[0].name}`,
            overlapping_rules: overlappingRules
          },
          { status: 400 }
        )
      }
    }

    // Validate price multiplier if being updated
    if (updates.price_multiplier !== undefined) {
      if (updates.price_multiplier <= 0 || updates.price_multiplier > 10) {
        return NextResponse.json({ error: 'Le multiplicateur de prix doit être entre 0.1 et 10' }, { status: 400 })
      }
    }

    // Update the rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('pricing_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ rule: updatedRule })

  } catch (error) {
    console.error('Error updating pricing rule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la règle de tarification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user and verify they own this property
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const propertyId = params.id
    const ruleId = params.ruleId

    // Verify property ownership and rule ownership
    const { data: rule, error: ruleError } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        lofts!inner(owner_id)
      `)
      .eq('id', ruleId)
      .eq('loft_id', propertyId)
      .single()

    if (ruleError || !rule || rule.lofts.owner_id !== user.id) {
      return NextResponse.json({ error: 'Règle non trouvée ou accès non autorisé' }, { status: 404 })
    }

    // Delete the rule
    const { error: deleteError } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting pricing rule:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la règle de tarification' },
      { status: 500 }
    )
  }
}