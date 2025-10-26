import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PrivacyService } from '@/lib/services/privacy-service'
import { gdprDataRequestSchema } from '@/lib/schemas/privacy'
import { logger } from '@/lib/logger'

/**
 * POST /api/privacy/gdpr-request
 * Submit a GDPR data request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedRequest = gdprDataRequestSchema.parse(body)

    // Get client IP for audit trail
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Submit GDPR request
    const result = await PrivacyService.submitGDPRRequest(validatedRequest, clientIp)

    logger.info('GDPR request submitted via API', {
      requestType: validatedRequest.requestType,
      email: validatedRequest.email,
      clientIp,
      success: result.success
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('GDPR request API error', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit GDPR request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/privacy/gdpr-request
 * Get GDPR requests for a user (admin only)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('gdpr_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (email) {
      query = query.eq('email', email)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to get GDPR requests', error)
      throw new Error('Failed to get GDPR requests')
    }

    return NextResponse.json({
      success: true,
      requests: data,
      pagination: {
        page,
        limit,
        total: data.length
      }
    })

  } catch (error) {
    logger.error('Get GDPR requests API error', error)
    
    return NextResponse.json(
      { error: 'Failed to get GDPR requests' },
      { status: 500 }
    )
  }
}