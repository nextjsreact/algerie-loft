/**
 * Pricing Integration Utilities
 * 
 * Integration layer between the availability service and pricing utilities
 * Provides seamless integration for the client reservation flow
 */

import { availabilityService, DateRange, PricingBreakdown as AvailabilityPricingBreakdown } from '@/lib/services/availability-service';
import { 
  PricingCalculator, 
  LoftPricingConfig, 
  PricingCalculationOptions,
  PricingBreakdown,
  createAlgerianTaxConfig,
  createAlgerianSeasonalRates,
  createSpecialPricingRules
} from './pricing';
import { PriceDisplayUtils, PriceDisplayOptions } from './price-display';
import { Currency } from '@/lib/currency';
import { Locale } from '@/i18n';

// =====================================================
// INTEGRATION TYPES
// =====================================================

export interface EnhancedPricingResult {
  availability: {
    isAvailable: boolean;
    unavailableDates: string[];
    minimumStay: number;
    maximumStay?: number;
  };
  pricing: PricingBreakdown;
  formatted: {
    total: string;
    breakdown: string;
    nightlyRate: string;
  };
  lockId?: string;
}

export interface LoftPricingData {
  id: string;
  baseRate: number;
  cleaningFee: number;
  serviceFeeRate?: number;
  currency: Currency;
  location: {
    city: string;
    country: string;
  };
  // Optional overrides for seasonal/special pricing
  customSeasonalRates?: any[];
  customSpecialPricing?: any[];
  customTaxConfig?: any;
}

// =====================================================
// PRICING INTEGRATION SERVICE
// =====================================================

export class PricingIntegrationService {
  private pricingCalculator: PricingCalculator;

  constructor() {
    this.pricingCalculator = new PricingCalculator();
  }

