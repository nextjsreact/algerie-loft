import { createServerClient } from '@supabase/ssr'
import { Database } from '@/lib/types'
import { createClient as createBrowserClient } from './client'

export const createClient = async (useServiceRole?: boolean) => {
  if (typeof window !== 'undefined') {
    return createBrowserClient();
  }

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const options: any = {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: object }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch (error) {
          // Ignore cookie setting errors in read-only contexts (like layouts)
          // This is expected behavior in Next.js 15 for layouts and other read-only contexts
          if (process.env.NODE_ENV === 'development') {
            console.warn('Cookie setting ignored in read-only context:', error);
          }
        }
      },
    },
  };

  if (useServiceRole) {
    options.auth = {
      persistSession: false,
    };
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}

// Read-only client for layouts and other contexts where cookies cannot be set
export const createReadOnlyClient = async (useServiceRole?: boolean) => {
  if (typeof window !== 'undefined') {
    return createBrowserClient();
  }

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const options: any = {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // No-op for read-only contexts
      },
    },
  };

  if (useServiceRole) {
    options.auth = {
      persistSession: false,
    };
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}
