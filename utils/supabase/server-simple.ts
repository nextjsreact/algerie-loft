import { createClient as createSupabaseClient } from '@/utils/supabase/server'

/**
 * Version simplifiée - les triggers devraient fonctionner automatiquement
 * sans avoir besoin de définir le contexte utilisateur manuellement
 */
export async function createClientSimple() {
  return await createSupabaseClient()
}
