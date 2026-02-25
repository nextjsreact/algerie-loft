import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Crée un client Supabase avec contexte d'audit automatique
 * Définit automatiquement l'utilisateur actuel pour les logs d'audit
 */
export async function createClientWithAudit() {
  const supabase = await createSupabaseClient()
  
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Définir le contexte d'audit
      const { error } = await supabase.rpc('set_audit_user_context', {
        p_user_id: user.id,
        p_user_email: user.email || 'unknown@email.com'
      })
      
      if (error) {
        logger.warn('Failed to set audit context', { error, userId: user.id })
      } else {
        logger.debug('Audit context set automatically', { userId: user.id })
      }
    }
  } catch (error) {
    logger.warn('Could not set audit context', { error })
    // Ne pas faire échouer si l'audit échoue
  }
  
  return supabase
}
