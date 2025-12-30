/**
 * Multi-currency pricing system for dual-audience homepage
 */

import { Locale } from '@/i18n';

export type Currency = 'DZD' | 'EUR' | 'USD';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
  position: 'before' | 'after';
}

export interface ExchangeRates {
  DZD: number;
  EUR: number;
  USD: number;
}

export interface PriceData {
  amount: number;
  currency: Currency;
}

export interface FormattedPrice {
  formatted: string;
  amount: number;
  currency: Currency;
  symbol: string;
}

// Currency configurations
export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  DZD: {
    code: 'DZD',
    symbol: 'د.ج',
    name: 'Algerian Dinar',
    decimals: 0,
    position: 'after'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    position: 'after'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    position: 'before'
  }
};

// Default exchange rates (should be fetched from API in production)
const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  DZD: 1,      // Base currency
  EUR: 0.0074, // 1 DZD = 0.0074 EUR
  USD: 0.0075  // 1 DZD = 0.0075 USD
};

// Get default currency based on locale
export function getDefaultCurrency(locale: Locale): Currency {
  switch (locale) {
    case 'ar':
    case 'fr':
      return 'DZD';
    case 'en':
      return 'USD';
    default:
      return 'DZD';
  }
}

// Get stored currency preference or default
export function getStoredCurrency(locale: Locale): Currency {
  if (typeof window === 'undefined') {
    return getDefaultCurrency(locale);
  }

  try {
    const stored = localStorage.getItem('preferred-currency') as Currency;
    if (stored && CURRENCIES[stored]) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to get stored currency:', error);
  }

  return getDefaultCurrency(locale);
}

// Store currency preference
export function storeCurrency(currency: Currency): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('preferred-currency', currency);
  } catch (error) {
    console.warn('Failed to store currency:', error);
  }
}

// Get exchange rates (in production, this should fetch from an API)
export async function getExchangeRates(): Promise<ExchangeRates> {
  // In production, implement API call to get real-time rates
  // For now, return default rates
  return DEFAULT_EXCHANGE_RATES;
}

// Convert price between currencies
export function convertPrice(
  price: PriceData,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): PriceData {
  if (price.currency === targetCurrency) {
    return price;
  }

  // Convert to DZD first (base currency)
  const dzdAmount = price.currency === 'DZD' 
    ? price.amount 
    : price.amount / exchangeRates[price.currency];

  // Convert from DZD to target currency
  const targetAmount = targetCurrency === 'DZD' 
    ? dzdAmount 
    : dzdAmount * exchangeRates[targetCurrency];

  return {
    amount: targetAmount,
    currency: targetCurrency
  };
}

// Format price for display
export function formatPrice(
  price: PriceData,
  locale: Locale,
  options: {
    showCurrency?: boolean;
    compact?: boolean;
  } = {}
): FormattedPrice {
  const { showCurrency = true, compact = false } = options;
  const currencyInfo = CURRENCIES[price.currency];
  
  // Round amount based on currency decimals
  const roundedAmount = Math.round(price.amount * Math.pow(10, currencyInfo.decimals)) / Math.pow(10, currencyInfo.decimals);
  
  // Format number based on locale
  let formattedNumber: string;
  
  if (compact && roundedAmount >= 1000) {
    // Compact formatting for large numbers
    if (roundedAmount >= 1000000) {
      formattedNumber = (roundedAmount / 1000000).toFixed(1) + 'M';
    } else {
      formattedNumber = (roundedAmount / 1000).toFixed(1) + 'K';
    }
  } else {
    // Standard number formatting
    try {
      formattedNumber = new Intl.NumberFormat(getLocaleForCurrency(locale), {
        minimumFractionDigits: currencyInfo.decimals,
        maximumFractionDigits: currencyInfo.decimals,
      }).format(roundedAmount);
    } catch (error) {
      // Fallback formatting
      formattedNumber = roundedAmount.toFixed(currencyInfo.decimals);
    }
  }

  // Combine number with currency symbol
  let formatted: string;
  if (showCurrency) {
    if (currencyInfo.position === 'before') {
      formatted = `${currencyInfo.symbol}${formattedNumber}`;
    } else {
      formatted = `${formattedNumber} ${currencyInfo.symbol}`;
    }
  } else {
    formatted = formattedNumber;
  }

  return {
    formatted,
    amount: roundedAmount,
    currency: price.currency,
    symbol: currencyInfo.symbol
  };
}

// Get locale string for Intl.NumberFormat
function getLocaleForCurrency(locale: Locale): string {
  switch (locale) {
    case 'ar':
      return 'ar-DZ';
    case 'fr':
      return 'fr-DZ';
    case 'en':
      return 'en-US';
    default:
      return 'fr-DZ';
  }
}

// Format price range
export function formatPriceRange(
  minPrice: PriceData,
  maxPrice: PriceData,
  locale: Locale,
  targetCurrency?: Currency,
  exchangeRates?: ExchangeRates
): string {
  const currency = targetCurrency || minPrice.currency;
  
  const convertedMin = targetCurrency 
    ? convertPrice(minPrice, targetCurrency, exchangeRates)
    : minPrice;
  
  const convertedMax = targetCurrency 
    ? convertPrice(maxPrice, targetCurrency, exchangeRates)
    : maxPrice;

  const formattedMin = formatPrice(convertedMin, locale, { compact: true });
  const formattedMax = formatPrice(convertedMax, locale, { compact: true });

  if (convertedMin.amount === convertedMax.amount) {
    return formattedMin.formatted;
  }

  return `${formattedMin.formatted} - ${formattedMax.formatted}`;
}

// Get currency symbol
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol;
}

// Get currency name
export function getCurrencyName(currency: Currency, locale: Locale): string {
  // In production, this should use translations
  const names: Record<Currency, Record<Locale, string>> = {
    DZD: {
      ar: 'الدينار الجزائري',
      fr: 'Dinar algérien',
      en: 'Algerian Dinar'
    },
    EUR: {
      ar: 'اليورو',
      fr: 'Euro',
      en: 'Euro'
    },
    USD: {
      ar: 'الدولار الأمريكي',
      fr: 'Dollar américain',
      en: 'US Dollar'
    }
  };

  return names[currency][locale] || CURRENCIES[currency].name;
}

// Validate currency code
export function isValidCurrency(code: string): code is Currency {
  return Object.keys(CURRENCIES).includes(code);
}