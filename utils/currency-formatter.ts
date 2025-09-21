/**
 * Global Currency Formatting Utility
 * Handles multiple currencies with locale-aware formatting
 */

export interface CurrencyInfo {
  code: string
  name: string
  symbol: {
    ar: string    // Arabic
    fr: string    // French
    en: string    // English
  }
  locale: {
    ar: string    // Arabic locale (ar-DZ)
    fr: string    // French locale (fr-DZ)
    en: string    // English locale (en-US)
  }
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  DZD: {
    code: 'DZD',
    name: 'Algerian Dinar',
    symbol: {
      ar: 'دج',
      fr: 'DA',
      en: 'DZD'
    },
    locale: {
      ar: 'ar-DZ',
      fr: 'fr-DZ',
      en: 'en-US'
    }
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: {
      ar: '€',
      fr: '€',
      en: '€'
    },
    locale: {
      ar: 'ar-DZ',  // Algeria uses EUR in some contexts
      fr: 'fr-FR',
      en: 'en-US'
    }
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: {
      ar: '$',
      fr: '$',
      en: '$'
    },
    locale: {
      ar: 'ar-DZ',
      fr: 'fr-DZ',
      en: 'en-US'
    }
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: {
      ar: '£',
      fr: '£',
      en: '£'
    },
    locale: {
      ar: 'ar-DZ',
      fr: 'fr-GB',
      en: 'en-GB'
    }
  }
}

export type SupportedCurrency = keyof typeof CURRENCIES
export type SupportedLocale = 'ar' | 'fr' | 'en'

/**
 * Get currency symbol based on locale
 */
export function getCurrencySymbol(currencyCode: SupportedCurrency, locale: SupportedLocale): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) {
    console.warn(`Currency ${currencyCode} not found, using fallback`)
    return currencyCode
  }
  return currency.symbol[locale] || currency.symbol.en
}

/**
 * Get locale code for Intl.NumberFormat
 */
export function getLocaleCode(currencyCode: SupportedCurrency, locale: SupportedLocale): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) {
    console.warn(`Currency ${currencyCode} not found, using fallback`)
    return 'en-US'
  }
  return currency.locale[locale] || currency.locale.en
}

/**
 * Format currency amount with locale-aware symbol and formatting
 */
export function formatCurrency(
  amount: number,
  currencyCode: SupportedCurrency = 'DZD',
  locale: SupportedLocale = 'en'
): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) {
    console.warn(`Currency ${currencyCode} not found, using DZD as fallback`)
    return formatCurrency(amount, 'DZD', locale)
  }

  const localeCode = getLocaleCode(currencyCode, locale)
  const symbol = getCurrencySymbol(currencyCode, locale)

  // Debug logging
  console.log('formatCurrency Debug:', {
    amount,
    currencyCode,
    locale,
    localeCode,
    symbol,
    currencyInfo: currency
  })

  try {
    // Try with the specific currency first
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (error) {
    console.warn(`Intl.NumberFormat failed for ${localeCode} with currency ${currencyCode}, trying fallback`, error)

    // Fallback 1: Try with a more generic locale
    try {
      const fallbackLocale = locale === 'ar' ? 'ar' : locale === 'fr' ? 'fr-FR' : 'en-US'
      return new Intl.NumberFormat(fallbackLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch (error2) {
      console.warn(`Fallback Intl.NumberFormat also failed, using manual formatting`, error2)

      // Fallback 2: Manual formatting with proper locale number formatting
      const formattedNumber = new Intl.NumberFormat(localeCode, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)

      // For Arabic, we want the symbol before the number with proper RTL formatting
      if (locale === 'ar') {
        return `${symbol} ${formattedNumber}`
      } else {
        return `${formattedNumber} ${symbol}`
      }
    }
  }
}

/**
 * Format currency for display in UI components
 * Automatically detects locale from pathname
 */
export function formatCurrencyAuto(
  amount: number,
  currencyCode: SupportedCurrency = 'DZD',
  pathname: string = ''
): string {
  // Extract locale from pathname (e.g., /ar/dashboard -> 'ar')
  const pathLocale = pathname.split('/')[1] || 'en'
  const locale: SupportedLocale = (pathLocale === 'ar' || pathLocale === 'fr' || pathLocale === 'en')
    ? pathLocale
    : 'en'

  return formatCurrency(amount, currencyCode, locale)
}

/**
 * Get currency display name
 */
export function getCurrencyName(currencyCode: SupportedCurrency, locale: SupportedLocale = 'en'): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) return currencyCode

  // For now, return English name - can be extended for localization
  return currency.name
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currencyCode: string): currencyCode is SupportedCurrency {
  return currencyCode in CURRENCIES
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES)
}