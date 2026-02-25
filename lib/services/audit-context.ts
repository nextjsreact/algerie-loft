import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Service pour gérer le contexte d'audit
 * Utilise les fonctions RPC définies dans la base de données
 */
export class AuditContext {
  /**
   * Définir le contexte d'audit pour l'utilisateur actuel
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   */
  static async set(
    userId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Appeler la fonction RPC set_audit_user_context
      const { error } = await supabase.rpc('set_audit_user_context', {
        p_user_id: userId,
        p_user_email: userEmail
      })

      if (error) {
        logger.warn('Failed to set audit context', { error, userId })
        // Ne pas faire échouer l'opération si l'audit échoue
      } else {
        logger.debug('Audit context set', { userId, userEmail })
      }
    } catch (error) {
      logger.warn('Could not set audit context', { error, userId })
      // Ne pas faire échouer l'opération si l'audit échoue
    }
  }

  /**
   * Nettoyer le contexte d'audit
   */
  static async clear(): Promise<void> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase.rpc('clear_audit_user_context')

      if (error) {
        logger.warn('Failed to clear audit context', { error })
      } else {
        logger.debug('Audit context cleared')
      }
    } catch (error) {
      logger.warn('Could not clear audit context', { error })
    }
  }

  /**
   * Exécuter une opération avec contexte d'audit
   * @param userId - ID de l'utilisateur
   * @param userEmail - Email de l'utilisateur
   * @param operation - Fonction à exécuter avec le contexte
   */
  static async with<T>(
    userId: string,
    userEmail: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      // Définir le contexte
      await this.set(userId, userEmail)
      
      // Exécuter l'opération
      const result = await operation()
      
      return result
    } finally {
      // Toujours nettoyer le contexte
      await this.clear()
    }
  }
}
