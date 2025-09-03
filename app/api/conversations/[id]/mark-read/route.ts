import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use service role to bypass RLS issues
    const supabase = await createClient(true)
    
    // Get current user from regular client
    const regularSupabase = await createClient()
    const { data: { user }, error: userError } = await regularSupabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id: conversationId } = await params

    // Verify user is participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Update or insert last_read_at for this user in this conversation
    const { error: upsertError } = await supabase
      .from('conversation_participants')
      .update({ 
        last_read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    if (upsertError) {
      console.error('Error updating last_read_at:', upsertError)
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking conversation as read:', error)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}