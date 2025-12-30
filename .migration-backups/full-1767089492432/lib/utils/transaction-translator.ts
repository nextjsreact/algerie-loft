import { Language } from '@/lib/i18n/translations'

/**
 * Fonction utilitaire pour traduire automatiquement les descriptions de transactions
 * et les statuts en fonction de la langue sélectionnée
 */

export function translateTransactionDescription(description: string, language: Language): string {
  // Pour l'instant, retourner la description originale
  return description
}

export function translateTransactionStatus(status: string, language: Language): string {
  // Pour l'instant, retourner le statut original
  return status
}

export function translateTransactionType(type: string, language: Language): string {
  // Pour l'instant, retourner le type original
  return type
}

export function translatePaymentMethod(method: string, language: Language): string {
  // Ajouter des traductions pour les méthodes de paiement courantes
  const paymentMethods: Record<string, Record<Language, string>> = {
    'cash': {
      en: 'Cash',
      fr: 'Espèces',
      ar: 'نقداً'
    },
    'card': {
      en: 'Card',
      fr: 'Carte',
      ar: 'بطاقة'
    },
    'bank_transfer': {
      en: 'Bank Transfer',
      fr: 'Virement Bancaire',
      ar: 'تحويل بنكي'
    },
    'check': {
      en: 'Check',
      fr: 'Chèque',
      ar: 'شيك'
    }
  }
  
  const methodKey = method.toLowerCase().replace(' ', '_')
  return paymentMethods[methodKey]?.[language] || method
}

export function translateCurrency(currency: string, language: Language): string {
  const currencies: Record<string, Record<Language, string>> = {
    'DA': {
      en: 'DA',
      fr: 'DA',
      ar: 'دج'
    },
    'DZD': {
      en: 'DZD',
      fr: 'DZD',
      ar: 'دينار جزائري'
    },
    'EUR': {
      en: 'EUR',
      fr: 'EUR',
      ar: 'يورو'
    },
    'USD': {
      en: 'USD',
      fr: 'USD',
      ar: 'دولار'
    }
  }
  
  return currencies[currency.toUpperCase()]?.[language] || currency
}