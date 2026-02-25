import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Crée un client Supabase standard
 * Les triggers d'audit utilisent automatiquement auth.uid() pour capturer l'utilisateur
 * Pas besoin de définir le contexte manuellement
 */
export async function createClientWithAudit() {
  const supabase = await createSupabaseClient()
  logger.debug('Supabase client created - audit triggers will use auth.uid() automatically')
  return supabase
}
