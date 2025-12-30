import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service d'audit qui fonctionne vraiment
 * Version simplifiée qui utilise directement les fonctions RPC
 */
export class WorkingAuditContextService {
  /**
   * Définir le contexte d'audit avec la fonction RPC
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   */
  static async setAuditContext(
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Utiliser directement la fonction RPC que nous savons qui existe
      const { error } = await supabase.rpc('set_audit_context', {
        user_id: userId,
        user_email: userEmail
      })

      if (error) {
        logger.debug('RPC set_audit_context failed, continuing without context', error)
      } else {
        logger.debug('Audit context set successfully via RPC', { userId, userEmail })
      }

    } catch (error) {
      logger.debug('Error setting audit context, continuing without it', error)
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
        logger.debug('RPC clear_audit_context failed', error)
      } else {
        logger.debug('Audit context cleared successfully via RPC')
      }

    } catch (error) {
      logger.debug('Error clearing audit context', error)
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