import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current session - user must be logged in
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to register as a partner' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { company_name, contact_email, contact_phone, address, description } = body

    console.log('[PARTNER REGISTER] Received data:', { company_name, contact_email, contact_phone, address, description: description?.substring(0, 50) })

    // Validate required fields
    if (!company_name || !contact_email || !contact_phone || !address || !description) {
      const missing = []
      if (!company_name) missing.push('company_name')
      if (!contact_email) missing.push('contact_email')
      if (!contact_phone) missing.push('contact_phone')
      if (!address) missing.push('address')
      if (!description) missing.push('description')
      
      console.log('[PARTNER REGISTER] Missing fields:', missing)
      return NextResponse.json(
        { error: `All fields are required. Missing: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    if (description.length < 10) {
      console.log('[PARTNER REGISTER] Description too short:', description.length)
      return NextResponse.json(
        { error: `Description must be at least 10 characters (currently ${description.length})` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already has a partner profile
    const { data: existingPartner } = await supabase
      .from('partner_profiles')
      .select('id, verification_status')
      .eq('user_id', session.user.id)
      .single()

    if (existingPartner) {
      return NextResponse.json(
        { 
          error: `You already have a partner application with status: ${existingPartner.verification_status}`,
          existing: true,
          status: existingPartner.verification_status
        },
        { status: 409 }
      )
    }

    // Note: We don't update the role in profiles table because the user_role enum 
    // might not have 'partner' value. The partner_profiles table is sufficient.

    // Create partner profile
    const { data: partnerData, error: partnerError } = await supabase
      .from('partner_profiles')
      .insert({
        user_id: session.user.id,
        business_name: company_name,
        business_type: 'individual', // Default to individual
        address: address,
        phone: contact_phone,
        portfolio_description: description,
        verification_status: 'pending'
      })
      .select()
      .single()

    if (partnerError) {
      console.error('Partner profile creation error:', partnerError)
      return NextResponse.json(
        { error: 'Failed to create partner profile. Please try again.' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to admins when email service is implemented
    // For now, admins can see new partner applications in the admin dashboard

    return NextResponse.json({
      success: true,
      message: 'Votre demande de partenariat a été soumise avec succès! Notre équipe examinera votre demande.',
      partner_id: partnerData.id
    }, { status: 201 })

  } catch (error) {
    console.error('Partner registration error:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
