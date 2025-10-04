import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service pour gérer le contexte d'audit
 * Permet de définir l'utilisateur actuel pour les opérations d'audit
 */
export class AuditContextService {
  /**
   * Définir le contexte d'audit pour l'utilisateur actuel
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   * @param ipAddress - Adresse IP (optionnel)
   * @param userAgent - User agent (optionnel)
   * @param sessionId - ID de session (optionnel)
   */
  static async setAuditContext(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Utiliser la version simple que nous avons déployée
      const { error } = await supabase.rpc('set_audit_context', {
        user_id: userId,
        user_email: userEmail
      })

      if (error) {
        logger.error('Failed to set audit context', error)
        throw new Error(`Failed to set audit context: ${error.message}`)
      }

      logger.debug('Audit context set successfully', { 
        userId, 
        userEmail
      })
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
      
      const { error } = await supabase.rpc('clear_audit_context')

      if (error) {
        logger.error('Failed to clear audit context', error)
        throw new Error(`Failed to clear audit context: ${error.message}`)
      }

      logger.debug('Audit context cleared successfully')
    } catch (error) {
      logger.error('Error clearing audit context', error)
      throw error
    }
  }

  /**
   * Exécuter une opération avec contexte d'audit
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   * @param operation - Fonction à exécuter avec le contexte
   * @param ipAddress - Adresse IP (optionnel)
   * @param userAgent - User agent (optionnel)
   * @param sessionId - ID de session (optionnel)
   */
  static async withAuditContext<T>(
    userId: string,
    userEmail: string,
    operation: () => Promise<T>,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<T> {
    try {
      // Définir le contexte
      await this.setAuditContext(userId, userEmail, ipAddress, userAgent, sessionId)
      
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