import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  // Return mock client if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            limit: (count: number) => Promise.resolve({ data: [], error: null })
          }),
          limit: (count: number) => Promise.resolve({ data: [], error: null })
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ 
              data: { id: `mock-${Date.now()}`, ...data }, 
              error: null 
            })
          })
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
        })
      }),
      rpc: (fn: string, params?: any) => Promise.resolve({ data: true, error: null })
    } as any;
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}