import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PrivacyService } from '@/lib/services/privacy-service'
import { cookieConsentSchema } from '@/lib/schemas/privacy'
import { logger } from '@/lib/logger'

/**
 * POST /api/privacy/cookie-consent
 * Record cookie consent for a user or session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, consent } = body

    // Validate consent data
    const validatedConsent = cookieConsentSchema.parse(consent)

    // Get client IP and user agent
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record consent
    const result = await PrivacyService.recordCookieConsent(
      userId || null,
      validatedConsent,
      clientIp,
      userAgent
    )

    logger.info('Cookie consent recorded via API', {
      userId,
      sessionId,
      consentId: result.id,
      clientIp
    })

    return NextResponse.json({
      success: true,
      consentId: result.id,
      message: 'Cookie consent recorded successfully'
    })

  } catch (error) {
    logger.error('Cookie consent API error', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid consent data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to record cookie consent' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/privacy/cookie-consent
 * Get cookie consent for a user or session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId required' },
        { status: 400 }
      )
    }

    const consent = await PrivacyService.getCookieConsent(userId, sessionId)

    return NextResponse.json({
      success: true,
      consent: consent
    })

  } catch (error) {
    logger.error('Get cookie consent API error', error)
    
    return NextResponse.json(
      { error: 'Failed to get cookie consent' },
      { status: 500 }
    )
  }
}