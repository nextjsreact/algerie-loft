import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    console.log('Available tables:', tables)

    // Try to create a simple loft first
    const testLoft = {
      name: 'Loft Test Centre-ville',
      description: 'Loft de test au centre d\'Alger',
      address: '15 Rue Didouche Mourad, Alger',
      price_per_night: 8500,
      max_guests: 4,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning'],
      cleaning_fee: 2000,
      tax_rate: 19,
      status: 'available',
      is_published: true
    }

    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .insert(testLoft)
      .select()
      .single()

    if (loftError) {
      console.error('Loft creation error:', loftError)
      return NextResponse.json({
        error: 'Failed to create loft',
        details: loftError.message,
        code: loftError.code,
        hint: loftError.hint
      }, { status: 500 })
    }

    // Try to create a simple customer
    const testCustomer = {
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean.test@example.com',
      phone: '+213555123456',
      status: 'active'
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select()
      .single()

    return NextResponse.json({
      message: 'Test data created successfully',
      loft: loft,
      customer: customer,
      customer_error: customerError?.message
    })

  } catch (error) {
    console.error('Create test data error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}