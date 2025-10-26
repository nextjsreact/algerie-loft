import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { gdprService } from '@/lib/services/gdpr-compliance'
import { hasPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { consent_type, consent_given, consent_version } = await request.json()
    
    // Validate required fields
    if (!consent_type || consent_given === undefined) {
      return NextResponse.json(
        { error: 'Consent type and consent status are required' },
        { status: 400 }
      )
    }

    const validConsentTypes = ['data_processing', 'marketing', 'analytics', 'cookies']
    if (!validConsentTypes.includes(consent_type)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record consent
    const result = await gdprService.recordConsent({
      user_id: session.user.id,
      consent_type,
      consent_given,
      consent_date: new Date().toISOString(),
      consent_version: consent_version || '1.0',
      ip_address: ip,
      user_agent: userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'Consent recorded successfully'
    })

  } catch (error) {
    console.error('GDPR consent recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record consent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || session.user.id
    
    // Users can view their own consents, admins can view any user's consents
    if (userId !== session.user.id && !hasPermission(session.user.role, 'gdpr', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get user consents
    const consents = await gdprService.getUserConsents(userId)

    return NextResponse.json({
      success: true,
      consents
    })

  } catch (error) {
    console.error('GDPR consent fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { consent_type } = await request.json()
    
    if (!consent_type) {
      return NextResponse.json(
        { error: 'Consent type is required' },
        { status: 400 }
      )
    }

    // Withdraw consent by updating the record
    const result = await gdprService.recordConsent({
      user_id: session.user.id,
      consent_type,
      consent_given: false,
      consent_date: new Date().toISOString(),
      consent_version: '1.0'
    })

    return NextResponse.json({
      success: true,
      message: 'Consent withdrawn successfully'
    })

  } catch (error) {
    console.error('GDPR consent withdrawal error:', error)
    return NextResponse.json(
      { error: 'Failed to withdraw consent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}