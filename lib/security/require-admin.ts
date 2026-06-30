import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function requireAdmin(request: NextRequest): Promise<{
  valid: boolean
  userId?: string
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing token' }
    }

    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return { valid: false, error: 'Invalid token' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'superuser'].includes(profile.role)) {
      return { valid: false, error: 'Admin access required' }
    }

    return { valid: true, userId: user.id }
  } catch {
    return { valid: false, error: 'Auth check failed' }
  }
}
