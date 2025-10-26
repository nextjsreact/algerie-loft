import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
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

    // Build query
    let query = supabase
      .from('partner_profiles')
      .select(`
        id,
        user_id,
        business_name,
        business_type,
        tax_id,
        address,
        phone,
        verification_status,
        verification_documents,
        created_at,
        profiles!partner_profiles_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('verification_status', status)
    }

    const { data: partners, error } = await query

    if (error) {
      throw error
    }

    // Transform the data for the frontend
    const transformedPartners = partners?.map(partner => ({
      id: partner.id,
      user_id: partner.user_id,
      business_name: partner.business_name,
      business_type: partner.business_type,
      tax_id: partner.tax_id,
      address: partner.address,
      phone: partner.phone,
      verification_status: partner.verification_status,
      verification_documents: partner.verification_documents || [],
      created_at: partner.created_at,
      user: {
        full_name: partner.profiles?.full_name || 'Nom inconnu',
        email: partner.profiles?.email || 'Email inconnu'
      }
    })) || []

    return NextResponse.json({ partners: transformedPartners })

  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des partenaires' },
      { status: 500 }
    )
  }
}