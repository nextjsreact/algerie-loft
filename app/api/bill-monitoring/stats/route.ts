import { NextResponse } from 'next/server'
import { getBillMonitoringStats } from '@/lib/services/bill-monitoring'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    // Verify authentication
    await requireAuth()
    
    const stats = await getBillMonitoringStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching bill monitoring stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bill monitoring statistics' },
      { status: 500 }
    )
  }
}