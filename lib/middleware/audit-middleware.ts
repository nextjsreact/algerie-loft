import { NextRequest } from 'next/server'
import { AuditContextService } from '@/lib/services/audit-context-service'
import { logger } from '@/lib/logger'

/**
 * Middleware pour définir automatiquement le contexte d'audit
 */
export class AuditMiddleware {
  /**
   * Définir le contexte d'audit à partir de la session utilisateur
   * @param request - Requête Next.js
   * @param session - Session utilisateur
   */
  static async setContextFromSession(
    request: NextRequest,
    session: { user: { id: string; email: string } }
  ): Promise<void> {
    try {
      const ipAddress = this.getClientIP(request)
      const userAgent = request.headers.get('user-agent') || undefined
      const sessionId = this.generateSessionId(session.user.id)

      await AuditContextService.setAuditContext(
        session.user.id,
        session.user.email,
        ipAddress,
        userAgent,
        sessionId
      )

      logger.debug('Audit context set from session', {
        userId: session.user.id,
        userEmail: session.user.email,
        ipAddress,
        userAgent: userAgent?.substring(0, 100) // Tronquer pour les logs
      })
    } catch (error) {
      logger.warn('Failed to set audit context from session', error)
      // Ne pas faire échouer la requête si l'audit échoue
    }
  }

  /**
   * Extraire l'adresse IP du client
   * @param request - Requête Next.js
   * @returns Adresse IP du client
   */
  private static getClientIP(request: NextRequest): string | undefined {
    // Essayer différents headers pour obtenir l'IP réelle
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
      return cfConnectingIP
    }

    // Fallback vers l'IP de la connexion
    return request.ip || undefined
  }

  /**
   * Générer un ID de session unique
   * @param userId - ID de l'utilisateur
   * @returns ID de session
   */
  private static generateSessionId(userId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `${userId.substring(0, 8)}-${timestamp}-${random}`
  }

  /**
   * Wrapper pour exécuter une action avec contexte d'audit automatique
   * @param request - Requête Next.js
   * @param session - Session utilisateur
   * @param action - Action à exécuter
   */
  static async withAutoAuditContext<T>(
    request: NextRequest,
    session: { user: { id: string; email: string } },
    action: () => Promise<T>
  ): Promise<T> {
    try {
      await this.setContextFromSession(request, session)
      return await action()
    } finally {
      try {
        await AuditContextService.clearAuditContext()
      } catch (error) {
        logger.warn('Failed to clear audit context in middleware', error)
      }
    }
  }
}