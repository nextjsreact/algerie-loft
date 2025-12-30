import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

interface TeamMemberUserId {
  user_id: string;
}

export interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  created_at: string
  updated_at: string
  last_message?: Message
  participants: ConversationParticipant[]
  unread_count?: number
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_at?: string
  role: 'admin' | 'member'
  user: {
    id: string
    full_name: string
    email: string
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  created_at: string
  updated_at?: string
  edited: boolean
  sender: {
    id: string
    full_name: string
    email: string
  }
  attachments?: MessageAttachment[]
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
}

export interface CreateConversationData {
  name?: string
  type: 'direct' | 'group'
  participant_ids: string[]
}

export interface SendMessageData {
  conversation_id: string
  content: string
  message_type?: 'text' | 'image' | 'file'
  attachments?: File[]
}

interface TeamMember {
  team_id: string;
  user_id: string;
}

interface TeamMemberUserId {
  user_id: string;
}

interface TeamMemberUserId {
  user_id: string;
}

interface TeamMemberUserId {
  user_id: string;
}

interface AdminUser {
  id: string;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  return measurePerformance(async () => {
    logger.info('Fetching user conversations', { userId })
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation:conversations (
            id,
            name,
            type,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false, foreignTable: 'conversations' })

      if (error) {
        throw error
      }

      const conversations: Conversation[] = []

      for (const item of data || []) {
        if (!item.conversation) continue

        const conv = item.conversation as any

        // Get all participants for this conversation
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            id,
            conversation_id,
            user_id,
            joined_at,
            last_read_at,
            role,
            user:profiles (
              id,
              full_name,
              email
            )
          `)
          .eq('conversation_id', conv.id)

        if (participantsError) {
          logger.warn('Failed to fetch participants', participantsError)
          continue
        }

        // Get last message for this conversation
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender_id
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get sender info for last message if it exists
        let lastMessage: Message | undefined
        if (lastMessageData) {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', lastMessageData.sender_id)
            .single()

          lastMessage = {
            id: lastMessageData.id,
            conversation_id: conv.id,
            sender_id: lastMessageData.sender_id,
            content: lastMessageData.content,
            message_type: 'text',
            created_at: lastMessageData.created_at,
            edited: false,
            sender: senderData || {
              id: lastMessageData.sender_id,
              full_name: 'Unknown User',
              email: ''
            }
          }
        }

        // Get unread count
        const currentUserParticipant = participantsData?.find(p => p.user_id === userId);
        const lastReadAt = currentUserParticipant?.last_read_at || '1970-01-01';

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', lastReadAt)
          .neq('sender_id', userId);

        conversations.push({
          id: conv.id,
          name: conv.name,
          type: conv.type,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message: lastMessage,
          participants: (participantsData || []).map(p => ({
            ...p,
            user: p.user?.[0] || { id: '', full_name: 'Unknown User', email: '' }
          })),
          unread_count: unreadCount || 0
        })
      }

      logger.info('User conversations fetched', { userId, count: conversations.length })
      return conversations
    } catch (error) {
      logger.error('Failed to fetch user conversations', error, { userId })
      throw error
    }
  }, 'getUserConversations')
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  return measurePerformance(async () => {
    logger.info('Fetching conversation messages', { conversationId, userId, limit, offset })
    const supabase = await createClient()

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

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          created_at,
          updated_at,
          edited,
          sender:profiles (
            id,
            full_name,
            email
          ),
          attachments:message_attachments (
            id,
            message_id,
            file_name,
            file_url,
            file_type,
            file_size
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      const messages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        edited: msg.edited,
        sender: msg.sender?.[0] || { id: '', full_name: 'Unknown User', email: '' },
        attachments: msg.attachments || []
      })).reverse() // Reverse to show oldest first

      // Update last read timestamp
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      logger.info('Conversation messages fetched', { 
        conversationId, 
        userId, 
        count: messages.length 
      })
      return messages
    } catch (error) {
      logger.error('Failed to fetch conversation messages', error, { conversationId, userId })
      throw error
    }
  }, 'getConversationMessages')
}

export async function createConversation(
  creatorId: string,
  data: CreateConversationData
): Promise<Conversation> {
  return measurePerformance(async () => {
    logger.info('Creating conversation', { creatorId, data })
    const supabase = await createClient()

    try {
      // Validate that creator can message all participants
      await validateConversationParticipants(creatorId, data.participant_ids, supabase)

      // For direct conversations, check if one already exists
      if (data.type === 'direct' && data.participant_ids.length === 1) {
        const otherUserId = data.participant_ids[0]
        
        // Check for existing direct conversation
        const { data: existingConv } = await supabase
          .from('conversations')
          .select(`
            id,
            name,
            type,
            created_at,
            updated_at,
            participants:conversation_participants (
              user_id
            )
          `)
          .eq('type', 'direct')

        for (const conv of existingConv || []) {
          const participantIds = conv.participants.map(p => p.user_id)
          if (participantIds.includes(creatorId) && participantIds.includes(otherUserId) && participantIds.length === 2) {
            logger.info('Found existing direct conversation', { conversationId: conv.id })
            return conv as Conversation
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: data.name,
          type: data.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (convError) {
        throw convError
      }

      // Add participants
      const participants = [
        {
          conversation_id: conversation.id,
          user_id: creatorId,
          joined_at: new Date().toISOString(),
          role: 'admin'
        },
        ...data.participant_ids.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
          joined_at: new Date().toISOString(),
          role: 'member' as const
        }))
      ]

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      if (participantsError) {
        throw participantsError
      }

      // Get full conversation data
      const fullConversation = await getConversationById(conversation.id, creatorId)
      
      logger.info('Conversation created', { conversationId: conversation.id, creatorId })
      return fullConversation
    } catch (error) {
      logger.error('Failed to create conversation', error, { creatorId, data })
      throw error
    }
  }, 'createConversation')
}

export async function sendMessage(
  senderId: string,
  data: SendMessageData
): Promise<Message> {
  return measurePerformance(async () => {
    logger.info('Sending message', { senderId, conversationId: data.conversation_id })
    const supabase = await createClient()

    try {
      // Verify sender is participant
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', data.conversation_id)
        .eq('user_id', senderId)
        .single()

      if (!participant) {
        throw new Error('User is not a participant in this conversation')
      }

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.conversation_id,
          sender_id: senderId,
          content: data.content,
          message_type: data.message_type || 'text',
          created_at: new Date().toISOString(),
          edited: false
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          created_at,
          updated_at,
          edited,
          sender:profiles (
            id,
            full_name,
            email
          )
        `)
        .single()

      if (messageError) {
        throw messageError
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.conversation_id)

      logger.info('Message sent', { messageId: message.id, senderId })
      return { ...message, sender: message.sender?.[0] || { id: '', full_name: 'Unknown User', email: '' } } as Message
    } catch (error) {
      logger.error('Failed to send message', error, { senderId, conversationId: data.conversation_id })
      throw error
    }
  }, 'sendMessage')
}

