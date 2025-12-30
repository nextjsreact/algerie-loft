import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!\n\nCheck your Supabase project\'s API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api')
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          // Gestion sécurisée des cookies
          if (typeof document === 'undefined') return undefined
          try {
            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1]
            return value ? decodeURIComponent(value) : undefined
          } catch (error) {
            console.warn(`Cookie read error for ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          // Gestion sécurisée de l'écriture des cookies
          if (typeof document === 'undefined') return
          try {
            let cookie = `${name}=${encodeURIComponent(value)}`
            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
            if (options?.path) cookie += `; path=${options.path}`
            if (options?.domain) cookie += `; domain=${options.domain}`
            if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
            if (options?.secure) cookie += '; secure'
            document.cookie = cookie
          } catch (error) {
            console.warn(`Cookie write error for ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          // Suppression sécurisée des cookies
          if (typeof document === 'undefined') return
          try {
            this.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            console.warn(`Cookie remove error for ${name}:`, error)
          }
        }
      }
    }
  )
}