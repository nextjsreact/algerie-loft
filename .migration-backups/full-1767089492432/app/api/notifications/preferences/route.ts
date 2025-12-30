import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 }
      )
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: session.user.id })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default notification preferences:', createError)
        return NextResponse.json(
          { error: 'Failed to create notification preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ preferences: newPreferences })
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('Unexpected error in notification preferences API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_notifications,
      push_notifications,
      sms_notifications,
      booking_confirmations,
      booking_reminders,
      payment_notifications,
      message_notifications,
      marketing_notifications,
      system_notifications
    } = body

    const supabase = await createClient()
    
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        email_notifications,
        push_notifications,
        sms_notifications,
        booking_confirmations,
        booking_reminders,
        payment_notifications,
        message_notifications,
        marketing_notifications,
        system_notifications,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating notification preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('Unexpected error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}