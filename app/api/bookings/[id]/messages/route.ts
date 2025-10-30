import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

// GET /api/bookings/[id]/messages - Get messages for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createClient()
    
    // First verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('client_id, partner_id')
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in this booking
    if (booking.client_id !== session.user.id && booking.partner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this booking' },
        { status: 403 }
      )
    }

    // Get messages with pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: messages, error, count } = await supabase
      .from('booking_messages')
      .select(`
        id,
        message,
        message_type,
        attachment_url,
        attachment_name,
        attachment_size,
        is_read,
        read_at,
        created_at,
        sender:sender_id(id, full_name, email),
        recipient:recipient_id(id, full_name, email)
      `, { count: 'exact' })
      .eq('booking_id', params.id)
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Error fetching booking messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Mark messages as read for the current user
    if (messages && messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.is_read && msg.recipient?.id === session.user.id)
        .map(msg => msg.id)

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('booking_messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', unreadMessageIds)
      }
    }

    return NextResponse.json({
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error in booking messages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bookings/[id]/messages - Send a message for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const body = await request.json()
    const {
      message,
      message_type = 'text',
      attachment_url,
      attachment_name,
      attachment_size
    } = body

    if (!message && !attachment_url) {
      return NextResponse.json(
        { error: 'Message content or attachment is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verify user has access to this booking and get recipient
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('client_id, partner_id')
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Determine recipient based on sender
    let recipientId: string
    if (booking.client_id === session.user.id) {
      recipientId = booking.partner_id
    } else if (booking.partner_id === session.user.id) {
      recipientId = booking.client_id
    } else {
      return NextResponse.json(
        { error: 'Unauthorized to send messages for this booking' },
        { status: 403 }
      )
    }

    // Use the database function to send the message
    const { data: result, error } = await supabase
      .rpc('send_booking_message', {
        p_booking_id: params.id,
        p_sender_id: session.user.id,
        p_recipient_id: recipientId,
        p_message: message || '',
        p_message_type: message_type,
        p_attachment_url: attachment_url,
        p_attachment_name: attachment_name,
        p_attachment_size: attachment_size
      })

    if (error) {
      console.error('Error sending booking message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Get the created message with sender info
    const { data: newMessage, error: fetchError } = await supabase
      .from('booking_messages')
      .select(`
        id,
        message,
        message_type,
        attachment_url,
        attachment_name,
        attachment_size,
        is_read,
        read_at,
        created_at,
        sender:sender_id(id, full_name, email),
        recipient:recipient_id(id, full_name, email)
      `)
      .eq('id', result)
      .single()

    if (fetchError) {
      console.error('Error fetching created message:', fetchError)
      return NextResponse.json(
        { error: 'Message sent but failed to retrieve details' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: newMessage }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error sending booking message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}