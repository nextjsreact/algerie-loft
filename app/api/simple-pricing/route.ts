import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      loft_id,
      check_in_date,
      check_out_date,
      guests = 1
    } = body

    console.log('Calculating pricing for:', { loft_id, check_in_date, check_out_date, guests })

    // Validation des données requises
    if (!loft_id || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['loft_id', 'check_in_date', 'check_out_date']
        },
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
        { error: 'Loft not found' },
        { status: 404 }
      )
    }

    // Validation des dates
    const startDate = new Date(check_in_date)
    const endDate = new Date(check_out_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      )
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Vérifier le nombre d'invités
    if (guests > loft.max_guests) {
      return NextResponse.json(
        { 
          error: `Maximum ${loft.max_guests} guests allowed for this loft`,
          max_guests: loft.max_guests
        },
        { status: 400 }
      )
    }

    // Calculer le pricing
    const basePrice = loft.price_per_night * nights
    const cleaningFee = loft.cleaning_fee || 0
    const taxRate = loft.tax_rate || 19
    const serviceRate = 10 // 10% de frais de service

    // Calculer les frais de service
    const serviceFee = (basePrice + cleaningFee) * (serviceRate / 100)
    
    // Calculer les taxes
    const subtotal = basePrice + cleaningFee + serviceFee
    const taxes = subtotal * (taxRate / 100)
    
    const finalTotal = subtotal + taxes

    // Construire la réponse détaillée
    const pricingBreakdown = {
      // Informations de base
      loft_id: loft.id,
      loft_name: loft.name,
      check_in_date,
      check_out_date,
      nights,
      guests,
      
      // Détail des prix
      nightly_rate: loft.price_per_night,
      base_price: basePrice,
      cleaning_fee: cleaningFee,
      service_fee: serviceFee,
      service_fee_rate: serviceRate,
      
      // Taxes
      subtotal,
      taxes,
      tax_rate: taxRate,
      
      // Total
      total_amount: Math.round(finalTotal * 100) / 100,
      currency: 'DZD',
      
      // Métadonnées
      calculation_date: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      
      // Informations de validation
      validation: {
        dates_available: true,
        guests_allowed: true,
        stay_duration_valid: true,
        loft_available: true
      }
    }

    console.log('Pricing calculated successfully:', {
      loft_id,
      nights,
      total: finalTotal
    })

    return NextResponse.json(pricingBreakdown)

  } catch (error) {
    console.error('Pricing calculation API error:', error)
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