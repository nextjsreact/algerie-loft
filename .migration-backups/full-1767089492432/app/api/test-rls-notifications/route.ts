import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    console.log('Testing RLS on notifications table...')
    
    // Test 1: Direct insert with service role
    const supabaseService = await createClient(true)
    console.log('Testing with service role...')
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('notifications')
      .insert({
        user_id: session.user.id,
        title: 'RLS Test - Service Role',
        message: 'Testing notification creation with service role',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()

    console.log('Service role result:', { data: serviceData, error: serviceError })

    // Test 2: Direct insert with regular client
    const supabaseRegular = await createClient(false)
    console.log('Testing with regular client...')
    
    const { data: regularData, error: regularError } = await supabaseRegular
      .from('notifications')
      .insert({
        user_id: session.user.id,
        title: 'RLS Test - Regular Client',
        message: 'Testing notification creation with regular client',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()

    console.log('Regular client result:', { data: regularData, error: regularError })

    // Test 3: Check existing notifications
    const { data: existingNotifications, error: readError } = await supabaseRegular
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(5)

    console.log('Read test result:', { data: existingNotifications, error: readError })

    return NextResponse.json({
      success: true,
      tests: {
        serviceRole: {
          success: !serviceError,
          error: serviceError,
          data: serviceData
        },
        regularClient: {
          success: !regularError,
          error: regularError,
          data: regularData
        },
        readTest: {
          success: !readError,
          error: readError,
          count: existingNotifications?.length || 0
        }
      }
    })
  } catch (error) {
    console.error('RLS test failed:', error)
    return NextResponse.json(
      { error: 'RLS test failed', details: error },
      { status: 500 }
    )
  }
}