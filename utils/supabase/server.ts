import '@/lib/suppress-auth-errors';
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
          // Vérifier si nous sommes dans un contexte où on peut modifier les cookies
          if (process.env.NODE_ENV === 'development') {
            // En développement, essayer de définir les cookies mais ignorer les erreurs
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch (cookieError) {
                // Ignorer silencieusement les erreurs de cookies en développement
              }
            });
          }
        } catch (error) {
          // Ignorer complètement les erreurs de cookies
        }
      },
    },
    auth: {
      ...(useServiceRole ? { persistSession: false } : {}),
      debug: false,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!\n\nCheck your Supabase project\'s API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    options
  )
}

// Client read-only optimisé
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
        // No-op pour les contextes read-only
      },
    },
    auth: {
      ...(useServiceRole ? { persistSession: false } : {}),
      debug: false,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    options
  )
}