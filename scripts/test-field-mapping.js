// Test simple pour vérifier le mapping des champs
console.log('=== Test Field Display Names ===')

// Simuler les fonctions
const FIELD_DISPLAY_NAMES = {
  transactions: {
    amount: 'Montant',
    transaction_type: 'Type de transaction',
    status: 'Statut',
    description: 'Description',
    date: 'Date',
    category: 'Catégorie',
    loft_id: 'Loft',
    currency_id: 'Devise',
    payment_method_id: 'Méthode de paiement',
    ratio_at_transaction: 'Taux de change',
    equivalent_amount_default_currency: 'Montant équivalent (devise par défaut)'
  }
}

function getFieldDisplayName(tableName, fieldName) {
  const tableFields = FIELD_DISPLAY_NAMES[tableName]
  if (!tableFields) {
    return fieldName
  }
  return tableFields[fieldName] || fieldName
}

function formatAuditValue(tableName, fieldName, value) {
  if (!value) return 'Vide'

  // Mapping des devises
  if (fieldName === 'currency_id') {
    const currencies = {
      '85044985-53f4-4bf6-83d6-d1518f2ee715': 'EUR',
      'a0e57cd8-d74e-4a2d-8bfa-a94c5b4c0c7c': 'USD',
      '0fa82c9a-6e85-4ba3-ae71-cf438466df7b': 'GBP',
      '0a0e115f-a798-4d67-b82e-6e375ddf04da': 'CAD'
    }
    return currencies[value] || `Devise: ${value.substring(0, 8)}...`
  }

  if (fieldName === 'payment_method_id') {
    const paymentMethods = {
      '993465f2-b191-40ee-bd1e-c8567aa2531b': 'Carte bancaire',
      '251170fd-1729-4779-b2d0-0f70213bce9e': 'Virement bancaire',
      '9b8dad46-a14d-4460-8bf6-68ad8c7057b8': 'Espèces'
    }
    return paymentMethods[value] || `Paiement: ${value.substring(0, 8)}...`
  }

  if (fieldName === 'loft_id') {
    return `Loft: ${value.substring(0, 8)}...`
  }

  if (fieldName === 'status') {
    const statusLabels = {
      pending: 'En attente',
      completed: 'Terminé',
      failed: 'Échoué',
      cancelled: 'Annulé'
    }
    return statusLabels[value] || value
  }

  return value
}

// Tests
console.log('Field name mapping:')
console.log('loft_id ->', getFieldDisplayName('transactions', 'loft_id'))
console.log('currency_id ->', getFieldDisplayName('transactions', 'currency_id'))
console.log('payment_method_id ->', getFieldDisplayName('transactions', 'payment_method_id'))

console.log('\nValue formatting:')
console.log('currency_id: 0a0e115f-a798-4d67-b82e-6e375ddf04da ->', formatAuditValue('transactions', 'currency_id', '0a0e115f-a798-4d67-b82e-6e375ddf04da'))
console.log('payment_method_id: 993465f2-b191-40ee-bd1e-c8567aa2531b ->', formatAuditValue('transactions', 'payment_method_id', '993465f2-b191-40ee-bd1e-c8567aa2531b'))
console.log('status: pending ->', formatAuditValue('transactions', 'status', 'pending'))

console.log('\n=== Test Complete ===')