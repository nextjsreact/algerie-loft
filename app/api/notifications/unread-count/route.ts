import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

// Simple in-memory cache for notification counts
const notificationCache = new Map<string, { count: number, timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    // SÉCURISÉ : Utiliser getUser() directement
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const cacheKey = `notifications-${userId}`
    
    // Check cache first
    const cached = notificationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ count: cached.count })
    }

    try {
      // Quick count query with shorter timeout (1.5s)
      const countPromise = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 1500)
      )

      const { count, error } = await Promise.race([countPromise, timeoutPromise])

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Notifications table not set up yet, returning 0 count')
          const result = { count: 0 }
          notificationCache.set(cacheKey, { count: 0, timestamp: Date.now() })
          return NextResponse.json(result)
        }
        throw error
      }

      const finalCount = count || 0
      
      // Cache the result
      notificationCache.set(cacheKey, { count: finalCount, timestamp: Date.now() })
      
      return NextResponse.json({ count: finalCount })
    } catch (notificationError: any) {
      if (notificationError.message === 'Query timeout') {
        console.log('Notification query timed out, returning cached or 0')
        const fallbackCount = cached?.count || 0
        return NextResponse.json({ count: fallbackCount })
      }
      
      if (notificationError.code === '42P01' || notificationError.message?.includes('does not exist')) {
        console.log('Notifications system not available, returning 0 count')
        notificationCache.set(cacheKey, { count: 0, timestamp: Date.now() })
        return NextResponse.json({ count: 0 })
      }
      throw notificationError
    }
  } catch (error: any) {
    console.error('API Error fetching notification count:', error)
    return NextResponse.json({ count: 0 }) // Graceful fallback
  }
}
