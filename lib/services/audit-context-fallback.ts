import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service d'audit de fallback qui fonctionne même sans RPC
 * Utilise une approche de fallback gracieux
 */
export class FallbackAuditContextService {
  /**
   * Essayer de définir le contexte d'audit, mais ne pas échouer si ça ne marche pas
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   */
  static async setAuditContext(
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Essayer d'abord la fonction RPC si elle existe
      try {
        const { error } = await supabase.rpc('set_audit_context', {
          user_id: userId,
          user_email: userEmail
        })
        
        if (!error) {
          logger.debug('Audit context set via RPC', { userId, userEmail })
          return
        }
      } catch (rpcError) {
        logger.debug('RPC set_audit_context not available, trying alternative')
      }

      // Si RPC ne marche pas, essayer exec_sql
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `SELECT set_config('audit.current_user_id', '${userId}', true), set_config('audit.current_user_email', '${userEmail}', true)`
        })
        
        if (!error) {
          logger.debug('Audit context set via exec_sql', { userId, userEmail })
          return
        }
      } catch (sqlError) {
        logger.debug('exec_sql not available either')
      }

      // Si rien ne marche, juste logger et continuer
      logger.debug('Could not set audit context, continuing without it', { userId, userEmail })
      
    } catch (error) {
      logger.warn('Error setting audit context, continuing without it', error)
    }
  }

  /**
   * Essayer de nettoyer le contexte d'audit
   */
  static async clearAuditContext(): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Essayer d'abord la fonction RPC
      try {
        await supabase.rpc('clear_audit_context')
        logger.debug('Audit context cleared via RPC')
        return
      } catch (rpcError) {
        logger.debug('RPC clear_audit_context not available')
      }

      // Essayer exec_sql
      try {
        await supabase.rpc('exec_sql', {
          sql: `SELECT set_config('audit.current_user_id', NULL, true), set_config('audit.current_user_email', NULL, true)`
        })
        logger.debug('Audit context cleared via exec_sql')
        return
      } catch (sqlError) {
        logger.debug('exec_sql not available for clearing')
      }

    } catch (error) {
      logger.warn('Error clearing audit context', error)
    }
  }

  /**
   * Exécuter une opération avec contexte d'audit (avec fallback gracieux)
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   * @param operation - Fonction à exécuter avec le contexte
   */
  static async withAuditContext<T>(
    userId: string,
    userEmail: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Essayer de définir le contexte (ne fait jamais échouer)
    await this.setAuditContext(userId, userEmail)
    
    try {
      // Exécuter l'opération
      const result = await operation()
      return result
    } finally {
      // Essayer de nettoyer le contexte (ne fait jamais échouer)
      await this.clearAuditContext()
    }
  }
}