/**
 * Tests for Pricing Calculation Utilities
 * 
 * Comprehensive tests for pricing calculations, seasonal rates,
 * special pricing, tax calculations, and currency formatting
 */

import {
  PricingCalculator,
  PriceFormatter,
  LoftPricingConfig,
  DateRange,
  PricingCalculationOptions,
  SeasonalRate,
  SpecialPricing,
  TaxConfiguration,
  createAlgerianTaxConfig,
  createAlgerianSeasonalRates,
  createSpecialPricingRules
} from '@/lib/utils/pricing';

import {
  PriceDisplayUtils,
  PriceValidationUtils,
  PriceDisplayOptions
} from '@/lib/utils/price-display';

describe('Pricing Calculation Utilities', () => {
  let pricingCalculator: PricingCalculator;
  let mockLoftConfig: LoftPricingConfig;

  beforeEach(() => {
    pricingCalculator = new PricingCalculator();
    
    mockLoftConfig = {
      id: 'test-loft-1',
      baseRate: 100,
      cleaningFee: 25,
      serviceFeeRate: 0.12,
      currency: 'EUR',
      taxConfig: createAlgerianTaxConfig(),
      seasonalRates: createAlgerianSeasonalRates(),
      specialPricing: createSpecialPricingRules(),
      location: {
        city: 'Algiers',
        country: 'Algeria',
        coordinates: [36.7538, 3.0588]
      }
    };
  });

  describe('PricingCalculator', () => {
    describe('calculatePricing', () => {
      it('should calculate basic pricing without seasonal or special rates', async () => {
        const dates: DateRange = {
          checkIn: '2024-03-01',
          checkOut: '2024-03-03'
        };

        const options: PricingCalculationOptions = {
          guests: 2
        };

        // Use config without seasonal/special pricing
        const basicConfig = {
          ...mockLoftConfig,
          seasonalRates: [],
          specialPricing: []
        };

        const result = await pricingCalculator.calculatePricing(basicConfig, dates, options);

        expect(result.nights).toBe(2);
        expect(result.nightlyRate).toBe(100);
        expect(result.subtotal).toBe(200); // 2 nights * 100
        expect(result.cleaningFee).toBe(25);
        expect(result.serviceFee).toBe(24); // 200 * 0.12
        expect(result.currency).toBe('EUR');
        expect(result.total).toBeGreaterThan(result.subtotal + result.cleaningFee + result.serviceFee);
      });

      it('should apply seasonal rates correctly', async () => {
        const dates: DateRange = {
          checkIn: '2024-07-01', // Summer peak season
          checkOut: '2024-07-03'
        };

        const options: PricingCalculationOptions = {
          guests: 2
        };

        const result = await pricingCalculator.calculatePricing(mockLoftConfig, dates, options);

        expect(result.seasonalAdjustments).toBeDefined();
        expect(result.seasonalAdjustments!.length).toBeGreaterThan(0);
        expect(result.subtotal).toBeGreaterThan(200); // Should be higher due to summer peak
      });

      it('should apply special pricing rules', async () => {
        const dates: DateRange = {
          checkIn: '2024-03-01',
          checkOut: '2024-03-08' // 7 nights for long-stay discount
        };

        const options: PricingCalculationOptions = {
          guests: 2,
          advanceBookingDays: 45 // Early bird discount
        };

        const result = await pricingCalculator.calculatePricing(mockLoftConfig, dates, options);

        expect(result.specialPricing).toBeDefined();
        expect(result.priceOverrides).toBeDefined();
        expect(result.subtotal).toBeLessThan(700); // Should be discounted
      });

      it('should calculate taxes correctly', async () => {
        const dates: DateRange = {
          checkIn: '2024-03-01',
          checkOut: '2024-03-03'
        };

        const options: PricingCalculationOptions = {
          guests: 2
        };

        const result = await pricingCalculator.calculatePricing(mockLoftConfig, dates, options);

        // Should include base tax, city tax, and tourist tax
        expect(result.taxes).toBeGreaterThan(0);
        
        // City tax: 2 DZD * 2 nights * 2 guests = 8 DZD (but in EUR)
        // Tourist tax: 1.5 DZD * 2 nights * 2 guests = 6 DZD (but in EUR)
        // Plus VAT on the taxable amount
        expect(result.taxes).toBeGreaterThan(10);
      });

      it('should handle weekend surcharges', async () => {
        const dates: DateRange = {
          checkIn: '2024-03-01', // Friday
          checkOut: '2024-03-03' // Sunday
        };

        const options: PricingCalculationOptions = {
          guests: 2
        };

        const result = await pricingCalculator.calculatePricing(mockLoftConfig, dates, options);

        // Should have weekend surcharge applied
        expect(result.priceOverrides).toBeDefined();
        const weekendOverrides = result.priceOverrides?.filter(override => 
          override.reason === 'Weekend Surcharge'
        );
        expect(weekendOverrides?.length).toBeGreaterThan(0);
      });

      it('should validate date ranges', async () => {
        const invalidDates: DateRange = {
          checkIn: '2024-03-03',
          checkOut: '2024-03-01' // Check-out before check-in
        };

        const options: PricingCalculationOptions = {
          guests: 2
        };

        await expect(
          pricingCalculator.calculatePricing(mockLoftConfig, invalidDates, options)
        ).rejects.toThrow('Check-out date must be after check-in date');
      });

      it('should handle long-stay tax exemptions', async () => {
        const dates: DateRange = {
          checkIn: '2024-03-01',
          checkOut: '2024-04-01' // 31 nights - qualifies for long-stay exemption
        };

        const options: PricingCalculationOptions = {
          guests: 1
        };

        const result = await pricingCalculator.calculatePricing(mockLoftConfig, dates, options);

        // Tax rate should be reduced due to long-stay exemption
        const taxableAmount = result.subtotal + result.serviceFee + result.cleaningFee;
        const expectedFullTax = taxableAmount * 0.19; // Full VAT rate
        
        expect(result.taxes).toBeLessThan(expectedFullTax);
      });
    });
  });

  describe('PriceFormatter', () => {
    describe('formatPricingBreakdown', () => {
      it('should format pricing breakdown correctly', () => {
        const breakdown = {
          nightlyRate: 100,
          nights: 2,
          subtotal: 200,
          cleaningFee: 25,
          serviceFee: 24,
          taxes: 47.31,
          total: 296.31,
          currency: 'EUR' as const
        };

        const formatted = PriceFormatter.formatPricingBreakdown(breakdown, 'en');

        expect(formatted.total.formatted).toContain('296.31');
        expect(formatted.total.currency).toBe('EUR');
        expect(formatted.nights).toBe(2);
      });

      it('should handle different locales', () => {
        const breakdown = {
          nightlyRate: 100,
          nights: 2,
          subtotal: 200,
          cleaningFee: 25,
          serviceFee: 24,
          taxes: 47.31,
          total: 296.31,
          currency: 'EUR' as const
        };

        const frenchFormatted = PriceFormatter.formatPricingBreakdown(breakdown, 'fr');
        const arabicFormatted = PriceFormatter.formatPricingBreakdown(breakdown, 'ar');

        expect(frenchFormatted.total.formatted).toBeDefined();
        expect(arabicFormatted.total.formatted).toBeDefined();
      });
    });

    describe('formatPriceSummary', () => {
      it('should format compact price summary', () => {
        const breakdown = {
          nightlyRate: 100,
          nights: 2,
          subtotal: 200,
          cleaningFee: 25,
          serviceFee: 24,
          taxes: 47.31,
          total: 296.31,
          currency: 'EUR' as const
        };

        const summary = PriceFormatter.formatPriceSummary(breakdown, 'en', {
          showBreakdown: true,
          compact: true
        });

        expect(summary).toContain('200');
        expect(summary).toContain('49'); // Combined fees
        expect(summary).toContain('47.31'); // Taxes
        expect(summary).toContain('296.31'); // Total
      });
    });

    describe('formatNightlyRate', () => {
      it('should format nightly rate with seasonal information', () => {
        const seasonalAdjustments = [{
          date: '2024-07-01',
          originalRate: 100,
          adjustedRate: 150,
          seasonName: 'Summer Peak',
          multiplier: 1.5
        }];

        const formatted = PriceFormatter.formatNightlyRate(
          100,
          '2024-07-01',
          seasonalAdjustments,
          'EUR',
          'en'
        );

        expect(formatted).toContain('150');
        expect(formatted).toContain('Summer Peak');
        expect(formatted).toContain('100');
      });
    });
  });

  describe('PriceDisplayUtils', () => {
    describe('formatDisplayPrice', () => {
      it('should format price with different options', () => {
        const amount = 123.45;
        const currency = 'EUR';

        const compact = PriceDisplayUtils.formatDisplayPrice(amount, currency, {
          compact: true
        });

        const full = PriceDisplayUtils.formatDisplayPrice(amount, currency, {
          compact: false
        });

        expect(compact).toBeDefined();
        expect(full).toBeDefined();
        expect(compact).toContain('123');
        expect(full).toContain('123.45');
      });

      it('should handle currency conversion', () => {
        const amount = 100;
        const currency = 'EUR';

        const formatted = PriceDisplayUtils.formatDisplayPrice(amount, currency, {
          targetCurrency: 'USD'
        });

        expect(formatted).toBeDefined();
        expect(formatted).toContain('$');
      });
    });

    describe('formatPriceRange', () => {
      it('should format price range correctly', () => {
        const range = PriceDisplayUtils.formatPriceRange(100, 200, 'EUR');

        expect(range.min).toContain('100');
        expect(range.max).toContain('200');
        expect(range.formatted).toContain('-');
        expect(range.currency).toBe('EUR');
      });

      it('should handle equal min and max prices', () => {
        const range = PriceDisplayUtils.formatPriceRange(150, 150, 'EUR');

        expect(range.formatted).not.toContain('-');
        expect(range.formatted).toContain('150');
      });
    });

    describe('formatDiscountedPrice', () => {
      it('should format discounted price with savings', () => {
        const comparison = {
          originalPrice: 200,
          currentPrice: 150,
          currency: 'EUR' as const
        };

        const formatted = PriceDisplayUtils.formatDiscountedPrice(comparison);

        expect(formatted.current).toContain('150');
        expect(formatted.original).toContain('200');
        expect(formatted.discount).toBe('25%');
        expect(formatted.savings).toContain('50');
      });
    });

    describe('formatNightlyRate', () => {
      it('should format nightly rate with per-night indicator', () => {
        const formatted = PriceDisplayUtils.formatNightlyRate(100, 'EUR', {
          locale: 'en'
        });

        expect(formatted).toContain('100');
        expect(formatted).toContain('/night');
      });

      it('should use correct locale for per-night text', () => {
        const french = PriceDisplayUtils.formatNightlyRate(100, 'EUR', {
          locale: 'fr'
        });

        const arabic = PriceDisplayUtils.formatNightlyRate(100, 'EUR', {
          locale: 'ar'
        });

        expect(french).toContain('/nuit');
        expect(arabic).toContain('/ليلة');
      });
    });

    describe('formatContextualPrice', () => {
      it('should format prices for different contexts', () => {
        const amount = 123.45;
        const currency = 'EUR';

        const card = PriceDisplayUtils.formatContextualPrice(amount, currency, 'card');
        const detail = PriceDisplayUtils.formatContextualPrice(amount, currency, 'detail');

        expect(card).toBeDefined();
        expect(detail).toBeDefined();
        // Card format should be more compact
        expect(detail.length).toBeGreaterThanOrEqual(card.length);
      });
    });
  });

  describe('PriceValidationUtils', () => {
    describe('validatePrice', () => {
      it('should validate positive numbers', () => {
        const valid = PriceValidationUtils.validatePrice(100);
        expect(valid.isValid).toBe(true);
        expect(valid.error).toBeUndefined();
      });

      it('should reject negative numbers', () => {
        const invalid = PriceValidationUtils.validatePrice(-50);
        expect(invalid.isValid).toBe(false);
        expect(invalid.error).toContain('negative');
      });

      it('should reject non-numbers', () => {
        const invalid = PriceValidationUtils.validatePrice(NaN);
        expect(invalid.isValid).toBe(false);
        expect(invalid.error).toContain('valid number');
      });

      it('should reject extremely large numbers', () => {
        const invalid = PriceValidationUtils.validatePrice(2000000);
        expect(invalid.isValid).toBe(false);
        expect(invalid.error).toContain('maximum');
      });
    });

    describe('validatePriceRange', () => {
      it('should validate correct price ranges', () => {
        const valid = PriceValidationUtils.validatePriceRange(50, 200);
        expect(valid.isValid).toBe(true);
      });

      it('should reject inverted ranges', () => {
        const invalid = PriceValidationUtils.validatePriceRange(200, 50);
        expect(invalid.isValid).toBe(false);
        expect(invalid.error).toContain('greater than maximum');
      });
    });

    describe('validatePricingBreakdown', () => {
      it('should validate correct pricing breakdown', () => {
        const breakdown = {
          nightlyRate: 100,
          nights: 2,
          subtotal: 200,
          cleaningFee: 25,
          serviceFee: 24,
          taxes: 47.31,
          total: 296.31,
          currency: 'EUR' as const
        };

        const validation = PriceValidationUtils.validatePricingBreakdown(breakdown);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should detect calculation errors', () => {
        const breakdown = {
          nightlyRate: 100,
          nights: 2,
          subtotal: 200,
          cleaningFee: 25,
          serviceFee: 24,
          taxes: 47.31,
          total: 300, // Incorrect total
          currency: 'EUR' as const
        };

        const validation = PriceValidationUtils.validatePricingBreakdown(breakdown);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(error => error.includes('Total amount does not match'))).toBe(true);
      });

      it('should validate nights count', () => {
        const breakdown = {
          nightlyRate: 100,
          nights: 0, // Invalid nights
          subtotal: 200,
          cleaningFee: 25,
          serviceFee: 24,
          taxes: 47.31,
          total: 296.31,
          currency: 'EUR' as const
        };

        const validation = PriceValidationUtils.validatePricingBreakdown(breakdown);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(error => error.includes('positive integer'))).toBe(true);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('createAlgerianTaxConfig', () => {
      it('should create valid Algerian tax configuration', () => {
        const config = createAlgerianTaxConfig();
        
        expect(config.baseRate).toBe(0.19);
        expect(config.cityTax).toBe(2.0);
        expect(config.touristTax).toBe(1.5);
        expect(config.exemptions).toBeDefined();
        expect(config.exemptions!.length).toBeGreaterThan(0);
      });
    });

    describe('createAlgerianSeasonalRates', () => {
      it('should create valid seasonal rates', () => {
        const rates = createAlgerianSeasonalRates();
        
        expect(rates.length).toBeGreaterThan(0);
        expect(rates[0]).toHaveProperty('id');
        expect(rates[0]).toHaveProperty('multiplier');
        expect(rates[0]).toHaveProperty('priority');
      });
    });

    describe('createSpecialPricingRules', () => {
      it('should create valid special pricing rules', () => {
        const rules = createSpecialPricingRules();
        
        expect(rules.length).toBeGreaterThan(0);
        expect(rules[0]).toHaveProperty('id');
        expect(rules[0]).toHaveProperty('type');
        expect(rules[0]).toHaveProperty('conditions');
      });
    });
  });
});