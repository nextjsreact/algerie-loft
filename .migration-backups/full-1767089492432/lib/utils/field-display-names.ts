// Mapping des noms de champs techniques vers des noms lisibles
export const FIELD_DISPLAY_NAMES: Record<string, Record<string, string>> = {
  transactions: {
    // Champs de base
    amount: 'Montant',
    transaction_type: 'Type de transaction',
    status: 'Statut',
    description: 'Description',
    date: 'Date',
    category: 'Catégorie',
    
    // Relations (IDs)
    loft_id: 'Loft',
    currency_id: 'Devise',
    payment_method_id: 'Méthode de paiement',
    
    // Champs calculés
    ratio_at_transaction: 'Taux de change',
    equivalent_amount_default_currency: 'Montant équivalent (devise par défaut)',
    
    // Champs système
    created_at: 'Date de création',
    updated_at: 'Date de modification',
    id: 'Identifiant'
  },
  
  tasks: {
    title: 'Titre',
    description: 'Description',
    status: 'Statut',
    priority: 'Priorité',
    due_date: 'Date d\'échéance',
    assigned_to: 'Assigné à',
    created_by: 'Créé par',
    loft_id: 'Loft',
    created_at: 'Date de création',
    updated_at: 'Date de modification',
    id: 'Identifiant'
  },
  
  reservations: {
    start_date: 'Date de début',
    end_date: 'Date de fin',
    guest_count: 'Nombre d\'invités',
    total_amount: 'Montant total',
    status: 'Statut',
    guest_name: 'Nom de l\'invité',
    guest_email: 'Email de l\'invité',
    guest_phone: 'Téléphone de l\'invité',
    loft_id: 'Loft',
    created_at: 'Date de création',
    updated_at: 'Date de modification',
    id: 'Identifiant'
  },
  
  lofts: {
    name: 'Nom',
    description: 'Description',
    address: 'Adresse',
    city: 'Ville',
    country: 'Pays',
    price_per_night: 'Prix par nuit',
    max_guests: 'Nombre maximum d\'invités',
    amenities: 'Équipements',
    status: 'Statut',
    created_at: 'Date de création',
    updated_at: 'Date de modification',
    id: 'Identifiant'
  }
}

/**
 * Obtient le nom d'affichage d'un champ pour une table donnée
 */
export function getFieldDisplayName(tableName: string, fieldName: string): string {
  const tableFields = FIELD_DISPLAY_NAMES[tableName]
  if (!tableFields) {
    return fieldName // Retourne le nom original si la table n'est pas trouvée
  }
  
  return tableFields[fieldName] || fieldName // Retourne le nom original si le champ n'est pas trouvé
}

/**
 * Obtient tous les noms d'affichage pour une table donnée
 */
export function getTableFieldDisplayNames(tableName: string): Record<string, string> {
  return FIELD_DISPLAY_NAMES[tableName] || {}
}