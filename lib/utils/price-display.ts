/**
 * Price Display Utilities
 * 
 * Utilities for displaying prices in various formats and contexts
 * Integrates with the pricing calculation system and currency handling
 */

import { Currency, PriceData, formatPrice, convertPrice, getExchangeRates } from '@/lib/currency';
import { PricingBreakdown, FormattedPricingBreakdown, PriceFormatter } from './pricing';
import { Locale } from '@/i18n';

// =====================================================
// PRICE DISPLAY TYPES
// =====================================================

export interface PriceDisplayOptions {
  showCurrency?: boolean;
  compact?: boolean;
  showBreakdown?: boolean;
  targetCurrency?: Currency;
  locale?: Locale;
  precision?: number;
}

export interface PriceComparisonData {
  originalPrice: number;
  currentPrice: number;
  discountPercentage?: number;
  savingsAmount?: number;
  currency: Currency;
}

export interface PriceRangeDisplay {
  min: string;
  max: string;
  currency: Currency;
  formatted: string;
}

// =====================================================
// PRICE DISPLAY UTILITIES
// =====================================================

export class PriceDisplayUtils {
  /**
   * Format a single price with various display options
   */
  static formatDisplayPrice(
    amount: number,
    currency: Currency,
    options: PriceDisplayOptions = {}
  ): string {
    const {
      showCurrency = true,
      compact = false,
      locale = 'en',
      precision
    } = options;

    const priceData: PriceData = { amount, currency };
    
    // Convert to target currency if specified
    const targetCurrency = options.targetCurrency || currency;
    const convertedPrice = targetCurrency !== currency 
      ? convertPrice(priceData, targetCurrency)
      : priceData;

    const formatOptions = {
      showCurrency,
      compact
    };

    const formatted = formatPrice(convertedPrice, locale, formatOptions);
    
    // Apply custom precision if specified
    if (precision !== undefined && precision !== formatted.amount) {
      const roundedAmount = Math.round(formatted.amount * Math.pow(10, precision)) / Math.pow(10, precision);
      return formatPrice({ amount: roundedAmount, currency: targetCurrency }, locale, formatOptions).formatted;
    }

    return formatted.formatted;
  }

  /**
   * Format price range (min - max)
   */
  static formatPriceRange(
    minPrice: number,
    maxPrice: number,
    currency: Currency,
    options: PriceDisplayOptions = {}
  ): PriceRangeDisplay {
    const { locale = 'en', targetCurrency, compact = true } = options;
    
    const displayCurrency = targetCurrency || currency;
    
    const minFormatted = this.formatDisplayPrice(minPrice, currency, {
      ...options,
      targetCurrency: displayCurrency,
      compact
    });
    
    const maxFormatted = this.formatDisplayPrice(maxPrice, currency, {
      ...options,
      targetCurrency: displayCurrency,
      compact
    });

    let rangeFormatted: string;
    if (minPrice === maxPrice) {
      rangeFormatted = minFormatted;
    } else {
      rangeFormatted = `${minFormatted} - ${maxFormatted}`;
    }

    return {
      min: minFormatted,
      max: maxFormatted,
      currency: displayCurrency,
      formatted: rangeFormatted
    };
  }

  /**
   * Format price with discount information
   */
  static formatDiscountedPrice(
    comparison: PriceComparisonData,
    options: PriceDisplayOptions = {}
  ): {
    current: string;
    original: string;
    discount: string;
    savings: string;
  } {
    const { locale = 'en', targetCurrency } = options;
    const displayCurrency = targetCurrency || comparison.currency;

    const currentFormatted = this.formatDisplayPrice(
      comparison.currentPrice,
      comparison.currency,
      { ...options, targetCurrency: displayCurrency }
    );

    const originalFormatted = this.formatDisplayPrice(
      comparison.originalPrice,
      comparison.currency,
      { ...options, targetCurrency: displayCurrency }
    );

    // Calculate discount percentage if not provided
    const discountPercentage = comparison.discountPercentage || 
      Math.round(((comparison.originalPrice - comparison.currentPrice) / comparison.originalPrice) * 100);

    // Calculate savings amount if not provided
    const savingsAmount = comparison.savingsAmount || 
      (comparison.originalPrice - comparison.currentPrice);

    const savingsFormatted = this.formatDisplayPrice(
      savingsAmount,
      comparison.currency,
      { ...options, targetCurrency: displayCurrency }
    );

    return {
      current: currentFormatted,
      original: originalFormatted,
      discount: `${discountPercentage}%`,
      savings: savingsFormatted
    };
  }

