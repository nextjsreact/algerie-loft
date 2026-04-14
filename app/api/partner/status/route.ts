import { NextRequest, NextResponse } from 'next/server'
import { getPartnerInfo } from '@/lib/partner-auth'

export async function GET(request: NextRequest) {
  try {
    const partnerInfo = await getPartnerInfo()

    if (!partnerInfo) {
      return NextResponse.json(
        { error: 'Partner profile not found', hasProfile: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hasProfile: true,
      verification_status: 'verified', // Owner exists = verified
      business_name: partnerInfo.ownerName,
      owner_id: partnerInfo.ownerId,
    })

  } catch (error) {
    console.error('Partner status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
