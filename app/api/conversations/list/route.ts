import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ conversations: [] })
    }

    // Get conversation IDs for this user
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (participantError || !participantData?.length) {
      return NextResponse.json({ conversations: [] })
    }

    const conversationIds = participantData.map(p => p.conversation_id)

    // Get conversations with participants and last message
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id, name, type, created_at, updated_at,
        participants:conversation_participants(
          user_id,
          user:profiles(id, full_name, avatar_url)
        )
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ conversations: [] })
    }

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conv,
          last_message: lastMsg || null,
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithLastMessage })
  } catch (error) {
    console.error('Error in conversations list:', error)
    return NextResponse.json({ conversations: [] })
  }
}
