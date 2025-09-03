import { createClient } from '@/utils/supabase/server'

interface SupabaseError {
  message: string;
  code: string;
  details: string;
  hint: string;
}

/**
 * Version simplifiée du service conversations pour éviter les problèmes RLS
 * À utiliser temporairement pendant la correction des politiques
 */

export interface SimpleConversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  created_at: string
  updated_at: string
  participant_count?: number
}

export interface SimpleMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name?: string
}

export async function getSimpleUserConversations(userId: string): Promise<SimpleConversation[]> {
  // Use service role to bypass RLS policies temporarily
  const supabase = await createClient(true)

  try {
    console.log('Starting getSimpleUserConversations for userId:', userId)
    
    // First, let's check if the table exists by trying a simple query
    console.log('Testing Supabase connection...')
    
    let testData, testError: SupabaseError | null
    try {
      const result = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .limit(1)
      testData = result.data
      testError = result.error
      console.log('Supabase query result:', { data: testData, error: testError })
    } catch (e) {
      console.error('Supabase query threw exception:', e)
      testError = e as SupabaseError
    }
    
    if (testError) {
      console.error('Table test error:', testError)
      console.error('Error details:', {
        message: (testError as any)?.message,
        code: (testError as any)?.code,
        details: (testError as any)?.details,
        hint: (testError as any)?.hint,
        full: testError
      })
      
      // Check for infinite recursion in RLS policies
      if ((testError as any)?.message?.includes('infinite recursion') || 
          (testError as any)?.message?.includes('policy')) {
        throw new Error('RLS policy infinite recursion detected. Please run the RLS fix script.')
      }
      
      // Check if it's a table not found error
      if ((testError as any)?.message?.includes('relation') || 
          (testError as any)?.message?.includes('does not exist') ||
          (testError as any)?.code === 'PGRST116') {
        throw new Error('Conversations tables not found. Please run the database setup script.')
      }
      
      // Check for permission errors
      if ((testError as any)?.code === '42501' || (testError as any)?.message?.includes('permission')) {
        throw new Error('Permission denied accessing conversations table. Check RLS policies.')
      }
      
      // Check for authentication errors
      if ((testError as any)?.code === '42P01' || (testError as any)?.message?.includes('authentication')) {
        throw new Error('Authentication error accessing conversations table.')
      }
      
      throw new Error(`Conversations table not accessible: ${(testError as any)?.message || (testError as any)?.code || JSON.stringify(testError)}`)
    }
    
    console.log('Table exists, proceeding with user query')
    
    // Get conversations where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    if (participantError) {
      console.error('Error fetching user conversations:', participantError)
      
      // Check if it's a table not found error
      if ((participantError as SupabaseError)?.message?.includes('relation') || 
          (participantError as SupabaseError)?.message?.includes('does not exist') ||
          (participantError as SupabaseError)?.code === 'PGRST116') {
        throw new Error('Conversations tables not found. Please run the database setup script.')
      }
      
      throw new Error(`Database error: ${(participantError as SupabaseError)?.message || (participantError as SupabaseError)?.details || JSON.stringify(participantError)}`)
    }

    if (!participantData || participantData.length === 0) {
      return []
    }

    const conversationIds = participantData.map(p => p.conversation_id).filter(Boolean)
    
    if (conversationIds.length === 0) {
      return []
    }

    // Get conversation details
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, name, type, created_at, updated_at')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      throw new Error(`Database error: ${(conversationsError as SupabaseError)?.message || 'Unknown error'}`)
    }

    // Add participant count for each conversation
    const conversationsWithCount = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count } = await supabase
          .from('conversation_participants')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)

        return {
          ...conv,
          participant_count: count || 0
        }
      })
    )

    return conversationsWithCount
  } catch (error) {
    console.error('Failed to fetch user conversations:', error)
    
    // If it's already a properly formatted error, re-throw it
    if (error instanceof Error) {
      throw error
    }
    
    // Handle unexpected error formats
    const errorMessage = typeof error === 'object' && error !== null 
      ? JSON.stringify(error) 
      : String(error)
    
    throw new Error(`Unexpected error: ${errorMessage}`)
  }
}

export async function getSimpleConversationMessages(
  conversationId: string,
  userId: string,
  limit: number = 50
): Promise<SimpleMessage[]> {
  // Use service role to bypass RLS policies
  const supabase = await createClient(true)

  try {
    // Verify user is participant (simple check)
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single()

    if (!participant) {
      console.error('User is not a participant in this conversation')
      return []
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return []
    }

    // Get sender names
    const messagesWithSenders = await Promise.all(
      (messages || []).map(async (msg) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', msg.sender_id)
          .single()

        return {
          ...msg,
          sender_name: sender?.full_name || 'Unknown User'
        }
      })
    )

    return messagesWithSenders.reverse() // Show oldest first
  } catch (error) {
    console.error('Failed to fetch conversation messages:', error)
    return []
  }
}

export async function createSimpleConversation(
  creatorId: string,
  participantIds: string[],
  name?: string,
  type: 'direct' | 'group' = 'direct'
): Promise<SimpleConversation | null> {
  // Use service role to bypass RLS policies
  const supabase = await createClient(true)

  try {
    // Auto-generate name for direct messages if not provided
    let conversationName = name
    if (type === 'direct' && !name) {
      const allParticipantIds = [creatorId, ...participantIds]
      const profiles = await supabase
        .from('profiles')
        .select('full_name')
        .in('id', allParticipantIds)
      
      if (profiles.data) {
        conversationName = profiles.data.map(p => p.full_name).join(', ')
      } else {
        conversationName = 'Direct Message'
      }
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        name: conversationName,
        type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return null
    }

    // Add participants
    const participants = [
      {
        conversation_id: conversation.id,
        user_id: creatorId,
        joined_at: new Date().toISOString(),
        role: 'admin'
      },
      ...participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        joined_at: new Date().toISOString(),
        role: 'member'
      }))
    ]

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participants)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      return null
    }

    return {
      id: conversation.id,
      name: conversation.name,
      type: conversation.type,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      participant_count: participants.length
    }
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return null
  }
}

export async function getSimpleConversationById(
  conversationId: string,
  userId: string
): Promise<any> {
  const supabase = await createClient(true)

  try {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single()

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    // Get conversation details
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('id, name, type, created_at, updated_at')
      .eq('id', conversationId)
      .single()

    if (error) {
      throw error
    }

    // Get participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        user:profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)

    return {
      ...conversation,
      participants: participants || []
    }
  } catch (error) {
    console.error('Failed to get conversation by ID:', error)
    throw error
  }
}

export async function sendSimpleMessage(
  senderId: string,
  conversationId: string,
  content: string
): Promise<SimpleMessage | null> {
  // Use service role to bypass RLS policies
  const supabase = await createClient(true)

  try {
    // Verify sender is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single()

    if (!participant) {
      console.error('User is not a participant in this conversation')
      return null
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
        message_type: 'text',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      return null
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Get sender name
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single()

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      created_at: message.created_at,
      sender_name: sender?.full_name || 'Unknown User'
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    return null
  }
}