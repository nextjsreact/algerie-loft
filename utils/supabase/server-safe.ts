import { createServerClient } from '@supabase/ssr'
import { Database } from '@/lib/types'

// Safe server client that doesn't use cookies for build-time operations
export const createSafeClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for build-time
        },
      },
    }
  )
}