export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<Conversation> {
  const supabase = await createClient()

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

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        id,
        name,
        type,
        created_at,
        updated_at,
        participants:conversation_participants (
          id,
          conversation_id,
          user_id,
          joined_at,
          last_read_at,
          role,
          user:profiles (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', conversationId)
      .single()

    if (error) {
      throw error
    }

    return {
          ...conversation,
          participants: (conversation.participants || []).map((p: any) => ({
            ...p,
            user: p.user?.[0] || { id: '', full_name: 'Unknown User', email: '' }
          }))
        } as Conversation
  } catch (error) {
    logger.error('Failed to get conversation by ID', error, { conversationId, userId })
    throw error
  }
}

async function validateConversationParticipants(
  creatorId: string, 
  participantIds: string[], 
  supabase: any
): Promise<void> {
  // Get creator's role and teams
  const { data: creator, error: creatorError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', creatorId)
    .single()

  if (creatorError) {
    throw new Error('Failed to validate creator permissions')
  }

  // If creator is admin, they can message anyone
  if (creator.role === 'admin') {
    return
  }

  // Get creator's teams
  const { data: creatorTeams, error: teamsError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', creatorId)

  const teamIds = creatorTeams?.map((tm: TeamMember) => tm.team_id) || []

  // Get allowed user IDs (team members + admins)
  const allowedUserIds: string[] = []

  // Get all admins (they can be messaged by anyone)
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (admins) {
    allowedUserIds.push(...admins.map((a: AdminUser) => a.id))
  }

  // Get team members from creator's teams
  if (teamIds.length > 0) {
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('user_id')
      .in('team_id', teamIds)

    if (teamMembers) {
              allowedUserIds.push(...teamMembers.map((tm: TeamMemberUserId) => tm.user_id))
    }
  }

  // Check if all participants are allowed
  const uniqueAllowedIds = [...new Set(allowedUserIds)]
  const invalidParticipants = participantIds.filter(id => !uniqueAllowedIds.includes(id))

  if (invalidParticipants.length > 0) {
    throw new Error('You can only message team members and administrators')
  }
}

export async function searchUsers(query: string, currentUserId: string): Promise<Array<{
  id: string
  full_name: string
  email: string
  role?: string
}>> {
  const supabase = await createClient()

  try {
    // Get current user's role and teams
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single()

    if (currentUserError) {
      throw currentUserError
    }

    // Get current user's teams
    const { data: currentUserTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', currentUserId)

    if (teamsError) {
      logger.warn('Failed to fetch user teams, allowing search for owners only', teamsError)
    }

    const teamIds = currentUserTeams?.map(tm => tm.team_id) || []

    // Build the search query
    let searchQuery = supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .neq('id', currentUserId)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)

    // If current user is admin, they can message anyone
    if (currentUser.role === 'admin') {
      // Admin can search all users
      const { data, error } = await searchQuery.limit(10)
      
      if (error) {
        throw error
      }

      return data || []
    }

    // For non-admin users, restrict to team members and owners
    const allowedUserIds: string[] = []

    // Get all owners (they can be messaged by anyone)
    const { data: owners, error: ownersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (!ownersError && owners) {
      allowedUserIds.push(...owners.map(o => o.id))
    }

    // Get team members from user's teams
    if (teamIds.length > 0) {
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select('user_id')
        .in('team_id', teamIds)

      if (!teamMembersError && teamMembers) {
        allowedUserIds.push(...teamMembers.map((tm: TeamMemberUserId) => tm.user_id))
      }
    }

    // Remove duplicates and current user
    const uniqueAllowedIds = [...new Set(allowedUserIds)].filter(id => id !== currentUserId)

    if (uniqueAllowedIds.length === 0) {
      // User has no teams and isn't admin, can only message owners
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'admin')
        .neq('id', currentUserId)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

      if (error) {
        throw error
      }

      return data || []
    }

    // Search within allowed users
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', uniqueAllowedIds)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    logger.error('Failed to search users', error, { query, currentUserId })
    throw error
  }
}