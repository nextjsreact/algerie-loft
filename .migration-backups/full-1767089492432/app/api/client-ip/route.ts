import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/client-ip
 * Get client IP address for security purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    let clientIp = 'unknown'
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      clientIp = forwarded.split(',')[0].trim()
    } else if (realIp) {
      clientIp = realIp
    } else if (cfConnectingIp) {
      clientIp = cfConnectingIp
    }

    return NextResponse.json({
      ip: clientIp,
      headers: {
        'x-forwarded-for': forwarded,
        'x-real-ip': realIp,
        'cf-connecting-ip': cfConnectingIp
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get client IP' },
      { status: 500 }
    )
  }
}