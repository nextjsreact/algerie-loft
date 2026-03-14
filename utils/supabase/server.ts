import '@/lib/suppress-auth-errors';
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/lib/types'

export const createClient = async (useServiceRole?: boolean) => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and API key are required')
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll called from a Server Component — safe to ignore
        }
      },
    },
    auth: {
      persistSession: !useServiceRole,
      debug: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  })
}

// Read-only client — does not attempt to write cookies (safe in layouts/Server Components)
export const createReadOnlyClient = async (useServiceRole?: boolean) => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and API key are required')
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // no-op — read-only context
      },
    },
    auth: {
      persistSession: false,
      debug: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  })
}
