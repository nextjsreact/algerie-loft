import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SecurePaymentService } from '@/lib/services/secure-payment-service'
import { securePaymentSchema } from '@/lib/schemas/privacy'
import { logger } from '@/lib/logger'

/**
 * POST /api/privacy/secure-payment
 * Process a secure payment with PCI DSS compliance
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, ...paymentData } = body
    
    // Validate payment data
    const validatedPayment = securePaymentSchema.parse(paymentData)

    // Add security context
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const securePaymentData = {
      ...validatedPayment,
      clientIp,
      userAgent
    }

    // Process secure payment
    const result = await SecurePaymentService.processSecurePayment(
      securePaymentData,
      user.id,
      bookingId
    )

    logger.info('Secure payment processed via API', {
      userId: user.id,
      bookingId,
      paymentId: result.paymentId,
      success: result.success,
      amount: validatedPayment.amount,
      currency: validatedPayment.currency
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Secure payment API error', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('consent')) {
      return NextResponse.json(
        { error: 'Payment consent required' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/privacy/secure-payment
 * Get payment history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const paymentHistory = await SecurePaymentService.getPaymentHistory(user.id, limit)

    return NextResponse.json({
      success: true,
      payments: paymentHistory
    })

  } catch (error) {
    logger.error('Get payment history API error', error)
    
    return NextResponse.json(
      { error: 'Failed to get payment history' },
      { status: 500 }
    )
  }
}