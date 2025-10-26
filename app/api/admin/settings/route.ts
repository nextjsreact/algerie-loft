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

    // For now, return default settings
    // In a real implementation, you would have a platform_settings table
    const defaultSettings = {
      booking_commission_rate: 10.0,
      minimum_booking_amount: 50,
      maximum_booking_days: 30,
      partner_verification_required: true,
      auto_approve_bookings: false,
      cancellation_policy_hours: 24,
      refund_processing_days: 7,
      platform_maintenance_mode: false,
      registration_enabled: true,
      partner_registration_enabled: true
    }

    /* Real implementation would be:
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error
    }
    */

    return NextResponse.json({ settings: defaultSettings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des paramètres' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { settings } = await request.json()
    
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

    // Validate settings
    if (settings.booking_commission_rate < 0 || settings.booking_commission_rate > 50) {
      return NextResponse.json({ error: 'Le taux de commission doit être entre 0 et 50%' }, { status: 400 })
    }

    if (settings.minimum_booking_amount < 0) {
      return NextResponse.json({ error: 'Le montant minimum ne peut pas être négatif' }, { status: 400 })
    }

    if (settings.maximum_booking_days < 1 || settings.maximum_booking_days > 365) {
      return NextResponse.json({ error: 'La durée maximum doit être entre 1 et 365 jours' }, { status: 400 })
    }

    // For now, just log the settings update
    // In a real implementation, you would update the platform_settings table
    console.log('Platform settings updated:', settings)

    /* Real implementation would be:
    const { error: updateError } = await supabase
      .from('platform_settings')
      .upsert({
        id: 1, // Assuming single row for platform settings
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })

    if (updateError) throw updateError
    */

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des paramètres' },
      { status: 500 }
    )
  }
}