  /**
   * Format nightly rate with per-night indicator
   */
  static formatNightlyRate(
    rate: number,
    currency: Currency,
    options: PriceDisplayOptions = {}
  ): string {
    const { locale = 'en' } = options;
    const formatted = this.formatDisplayPrice(rate, currency, options);
    
    // Add per-night indicator based on locale
    const perNightText = this.getPerNightText(locale);
    return `${formatted}${perNightText}`;
  }

  /**
   * Get localized "per night" text
   */
  private static getPerNightText(locale: Locale): string {
    switch (locale) {
      case 'fr':
        return '/nuit';
      case 'ar':
        return '/ليلة';
      case 'en':
      default:
        return '/night';
    }
  }

  /**
   * Format total price with breakdown summary
   */
  static formatTotalWithBreakdown(
    breakdown: PricingBreakdown,
    options: PriceDisplayOptions = {}
  ): {
    total: string;
    breakdown: string;
    details: FormattedPricingBreakdown;
  } {
    const { locale = 'en', targetCurrency, showBreakdown = true } = options;
    const displayCurrency = targetCurrency || breakdown.currency;

    // Format total
    const total = this.formatDisplayPrice(
      breakdown.total,
      breakdown.currency,
      { ...options, targetCurrency: displayCurrency }
    );

    // Format breakdown summary
    const breakdownSummary = showBreakdown 
      ? PriceFormatter.formatPriceSummary(breakdown, locale, {
          showBreakdown: true,
          compact: true,
          targetCurrency: displayCurrency
        })
      : '';

    // Get detailed breakdown
    const details = PriceFormatter.formatPricingBreakdown(
      breakdown,
      locale,
      displayCurrency
    );

    return {
      total,
      breakdown: breakdownSummary,
      details
    };
  }

  /**
   * Format price for different contexts (card, list, detail)
   */
  static formatContextualPrice(
    amount: number,
    currency: Currency,
    context: 'card' | 'list' | 'detail' | 'summary',
    options: PriceDisplayOptions = {}
  ): string {
    const baseOptions = { ...options };

    switch (context) {
      case 'card':
        // Compact format for cards
        return this.formatDisplayPrice(amount, currency, {
          ...baseOptions,
          compact: true,
          showCurrency: true
        });

      case 'list':
        // Standard format for lists
        return this.formatDisplayPrice(amount, currency, {
          ...baseOptions,
          compact: false,
          showCurrency: true
        });

      case 'detail':
        // Detailed format with full precision
        return this.formatDisplayPrice(amount, currency, {
          ...baseOptions,
          compact: false,
          showCurrency: true,
          precision: 2
        });

      case 'summary':
        // Summary format, often larger/bold
        return this.formatDisplayPrice(amount, currency, {
          ...baseOptions,
          compact: false,
          showCurrency: true,
          precision: 2
        });

      default:
        return this.formatDisplayPrice(amount, currency, baseOptions);
    }
  }

  /**
   * Format price with tax information
   */
  static formatPriceWithTax(
    baseAmount: number,
    taxAmount: number,
    currency: Currency,
    options: PriceDisplayOptions & { showTaxBreakdown?: boolean } = {}
  ): {
    basePrice: string;
    taxAmount: string;
    totalPrice: string;
    formatted: string;
  } {
    const { showTaxBreakdown = false, locale = 'en' } = options;
    
    const baseFormatted = this.formatDisplayPrice(baseAmount, currency, options);
    const taxFormatted = this.formatDisplayPrice(taxAmount, currency, options);
    const totalFormatted = this.formatDisplayPrice(baseAmount + taxAmount, currency, options);

    let formatted = totalFormatted;
    if (showTaxBreakdown) {
      const taxIncludedText = this.getTaxIncludedText(locale);
      formatted = `${totalFormatted} ${taxIncludedText}`;
    }

    return {
      basePrice: baseFormatted,
      taxAmount: taxFormatted,
      totalPrice: totalFormatted,
      formatted
    };
  }

  /**
   * Get localized "tax included" text
   */
  private static getTaxIncludedText(locale: Locale): string {
    switch (locale) {
      case 'fr':
        return '(taxes incluses)';
      case 'ar':
        return '(شامل الضرائب)';
      case 'en':
      default:
        return '(tax included)';
    }
  }

