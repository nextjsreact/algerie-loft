// Résolution des valeurs d'audit pour afficher des noms lisibles au lieu des IDs

/**
 * Résout les valeurs d'audit pour afficher des noms lisibles
 */
export async function resolveAuditValues(
  tableName: string, 
  fieldName: string, 
  value: string | null
): Promise<string | null> {
  if (!value) return value

  // Relations à résoudre
  const relationResolvers: Record<string, Record<string, (id: string) => Promise<string | null>>> = {
    transactions: {
      loft_id: async (id: string) => {
        // Ici vous pouvez faire un appel à votre API ou base de données
        // Pour l'instant, on retourne l'ID avec un préfixe
        return `Loft: ${id.substring(0, 8)}...`
      },
      currency_id: async (id: string) => {
        // Mapping des devises courantes (vous pouvez étendre ceci)
        const currencies: Record<string, string> = {
          '85044985-53f4-4bf6-83d6-d1518f2ee715': 'EUR',
          'a0e57cd8-d74e-4a2d-8bfa-a94c5b4c0c7c': 'USD',
          '0fa82c9a-6e85-4ba3-ae71-cf438466df7b': 'GBP',
          '0a0e115f-a798-4d67-b82e-6e375ddf04da': 'CAD'
        }
        return currencies[id] || `Devise: ${id.substring(0, 8)}...`
      },
      payment_method_id: async (id: string) => {
        // Mapping des méthodes de paiement courantes
        const paymentMethods: Record<string, string> = {
          '993465f2-b191-40ee-bd1e-c8567aa2531b': 'Carte bancaire',
          '251170fd-1729-4779-b2d0-0f70213bce9e': 'Virement bancaire',
          '9b8dad46-a14d-4460-8bf6-68ad8c7057b8': 'Espèces'
        }
        return paymentMethods[id] || `Paiement: ${id.substring(0, 8)}...`
      }
    },
    
    tasks: {
      loft_id: async (id: string) => `Loft: ${id.substring(0, 8)}...`,
      assigned_to: async (id: string) => `Utilisateur: ${id.substring(0, 8)}...`,
      created_by: async (id: string) => `Utilisateur: ${id.substring(0, 8)}...`
    },
    
    reservations: {
      loft_id: async (id: string) => `Loft: ${id.substring(0, 8)}...`
    }
  }

  const tableResolvers = relationResolvers[tableName]
  if (!tableResolvers) return value

  const resolver = tableResolvers[fieldName]
  if (!resolver) return value

  try {
    return await resolver(value)
  } catch (error) {
    console.error(`Error resolving ${tableName}.${fieldName}:`, error)
    return value // Retourne la valeur originale en cas d'erreur
  }
}

/**
 * Formate une valeur pour l'affichage dans l'audit
 */
export function formatAuditValue(
  tableName: string,
  fieldName: string,
  value: string | null,
  resolvedValue?: string | null
): string {
  if (!value) return 'Vide'

  // Utilise la valeur résolue si disponible
  if (resolvedValue && resolvedValue !== value) {
    return resolvedValue
  }

  // Formatage spécial pour certains types de champs
  if (fieldName.includes('date') || fieldName.includes('_at')) {
    try {
      const date = new Date(value)
      return date.toLocaleString('fr-FR')
    } catch {
      return value
    }
  }

  if (fieldName.includes('amount') || fieldName.includes('price')) {
    try {
      const num = parseFloat(value)
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(num / 100) // Assuming values are in cents
    } catch {
      return value
    }
  }

  if (fieldName === 'status') {
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Terminé',
      failed: 'Échoué',
      cancelled: 'Annulé',
      active: 'Actif',
      inactive: 'Inactif'
    }
    return statusLabels[value] || value
  }

  if (fieldName === 'transaction_type') {
    const typeLabels: Record<string, string> = {
      income: 'Recette',
      expense: 'Dépense',
      transfer: 'Virement'
    }
    return typeLabels[value] || value
  }

  return value
}