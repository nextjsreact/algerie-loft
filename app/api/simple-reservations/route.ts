import { NextRequest, NextResponse } from 'next/server'

// Stockage temporaire en mémoire pour les réservations de test
let reservations: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      loft_id,
      check_in_date,
      check_out_date,
      guest_info,
      special_requests,
      terms_accepted
    } = body

    console.log('Creating reservation:', { loft_id, check_in_date, check_out_date, guest_info })

    // Validation des données requises
    if (!loft_id || !check_in_date || !check_out_date || !guest_info) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['loft_id', 'check_in_date', 'check_out_date', 'guest_info']
        },
        { status: 400 }
      )
    }

    if (!guest_info.primary_guest || !guest_info.primary_guest.first_name || 
        !guest_info.primary_guest.last_name || !guest_info.primary_guest.email) {
      return NextResponse.json(
        { 
          error: 'Missing primary guest information',
          required: ['primary_guest.first_name', 'primary_guest.last_name', 'primary_guest.email']
        },
        { status: 400 }
      )
    }

    if (!terms_accepted) {
      return NextResponse.json(
        { error: 'Terms and conditions must be accepted' },
        { status: 400 }
      )
    }

    // Données de test des lofts
    const testLofts = {
      '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef': {
        id: '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef',
        name: 'Loft Test Centre-ville',
        price_per_night: 8500,
        max_guests: 4,
        cleaning_fee: 2000,
        tax_rate: 19,
        status: 'available'
      },
      '5c6d7e8f-9a1b-2c3d-4e5f-6789abcdef01': {
        id: '5c6d7e8f-9a1b-2c3d-4e5f-6789abcdef01',
        name: 'Studio Test Hydra',
        price_per_night: 6000,
        max_guests: 2,
        cleaning_fee: 1500,
        tax_rate: 19,
        status: 'available'
      },
      '6d7e8f9a-1b2c-3d4e-5f67-89abcdef0123': {
        id: '6d7e8f9a-1b2c-3d4e-5f67-89abcdef0123',
        name: 'Appartement Familial Bab Ezzouar',
        price_per_night: 12000,
        max_guests: 6,
        cleaning_fee: 3000,
        tax_rate: 19,
        status: 'available'
      }
    }

    const loft = testLofts[loft_id as keyof typeof testLofts]

    if (!loft) {
      return NextResponse.json(
        { error: 'Loft not found or not available' },
        { status: 404 }
      )
    }

    // Calculer le pricing
    const startDate = new Date(check_in_date)
    const endDate = new Date(check_out_date)
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const basePrice = loft.price_per_night * nights
    const cleaningFee = loft.cleaning_fee || 0
    const serviceFee = (basePrice + cleaningFee) * 0.1
    const taxes = (basePrice + cleaningFee + serviceFee) * (loft.tax_rate / 100)
    const totalAmount = basePrice + cleaningFee + serviceFee + taxes

    const pricing = {
      nights,
      nightly_rate: loft.price_per_night,
      base_price: basePrice,
      cleaning_fee: cleaningFee,
      service_fee: serviceFee,
      service_fee_rate: 10,
      taxes,
      tax_rate: loft.tax_rate,
      total_amount: Math.round(totalAmount * 100) / 100,
      currency: 'DZD'
    }

    // Créer la réservation
    const reservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loft_id,
      check_in_date,
      check_out_date,
      
      // Informations client
      guest_name: `${guest_info.primary_guest.first_name} ${guest_info.primary_guest.last_name}`,
      guest_email: guest_info.primary_guest.email,
      guest_phone: guest_info.primary_guest.phone || '',
      guest_nationality: guest_info.primary_guest.nationality || '',
      
      // Pricing
      base_price: pricing.base_price,
      cleaning_fee: pricing.cleaning_fee,
      total_amount: pricing.total_amount,
      
      // Autres informations
      special_requests: special_requests || '',
      status: 'pending',
      payment_status: 'pending',
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      
      // Métadonnées
      created_at: new Date().toISOString(),
      confirmation_code: `LA${Date.now().toString().slice(-6)}`,
      booking_reference: `LA25${Math.random().toString().slice(-6)}`
    }

    // Stocker la réservation en mémoire
    reservations.push(reservation)

    // Enrichir la réponse
    const response = {
      ...reservation,
      loft: {
        id: loft.id,
        name: loft.name
      },
      pricing_breakdown: pricing,
      guest_info,
      next_steps: {
        payment_required: true,
        payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        confirmation_pending: true
      }
    }

    console.log('Reservation created successfully:', reservation.id)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Create reservation API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customer_email = searchParams.get('customer_email')

    let filteredReservations = reservations

    if (customer_email) {
      filteredReservations = reservations.filter(res => res.guest_email === customer_email)
    }

    return NextResponse.json({
      reservations: filteredReservations.map(res => ({
        ...res,
        loft: {
          name: res.loft_id === '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef' ? 'Loft Test Centre-ville' :
                res.loft_id === '5c6d7e8f-9a1b-2c3d-4e5f-6789abcdef01' ? 'Studio Test Hydra' :
                'Appartement Familial Bab Ezzouar'
        }
      }))
    })

  } catch (error) {
    console.error('Get reservations API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}