  /**
   * Format price comparison between different options
   */
  static formatPriceComparison(
    prices: Array<{ label: string; amount: number; currency: Currency }>,
    options: PriceDisplayOptions = {}
  ): Array<{ label: string; formatted: string; amount: number; isLowest: boolean; isHighest: boolean }> {
    if (prices.length === 0) return [];

    const amounts = prices.map(p => p.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    return prices.map(price => ({
      label: price.label,
      formatted: this.formatDisplayPrice(price.amount, price.currency, options),
      amount: price.amount,
      isLowest: price.amount === minAmount,
      isHighest: price.amount === maxAmount
    }));
  }

  /**
   * Format seasonal price variation
   */
  static formatSeasonalPricing(
    basePrice: number,
    seasonalMultiplier: number,
    seasonName: string,
    currency: Currency,
    options: PriceDisplayOptions = {}
  ): {
    basePrice: string;
    seasonalPrice: string;
    difference: string;
    percentageChange: string;
    seasonName: string;
  } {
    const seasonalPrice = basePrice * seasonalMultiplier;
    const difference = seasonalPrice - basePrice;
    const percentageChange = Math.round((seasonalMultiplier - 1) * 100);

    return {
      basePrice: this.formatDisplayPrice(basePrice, currency, options),
      seasonalPrice: this.formatDisplayPrice(seasonalPrice, currency, options),
      difference: this.formatDisplayPrice(Math.abs(difference), currency, options),
      percentageChange: `${percentageChange > 0 ? '+' : ''}${percentageChange}%`,
      seasonName
    };
  }
}

// =====================================================
// PRICE VALIDATION UTILITIES
// =====================================================

export class PriceValidationUtils {
  /**
   * Validate price amount
   */
  static validatePrice(amount: number): { isValid: boolean; error?: string } {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { isValid: false, error: 'Price must be a valid number' };
    }

    if (amount < 0) {
      return { isValid: false, error: 'Price cannot be negative' };
    }

    if (amount > 1000000) {
      return { isValid: false, error: 'Price exceeds maximum allowed value' };
    }

    return { isValid: true };
  }

  /**
   * Validate price range
   */
  static validatePriceRange(
    minPrice: number,
    maxPrice: number
  ): { isValid: boolean; error?: string } {
    const minValidation = this.validatePrice(minPrice);
    if (!minValidation.isValid) {
      return { isValid: false, error: `Minimum price: ${minValidation.error}` };
    }

    const maxValidation = this.validatePrice(maxPrice);
    if (!maxValidation.isValid) {
      return { isValid: false, error: `Maximum price: ${maxValidation.error}` };
    }

    if (minPrice > maxPrice) {
      return { isValid: false, error: 'Minimum price cannot be greater than maximum price' };
    }

    return { isValid: true };
  }

  /**
   * Validate pricing breakdown
   */
  static validatePricingBreakdown(
    breakdown: PricingBreakdown
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate individual amounts
    const amounts = [
      { name: 'Nightly rate', value: breakdown.nightlyRate },
      { name: 'Subtotal', value: breakdown.subtotal },
      { name: 'Cleaning fee', value: breakdown.cleaningFee },
      { name: 'Service fee', value: breakdown.serviceFee },
      { name: 'Taxes', value: breakdown.taxes },
      { name: 'Total', value: breakdown.total }
    ];

    for (const amount of amounts) {
      const validation = this.validatePrice(amount.value);
      if (!validation.isValid) {
        errors.push(`${amount.name}: ${validation.error}`);
      }
    }

    // Validate nights
    if (breakdown.nights <= 0 || !Number.isInteger(breakdown.nights)) {
      errors.push('Number of nights must be a positive integer');
    }

    // Validate total calculation (with small tolerance for floating point)
    const calculatedTotal = breakdown.subtotal + breakdown.cleaningFee + 
                           breakdown.serviceFee + breakdown.taxes;
    const tolerance = 0.01;
    
    if (Math.abs(calculatedTotal - breakdown.total) > tolerance) {
      errors.push('Total amount does not match sum of components');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// =====================================================
// EXPORT UTILITIES
// =====================================================

export {
  PriceDisplayUtils as priceDisplay,
  PriceValidationUtils as priceValidation
};