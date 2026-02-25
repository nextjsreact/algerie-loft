import { AuditContext } from '@/lib/services/audit-context'
import { createClient } from '@/utils/supabase/server'

/**
 * Helper pour exécuter des opérations avec contexte d'audit automatique
 * Récupère automatiquement l'utilisateur connecté et définit le contexte
 */
export async function withAudit<T>(
  operation: () => Promise<T>
): Promise<T> {
  const supabase = await createClient()
  
  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Si pas d'utilisateur, exécuter sans contexte d'audit
    return await operation()
  }
  
  // Exécuter avec contexte d'audit
  return await AuditContext.with(
    user.id,
    user.email || 'unknown@email.com',
    operation
  )
}
