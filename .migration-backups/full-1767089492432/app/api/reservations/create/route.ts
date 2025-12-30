import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ErrorHandler, createSuccessResponse, validateRequiredFields } from '@/lib/services/error-handler'
import { logger, reservationLogger, apiLogger, LogCategory } from '@/lib/services/logging-service'
import { LoftRepository } from '@/lib/repositories/loft-repository'
import { ReservationRepository } from '@/lib/repositories/reservation-repository'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const route = '/api/reservations/create'
  const context = ErrorHandler.extractErrorContext(request, 'create_reservation_v2')
  
  // Log API request
  apiLogger.request('POST', route, context)

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

    logger.info('Creating reservation (v2 endpoint)', LogCategory.RESERVATION, context, { 
      loft_id, 
      check_in_date, 
      check_out_date,
      has_guest_info: !!guest_info
    })

    // Validate required fields using enhanced validation
    const missingFields = validateRequiredFields(
      { loft_id, check_in_date, check_out_date, guest_info },
      ['loft_id', 'check_in_date', 'check_out_date', 'guest_info']
    )

    if (missingFields.length > 0) {
      reservationLogger.validationFailed([`Missing required fields: ${missingFields.join(', ')}`], loft_id, context)
      
      const error = ErrorHandler.handleValidationError(
        [`Missing required fields: ${missingFields.join(', ')}`],
        context
      )
      
      apiLogger.response('POST', route, 400, Date.now() - startTime, context)
      return ErrorHandler.createErrorResponse(error, 400)
    }

    // Validate guest info structure
    if (!guest_info.primary_guest || !guest_info.primary_guest.first_name || 
        !guest_info.primary_guest.last_name || !guest_info.primary_guest.email) {
      
      reservationLogger.validationFailed(['Missing primary guest information'], loft_id, context)
      
      const error = ErrorHandler.handleValidationError(
        ['Missing primary guest information: first_name, last_name, and email are required'],
        context
      )
      
      apiLogger.response('POST', route, 400, Date.now() - startTime, context)
      return ErrorHandler.createErrorResponse(error, 400)
    }

    if (!terms_accepted) {
      reservationLogger.validationFailed(['Terms and conditions not accepted'], loft_id, context)
      
      const error = ErrorHandler.handleValidationError(
        ['Terms and conditions must be accepted'],
        context
      )
      
      apiLogger.response('POST', route, 400, Date.now() - startTime, context)
      return ErrorHandler.createErrorResponse(error, 400)
    }

    const supabase = await createClient()

    // Vérifier que le loft existe et est disponible
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('id, name, price_per_night, cleaning_fee, tax_rate, max_guests, status')
      .eq('id', loft_id)
      .eq('status', 'available')
      .single()

    if (loftError || !loft) {
      return NextResponse.json(
        { error: 'Loft not found or not available' },
        { status: 404 }
      )
    }

    // Vérifier la disponibilité pour les dates demandées
    const { data: conflicts } = await supabase
      .from('reservations')
      .select('id')
      .eq('loft_id', loft_id)
      .in('status', ['confirmed', 'pending'])
      .or(`check_in_date.lt.${check_out_date},check_out_date.gt.${check_in_date}`)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Loft not available for selected dates',
          conflicting_reservations: conflicts.length
        },
        { status: 409 }
      )
    }

    // Calculer le pricing
    const pricing = calculatePricing(loft, check_in_date, check_out_date)

    // Créer ou récupérer le client
    let customer = null
    try {
      // Essayer de trouver un client existant
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', guest_info.primary_guest.email)
        .single()

      if (existingCustomer) {
        customer = existingCustomer
      } else {
        // Créer un nouveau client
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            first_name: guest_info.primary_guest.first_name,
            last_name: guest_info.primary_guest.last_name,
            email: guest_info.primary_guest.email,
            phone: guest_info.primary_guest.phone,
            nationality: guest_info.primary_guest.nationality,
            status: 'active'
          })
          .select('id')
          .single()

        if (customerError) {
          console.warn('Customer creation failed:', customerError)
        } else {
          customer = newCustomer
        }
      }
    } catch (customerError) {
      console.warn('Customer handling error:', customerError)
    }

    // Préparer les données de réservation
    const reservationData = {
      loft_id,
      customer_id: customer?.id || null,
      check_in_date,
      check_out_date,
      
      // Informations client pour compatibilité avec le schéma existant
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
      terms_accepted_at: new Date().toISOString()
    }

    // Créer la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select(`
        id,
        loft_id,
        customer_id,
        check_in_date,
        check_out_date,
        guest_name,
        guest_email,
        guest_phone,
        base_price,
        cleaning_fee,
        total_amount,
        status,
        payment_status,
        special_requests,
        created_at
      `)
      .single()

    if (reservationError) {
      console.error('Reservation creation error:', reservationError)
      return NextResponse.json(
        { 
          error: 'Failed to create reservation', 
          details: reservationError.message 
        },
        { status: 500 }
      )
    }

    // Enrichir la réponse avec les informations du loft
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

// Fonction utilitaire pour calculer le pricing
function calculatePricing(loft: any, checkIn: string, checkOut: string) {
  try {
    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (nights <= 0) {
      throw new Error('Invalid date range')
    }
    
    const basePrice = loft.price_per_night * nights
    const cleaningFee = loft.cleaning_fee || 0
    const taxRate = loft.tax_rate || 19
    const serviceRate = 10 // 10% de frais de service
    
    const serviceFee = (basePrice + cleaningFee) * (serviceRate / 100)
    const taxes = (basePrice + cleaningFee + serviceFee) * (taxRate / 100)
    const total = basePrice + cleaningFee + serviceFee + taxes
    
    return {
      nights,
      nightly_rate: loft.price_per_night,
      base_price: basePrice,
      cleaning_fee: cleaningFee,
      service_fee: serviceFee,
      service_fee_rate: serviceRate,
      taxes,
      tax_rate: taxRate,
      total_amount: Math.round(total * 100) / 100,
      currency: 'DZD'
    }
  } catch (error) {
    throw new Error(`Pricing calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}