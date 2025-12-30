import { Currency } from '@/lib/types'
import { currencyDisplayService } from '@/lib/services/currency-display'

/**
 * Utility functions for currency display and formatting
 */

/**
 * Currency symbol mappings for common currencies
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'DZD': 'DA',
  'EUR': '€',
  'USD': '$',
  'CAD': 'C$',
  'GBP': '£',
  'JPY': '¥',
  'CHF': 'CHF',
  'AUD': 'A$',
  'CNY': '¥',
  'INR': '₹'
}

/**
 * Get currency symbol with fallback to code
 */
export function getCurrencySymbol(currency: Currency | string): string {
  if (typeof currency === 'string') {
    return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency
  }
  return currency.symbol || CURRENCY_SYMBOLS[currency.code.toUpperCase()] || currency.code
}

/**
 * Check if a currency should display its symbol before the amount
 */
export function isSymbolPrefix(currencyCode: string): boolean {
  const prefixCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF']
  return prefixCurrencies.includes(currencyCode.toUpperCase())
}

/**
 * Format a number with proper locale-specific formatting
 */
export function formatNumber(
  amount: number,
  locale: string = 'fr-DZ',
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(amount)
  } catch (error) {
    // Fallback to basic formatting if locale is not supported
    return amount.toFixed(defaultOptions.maximumFractionDigits || 2)
  }
}

/**
 * Determine when to show conversion information
 */
export function shouldShowConversion(
  transactionCurrency: Currency,
  defaultCurrency: Currency
): boolean {
  return transactionCurrency.id !== defaultCurrency.id
}

/**
 * Create a visual indicator for converted amounts
 */
export function getConversionIndicator(
  showConversion: boolean,
  type: 'icon' | 'text' | 'symbol' = 'symbol'
): string {
  if (!showConversion) return ''
  
  switch (type) {
    case 'icon':
      return '🔄' // Conversion icon
    case 'text':
      return '(converted)'
    case 'symbol':
    default:
      return '≈' // Approximately equal symbol
  }
}

/**
 * Format amount with automatic currency symbol placement
 */
export function formatAmountWithSymbol(
  amount: number,
  currency: Currency,
  locale?: string
): string {
  const symbol = getCurrencySymbol(currency)
  const formattedAmount = formatNumber(amount, locale)
  
  if (isSymbolPrefix(currency.code)) {
    return `${symbol}${formattedAmount}`
  } else {
    return `${formattedAmount} ${symbol}`
  }
}

/**
 * Create a compact display for large amounts
 */
export function formatCompactAmount(
  amount: number,
  currency: Currency,
  locale?: string
): string {
  const symbol = getCurrencySymbol(currency)
  
  if (Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000
    return `${millions.toFixed(1)}M ${symbol}`
  } else if (Math.abs(amount) >= 1000) {
    const thousands = amount / 1000
    return `${thousands.toFixed(1)}K ${symbol}`
  }
  
  return formatAmountWithSymbol(amount, currency, locale)
}

/**
 * Format dual currency display (original + converted)
 */
export function formatDualCurrency(
  originalAmount: number,
  originalCurrency: Currency,
  convertedAmount: number,
  defaultCurrency: Currency,
  options: {
    showConversion?: boolean
    compact?: boolean
    locale?: string
  } = {}
): string {
  const { showConversion = true, compact = false, locale } = options
  
  const formatFn = compact ? formatCompactAmount : formatAmountWithSymbol
  const originalDisplay = formatFn(originalAmount, originalCurrency, locale)
  
  if (!showConversion || !shouldShowConversion(originalCurrency, defaultCurrency)) {
    return originalDisplay
  }
  
  const convertedDisplay = formatFn(convertedAmount, defaultCurrency, locale)
  const indicator = getConversionIndicator(true, 'symbol')
  
  return `${originalDisplay} ${indicator} ${convertedDisplay}`
}

/**
 * Get appropriate CSS classes for currency display
 */
export function getCurrencyDisplayClasses(
  isConverted: boolean,
  isNegative: boolean,
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const classes = ['currency-display']
  
  if (isConverted) {
    classes.push('currency-converted')
  }
  
  if (isNegative) {
    classes.push('currency-negative')
  } else {
    classes.push('currency-positive')
  }
  
  classes.push(`currency-${size}`)
  
  return classes.join(' ')
}

/**
 * Create accessibility label for currency amounts
 */
export function createCurrencyAriaLabel(
  amount: number,
  currency: Currency,
  isConverted: boolean = false
): string {
  const amountText = Math.abs(amount).toString()
  const currencyName = currency.name || currency.code
  const sign = amount < 0 ? 'negative' : 'positive'
  const conversionText = isConverted ? ' converted amount' : ''
  
  return `${sign} ${amountText} ${currencyName}${conversionText}`
}

/**
 * Validate currency display data
 */
export function validateCurrencyData(
  amount: number,
  currency: Currency
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof amount !== 'number' || !isFinite(amount)) {
    errors.push('Invalid amount: must be a finite number')
  }
  
  if (!currency) {
    errors.push('Currency is required')
  } else {
    if (!currency.code) {
      errors.push('Currency code is required')
    }
    if (!currency.symbol && !currency.code) {
      errors.push('Currency must have either symbol or code')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get locale-specific decimal separator
 */
export function getDecimalSeparator(locale: string = 'fr-DZ'): string {
  try {
    const formatted = new Intl.NumberFormat(locale).format(1.1)
    return formatted.charAt(1) // The character between 1 and 1
  } catch {
    return '.' // Fallback to dot
  }
}

/**
 * Get locale-specific thousands separator
 */
export function getThousandsSeparator(locale: string = 'fr-DZ'): string {
  try {
    const formatted = new Intl.NumberFormat(locale).format(1000)
    return formatted.charAt(1) // The character between 1 and 000
  } catch {
    return ',' // Fallback to comma
  }
}

/**
 * Parse amount string with locale-specific formatting
 */
export function parseLocalizedAmount(
  amountString: string,
  locale: string = 'fr-DZ'
): number | null {
  try {
    // Remove currency symbols and extra spaces
    let cleanString = amountString.replace(/[^\d.,\-+]/g, '')
    
    const decimalSep = getDecimalSeparator(locale)
    const thousandsSep = getThousandsSeparator(locale)
    
    // Handle different decimal separators
    if (decimalSep === ',') {
      // Replace thousands separator first, then decimal
      cleanString = cleanString.replace(new RegExp(`\\${thousandsSep}`, 'g'), '')
      cleanString = cleanString.replace(',', '.')
    } else {
      // Standard dot decimal, remove comma thousands separators
      cleanString = cleanString.replace(/,/g, '')
    }
    
    const parsed = parseFloat(cleanString)
    return isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

/**
 * Create tooltip text for conversion details
 */
export function createConversionTooltip(
  exchangeRate: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  conversionDate?: Date
): string {
  const rateText = `1 ${fromCurrency.code} = ${exchangeRate.toFixed(4)} ${toCurrency.code}`
  const dateText = conversionDate 
    ? ` (${conversionDate.toLocaleDateString()})`
    : ''
  
  return `${rateText}${dateText}`
}

/**
 * Determine text color class based on transaction type and amount
 */
export function getAmountColorClass(
  amount: number,
  transactionType?: 'income' | 'expense'
): string {
  if (transactionType === 'income' || amount > 0) {
    return 'text-green-600'
  } else if (transactionType === 'expense' || amount < 0) {
    return 'text-red-600'
  }
  return 'text-gray-900'
}