  /**
   * Get comprehensive pricing and availability for a loft
   */
  async getPricingWithAvailability(
    loftData: LoftPricingData,
    dates: DateRange,
    options: PricingCalculationOptions & PriceDisplayOptions = { guests: 1 }
  ): Promise<EnhancedPricingResult> {
    try {
      // Check availability first
      const availability = await availabilityService.checkAvailability(loftData.id, dates);
      
      if (!availability.isAvailable) {
        // Return basic structure with unavailable status
        return {
          availability,
          pricing: this.createEmptyPricing(loftData.currency),
          formatted: {
            total: 'Not Available',
            breakdown: '',
            nightlyRate: ''
          }
        };
      }

      // Create loft pricing configuration
      const pricingConfig = this.createLoftPricingConfig(loftData);

      // Calculate detailed pricing
      const pricing = await this.pricingCalculator.calculatePricing(pricingConfig, dates, options);

      // Format pricing for display
      const formatted = this.formatPricingForDisplay(pricing, options);

      return {
        availability,
        pricing,
        formatted
      };
    } catch (error) {
      console.error('Error in pricing integration:', error);
      throw new Error(`Failed to get pricing and availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pricing with reservation lock
   */
  async getPricingWithLock(
    loftData: LoftPricingData,
    dates: DateRange,
    options: PricingCalculationOptions & PriceDisplayOptions & { userId?: string } = { guests: 1 }
  ): Promise<EnhancedPricingResult> {
    try {
      // Get pricing and availability
      const result = await this.getPricingWithAvailability(loftData, dates, options);

      if (result.availability.isAvailable) {
        // Create reservation lock
        const lockId = await availabilityService.lockReservation(loftData.id, dates, options.userId);
        result.lockId = lockId;
      }

      return result;
    } catch (error) {
      console.error('Error creating pricing with lock:', error);
      throw error;
    }
  }

  /**
   * Compare pricing across multiple date ranges
   */
  async comparePricingAcrossDates(
    loftData: LoftPricingData,
    dateRanges: DateRange[],
    options: PricingCalculationOptions = { guests: 1 }
  ): Promise<Array<EnhancedPricingResult & { dates: DateRange }>> {
    const results = await Promise.allSettled(
      dateRanges.map(async (dates) => {
        const result = await this.getPricingWithAvailability(loftData, dates, options);
        return { ...result, dates };
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<EnhancedPricingResult & { dates: DateRange }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Get pricing summary for multiple lofts
   */
  async getMultiLoftPricingSummary(
    loftsData: LoftPricingData[],
    dates: DateRange,
    options: PricingCalculationOptions = { guests: 1 }
  ): Promise<Array<{ loftId: string; pricing: EnhancedPricingResult }>> {
    const results = await Promise.allSettled(
      loftsData.map(async (loftData) => {
        const pricing = await this.getPricingWithAvailability(loftData, dates, options);
        return { loftId: loftData.id, pricing };
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{ loftId: string; pricing: EnhancedPricingResult }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
      .sort((a, b) => a.pricing.pricing.total - b.pricing.pricing.total); // Sort by total price
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Create loft pricing configuration from loft data
   */
  private createLoftPricingConfig(loftData: LoftPricingData): LoftPricingConfig {
    return {
      id: loftData.id,
      baseRate: loftData.baseRate,
      cleaningFee: loftData.cleaningFee,
      serviceFeeRate: loftData.serviceFeeRate || 0.12,
      currency: loftData.currency,
      taxConfig: loftData.customTaxConfig || createAlgerianTaxConfig(),
      seasonalRates: loftData.customSeasonalRates || createAlgerianSeasonalRates(),
      specialPricing: loftData.customSpecialPricing || createSpecialPricingRules(),
      location: loftData.location
    };
  }

  /**
   * Format pricing for display
   */
  private formatPricingForDisplay(
    pricing: PricingBreakdown,
    options: PriceDisplayOptions = {}
  ): { total: string; breakdown: string; nightlyRate: string } {
    const { locale = 'en', targetCurrency } = options;

    const total = PriceDisplayUtils.formatDisplayPrice(
      pricing.total,
      pricing.currency,
      { ...options, targetCurrency }
    );

    const breakdown = this.createBreakdownSummary(pricing, locale, targetCurrency);

    const nightlyRate = PriceDisplayUtils.formatNightlyRate(
      pricing.nightlyRate,
      pricing.currency,
      { ...options, targetCurrency }
    );

    return {
      total,
      breakdown,
      nightlyRate
    };
  }

  /**
   * Create pricing breakdown summary
   */
  private createBreakdownSummary(
    pricing: PricingBreakdown,
    locale: Locale = 'en',
    targetCurrency?: Currency
  ): string {
    const currency = targetCurrency || pricing.currency;
    
    const subtotal = PriceDisplayUtils.formatDisplayPrice(pricing.subtotal, pricing.currency, {
      targetCurrency: currency,
      locale
    });

    const fees = pricing.cleaningFee + pricing.serviceFee;
    const feesFormatted = PriceDisplayUtils.formatDisplayPrice(fees, pricing.currency, {
      targetCurrency: currency,
      locale
    });

    const taxes = PriceDisplayUtils.formatDisplayPrice(pricing.taxes, pricing.currency, {
      targetCurrency: currency,
      locale
    });

    // Localized labels
    const labels = this.getBreakdownLabels(locale);

    return `${labels.subtotal}: ${subtotal} + ${labels.fees}: ${feesFormatted} + ${labels.taxes}: ${taxes}`;
  }

  /**
   * Get localized breakdown labels
   */
  private getBreakdownLabels(locale: Locale): { subtotal: string; fees: string; taxes: string } {
    switch (locale) {
      case 'fr':
        return {
          subtotal: 'Sous-total',
          fees: 'Frais',
          taxes: 'Taxes'
        };
      case 'ar':
        return {
          subtotal: 'المجموع الفرعي',
          fees: 'الرسوم',
          taxes: 'الضرائب'
        };
      case 'en':
      default:
        return {
          subtotal: 'Subtotal',
          fees: 'Fees',
          taxes: 'Taxes'
        };
    }
  }

  /**
   * Create empty pricing structure for unavailable dates
   */
  private createEmptyPricing(currency: Currency): PricingBreakdown {
    return {
      nightlyRate: 0,
      nights: 0,
      subtotal: 0,
      cleaningFee: 0,
      serviceFee: 0,
      taxes: 0,
      total: 0,
      currency
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Convert availability service pricing to enhanced pricing
 */
export function convertAvailabilityPricing(
  availabilityPricing: AvailabilityPricingBreakdown,
  loftData: LoftPricingData
): PricingBreakdown {
  return {
    nightlyRate: availabilityPricing.nightlyRate,
    nights: availabilityPricing.nights,
    subtotal: availabilityPricing.subtotal,
    cleaningFee: availabilityPricing.cleaningFee,
    serviceFee: availabilityPricing.serviceFee || 0,
    taxes: availabilityPricing.taxes,
    total: availabilityPricing.total,
    currency: loftData.currency,
    priceOverrides: availabilityPricing.priceOverrides?.map(override => ({
      date: override.date,
      originalPrice: override.originalPrice,
      overridePrice: override.overridePrice,
      reason: override.reason
    }))
  };
}

/**
 * Create loft pricing data from database loft record
 */
export function createLoftPricingDataFromRecord(loft: any): LoftPricingData {
  return {
    id: loft.id,
    baseRate: loft.price_per_night || loft.base_rate || 0,
    cleaningFee: loft.cleaning_fee || 0,
    serviceFeeRate: loft.service_fee_rate || 0.12,
    currency: loft.currency || 'EUR',
    location: {
      city: loft.city || 'Algiers',
      country: loft.country || 'Algeria'
    }
  };
}

/**
 * Calculate price range for a loft across multiple date ranges
 */
export async function calculatePriceRange(
  loftData: LoftPricingData,
  dateRanges: DateRange[],
  options: PricingCalculationOptions = { guests: 1 }
): Promise<{ min: number; max: number; currency: Currency }> {
  const integrationService = new PricingIntegrationService();
  
  const results = await integrationService.comparePricingAcrossDates(loftData, dateRanges, options);
  
  const availableResults = results.filter(result => result.availability.isAvailable);
  
  if (availableResults.length === 0) {
    return { min: 0, max: 0, currency: loftData.currency };
  }

  const prices = availableResults.map(result => result.pricing.total);
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency: loftData.currency
  };
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const pricingIntegrationService = new PricingIntegrationService();