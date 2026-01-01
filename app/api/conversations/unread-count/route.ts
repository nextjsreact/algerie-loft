import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Cache simple pour les conversations
const conversationCache = new Map<string, { count: number, timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 secondes

export async function GET(request: NextRequest) {
  try {
    // SÉCURISÉ : Utiliser getUser() directement
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const cacheKey = `conversations-${userId}`
    
    // Vérifier le cache d'abord
    const cached = conversationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ count: cached.count })
    }

    // Utiliser service role pour éviter les problèmes RLS
    const serviceSupabase = await createClient(true)

    try {
      // Timeout plus court (2s) pour éviter les blocages
      const participantPromise = serviceSupabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 2000)
      )

      const { data: participantData, error: participantError } = await Promise.race([
        participantPromise, 
        timeoutPromise
      ])

      if (participantError) {
        if (participantError.code === '42P01' || participantError.message?.includes('does not exist')) {
          console.log('Conversations table not set up yet, returning 0 count')
          const result = { count: 0 }
          conversationCache.set(cacheKey, { count: 0, timestamp: Date.now() })
          return NextResponse.json(result)
        }
        throw participantError
      }

      if (!participantData || participantData.length === 0) {
        const result = { count: 0 }
        conversationCache.set(cacheKey, { count: 0, timestamp: Date.now() })
        return NextResponse.json(result)
      }

      const conversationIds = participantData.map(p => p.conversation_id)

      // Get user's last_read_at timestamps for each conversation
      const { data: participantsWithRead, error: readError } = await serviceSupabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)
        .in('conversation_id', conversationIds)

      if (readError) {
        console.error('Error fetching read timestamps:', readError)
        const result = { count: 0 }
        conversationCache.set(cacheKey, { count: 0, timestamp: Date.now() })
        return NextResponse.json(result)
      }

      // Count unread messages (messages sent after user's last_read_at)
      let totalUnread = 0

      for (const participant of participantsWithRead || []) {
        const lastReadAt = participant.last_read_at || new Date(0).toISOString() // If never read, use epoch

        const { count, error: countError } = await serviceSupabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', participant.conversation_id)
          .neq('sender_id', userId)
          .gt('created_at', lastReadAt)

        if (!countError && count) {
          totalUnread += count
        }
      }

      // Cache le résultat
      conversationCache.set(cacheKey, { count: totalUnread, timestamp: Date.now() })
      
      return NextResponse.json({ count: totalUnread })
    } catch (queryError: any) {
      if (queryError.message === 'Query timeout') {
        console.log('Conversation query timed out, returning cached or 0')
        const fallbackCount = cached?.count || 0
        return NextResponse.json({ count: fallbackCount })
      }
      
      if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
        console.log('Conversations system not available, returning 0 count')
        conversationCache.set(cacheKey, { count: 0, timestamp: Date.now() })
        return NextResponse.json({ count: 0 })
      }
      throw queryError
    }
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ count: 0 })
  }
}