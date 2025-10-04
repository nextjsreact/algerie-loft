import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service simplifié pour gérer le contexte d'audit
 * Version qui fonctionne avec les fonctions déployées
 */
export class SimpleAuditContextService {
  /**
   * Définir le contexte d'audit de manière simple
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   */
  static async setAuditContext(
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Utiliser une requête SQL directe pour définir les variables de session
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            set_config('audit.current_user_id', '${userId}', true),
            set_config('audit.current_user_email', '${userEmail}', true);
        `
      })

      if (error) {
        // Si exec_sql n'existe pas, essayer la fonction audit.set_audit_context
        const { error: rpcError } = await supabase.rpc('set_audit_context', {
          user_id: userId,
          user_email: userEmail
        })
        
        if (rpcError) {
          logger.error('Failed to set audit context', rpcError)
          throw new Error(`Failed to set audit context: ${rpcError.message}`)
        }
      }

      logger.debug('Audit context set successfully', { userId, userEmail })
    } catch (error) {
      logger.error('Error setting audit context', error)
      throw error
    }
  }

  /**
   * Nettoyer le contexte d'audit
   */
  static async clearAuditContext(): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Essayer la fonction RPC d'abord
      const { error } = await supabase.rpc('clear_audit_context')

      if (error) {
        // Si la fonction RPC n'existe pas, utiliser SQL direct
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT 
              set_config('audit.current_user_id', NULL, true),
              set_config('audit.current_user_email', NULL, true);
          `
        })
        
        if (sqlError) {
          logger.warn('Failed to clear audit context', sqlError)
          // Ne pas faire échouer si le nettoyage échoue
        }
      }

      logger.debug('Audit context cleared successfully')
    } catch (error) {
      logger.warn('Error clearing audit context', error)
      // Ne pas faire échouer si le nettoyage échoue
    }
  }

  /**
   * Exécuter une opération avec contexte d'audit
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   * @param operation - Fonction à exécuter avec le contexte
   */
  static async withAuditContext<T>(
    userId: string,
    userEmail: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      // Définir le contexte
      await this.setAuditContext(userId, userEmail)
      
      // Exécuter l'opération
      const result = await operation()
      
      return result
    } finally {
      // Toujours nettoyer le contexte, même en cas d'erreur
      try {
        await this.clearAuditContext()
      } catch (clearError) {
        logger.warn('Failed to clear audit context in finally block', clearError)
      }
    }
  }
}