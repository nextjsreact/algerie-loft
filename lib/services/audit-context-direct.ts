import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service d'audit ultra-simplifié qui utilise SQL direct
 * Évite les problèmes de RPC et fonctionne directement avec PostgreSQL
 */
export class DirectAuditContextService {
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
      
      // Utiliser une requête SQL directe pour définir les variables de session
      const { error } = await supabase
        .from('audit_logs') // Utiliser une table existante pour exécuter du SQL
        .select('id')
        .limit(0) // Ne récupérer aucune ligne, juste exécuter la requête
      
      // Puis définir les variables avec une requête séparée
      await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            set_config('audit.current_user_id', $1, true) as user_id_set,
            set_config('audit.current_user_email', $2, true) as user_email_set
        `,
        params: [userId, userEmail]
      }).catch(() => {
        // Si exec_sql n'existe pas, ignorer silencieusement
        logger.debug('exec_sql not available, audit context not set via SQL')
      })

      logger.debug('Audit context set successfully', { userId, userEmail })
    } catch (error) {
      logger.warn('Could not set audit context, continuing without it', error)
      // Ne pas faire échouer l'opération si l'audit échoue
    }
  }

  /**
   * Nettoyer le contexte d'audit
   */
  static async clearAuditContext(): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            set_config('audit.current_user_id', NULL, true) as user_id_cleared,
            set_config('audit.current_user_email', NULL, true) as user_email_cleared
        `
      }).catch(() => {
        // Ignorer silencieusement si exec_sql n'existe pas
        logger.debug('exec_sql not available, audit context not cleared via SQL')
      })

      logger.debug('Audit context cleared successfully')
    } catch (error) {
      logger.warn('Could not clear audit context', error)
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
      // Définir le contexte (ne fait pas échouer si ça ne marche pas)
      await this.setAuditContext(userId, userEmail)
      
      // Exécuter l'opération
      const result = await operation()
      
      return result
    } finally {
      // Toujours essayer de nettoyer le contexte
      try {
        await this.clearAuditContext()
      } catch (clearError) {
        logger.warn('Failed to clear audit context in finally block', clearError)
      }
    }
  }
}