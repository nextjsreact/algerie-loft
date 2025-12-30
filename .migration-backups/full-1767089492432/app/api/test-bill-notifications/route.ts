import { NextRequest, NextResponse } from 'next/server'
import { checkBillDueNotifications } from '@/lib/services/bill-notifications'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing bill notifications...')
    await checkBillDueNotifications()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bill notifications checked successfully' 
    })
  } catch (error) {
    console.error('Bill notification test failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}