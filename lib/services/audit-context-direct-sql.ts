import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service d'audit qui utilise SQL direct pour définir le contexte
 * Évite complètement les RPC et fonctionne directement
 */
export class DirectSQLAuditContextService {
  /**
   * Définir le contexte d'audit avec SQL direct
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   */
  static async setAuditContext(
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Utiliser rpc avec paramètres liés pour éviter l'injection SQL
      const { error } = await supabase.rpc('set_audit_context', {
        user_id: userId,
        user_email: userEmail
      })

      if (error) {
        logger.debug('Could not set audit context via direct SQL', error)
      } else {
        logger.debug('Audit context set via direct SQL', { userId, userEmail })
      }

    } catch (error) {
      logger.debug('Error setting audit context via direct SQL', error)
    }
  }

  /**
   * Nettoyer le contexte d'audit
   */
  static async clearAuditContext(): Promise<void> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          (SELECT set_config('audit.current_user_id', NULL, true)) as user_id_cleared,
          (SELECT set_config('audit.current_user_email', NULL, true)) as user_email_cleared
        `)
        .limit(1)

      if (error) {
        logger.debug('Could not clear audit context via direct SQL', error)
      } else {
        logger.debug('Audit context cleared via direct SQL')
      }

    } catch (error) {
      logger.debug('Error clearing audit context via direct SQL', error)
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
    // Définir le contexte
    await this.setAuditContext(userId, userEmail)
    
    try {
      // Exécuter l'opération
      const result = await operation()
      return result
    } finally {
      // Nettoyer le contexte
      await this.clearAuditContext()
    }
  }
}