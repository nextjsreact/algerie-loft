/**
 * Financial data anonymization with realistic ranges
 */

import { BaseAnonymizer } from './base-anonymizer';
import { AnonymizationRule, AnonymizationContext } from '../types';
import { faker } from '@faker-js/faker';

export interface FinancialContext {
  currency: string;
  type: 'rent' | 'deposit' | 'fee' | 'utility' | 'maintenance' | 'payment' | 'other';
  range?: { min: number; max: number };
}

export class FinancialAnonymizer extends BaseAnonymizer {
  // Algerian Dinar (DZD) typical ranges for different transaction types
  private readonly algerianRanges = {
    rent: { min: 15000, max: 80000 },        // Monthly rent in DZD
    deposit: { min: 30000, max: 160000 },    // Security deposits
    fee: { min: 1000, max: 10000 },          // Various fees
    utility: { min: 2000, max: 15000 },      // Utilities (electricity, water, gas)
    maintenance: { min: 5000, max: 25000 },  // Maintenance costs
    payment: { min: 5000, max: 100000 },     // General payments
    other: { min: 1000, max: 50000 }         // Other expenses
  };

  // Exchange rates for reference (approximate)
  private readonly exchangeRates = {
    'DZD': 1,
    'EUR': 0.0067,
    'USD': 0.0074
  };

  anonymize(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): number {
    if (typeof value !== 'number' || value <= 0) {
      return value;
    }

    const financialContext = this.determineFinancialContext(context.columnName, value);
    
    if (rule.preserveFormat) {
      return this.preserveAmountMagnitude(value, financialContext);
    }

    return this.generateRealisticAmount(value, financialContext, context);
  }

  /**
   * Determine financial context based on column name and value
   */
  private determineFinancialContext(columnName: string, value: number): FinancialContext {
    const lowerColumnName = columnName.toLowerCase();
    
    // Determine transaction type
    let type: FinancialContext['type'] = 'other';
    
    if (lowerColumnName.includes('rent') || lowerColumnName.includes('loyer')) {
      type = 'rent';
    } else if (lowerColumnName.includes('deposit') || lowerColumnName.includes('caution')) {
      type = 'deposit';
    } else if (lowerColumnName.includes('fee') || lowerColumnName.includes('frais')) {
      type = 'fee';
    } else if (lowerColumnName.includes('utility') || lowerColumnName.includes('charge')) {
      type = 'utility';
    } else if (lowerColumnName.includes('maintenance') || lowerColumnName.includes('entretien')) {
      type = 'maintenance';
    } else if (lowerColumnName.includes('payment') || lowerColumnName.includes('paiement')) {
      type = 'payment';
    }

    // Determine currency (default to DZD for Algerian context)
    let currency = 'DZD';
    if (value < 1000) {
      // Might be in EUR or USD
      currency = value < 100 ? 'EUR' : 'USD';
    }

    return {
      currency,
      type,
      range: this.algerianRanges[type]
    };
  }

  /**
   * Preserve the magnitude of the original amount while anonymizing
   */
  private preserveAmountMagnitude(value: number, context: FinancialContext): number {
    const magnitude = Math.floor(Math.log10(Math.abs(value)));
    const factor = Math.pow(10, magnitude);
    
    // Generate amount within the same order of magnitude
    const min = Math.max(factor, context.range?.min || factor);
    const max = Math.min(factor * 10, context.range?.max || factor * 10);
    
    return faker.datatype.number({ min, max });
  }

  /**
   * Generate realistic amount based on context
   */
  private generateRealisticAmount(
    originalValue: number, 
    financialContext: FinancialContext, 
    context: AnonymizationContext
  ): number {
    const hash = this.generateHash(originalValue.toString(), context.tableName);
    const range = financialContext.range || { min: 1000, max: 50000 };
    
    // Use hash to generate consistent but random amount within range
    const hashNumber = parseInt(hash.slice(0, 6), 36);
    const normalizedHash = hashNumber / Math.pow(36, 6); // Normalize to 0-1
    
    const amount = Math.floor(range.min + (normalizedHash * (range.max - range.min)));
    
    // Round to nearest appropriate value based on magnitude
    return this.roundToRealistic(amount, financialContext.type);
  }

  /**
   * Round amounts to realistic values
   */
  private roundToRealistic(amount: number, type: FinancialContext['type']): number {
    if (type === 'rent' || type === 'deposit') {
      // Round to nearest 1000 DZD for rent/deposits
      return Math.round(amount / 1000) * 1000;
    }
    
    if (type === 'utility' || type === 'maintenance') {
      // Round to nearest 500 DZD for utilities/maintenance
      return Math.round(amount / 500) * 500;
    }
    
    if (type === 'fee') {
      // Round to nearest 100 DZD for fees
      return Math.round(amount / 100) * 100;
    }
    
    // Default rounding to nearest 100
    return Math.round(amount / 100) * 100;
  }

  /**
   * Generate transaction reference amounts for alerts
   */
  generateReferenceAmounts(transactionType: string): {
    warningThreshold: number;
    alertThreshold: number;
    maxThreshold: number;
  } {
    const baseRanges = this.algerianRanges[transactionType as keyof typeof this.algerianRanges] || 
                      this.algerianRanges.other;
    
    return {
      warningThreshold: Math.floor(baseRanges.max * 0.7),
      alertThreshold: Math.floor(baseRanges.max * 0.9),
      maxThreshold: baseRanges.max
    };
  }

  /**
   * Generate bill amounts with realistic patterns
   */
  generateBillAmount(billType: 'monthly' | 'quarterly' | 'annual', baseAmount?: number): number {
    const multipliers = {
      monthly: 1,
      quarterly: 3,
      annual: 12
    };

    if (baseAmount) {
      return Math.floor(baseAmount * multipliers[billType]);
    }

    // Generate base monthly amount
    const monthlyBase = faker.datatype.number({ min: 5000, max: 25000 });
    return Math.floor(monthlyBase * multipliers[billType]);
  }

  /**
   * Generate payment schedule amounts
   */
  generatePaymentSchedule(totalAmount: number, installments: number): number[] {
    const amounts: number[] = [];
    let remaining = totalAmount;
    
    for (let i = 0; i < installments - 1; i++) {
      // Generate installment between 10% and 40% of remaining
      const minInstallment = Math.floor(remaining * 0.1);
      const maxInstallment = Math.floor(remaining * 0.4);
      
      const installment = faker.datatype.number({ 
        min: minInstallment, 
        max: Math.min(maxInstallment, remaining - (installments - i - 1) * minInstallment)
      });
      
      amounts.push(this.roundToRealistic(installment, 'payment'));
      remaining -= installment;
    }
    
    // Last installment gets the remainder
    amounts.push(remaining);
    
    return amounts;
  }

  /**
   * Generate currency conversion
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromRate = this.exchangeRates[fromCurrency as keyof typeof this.exchangeRates] || 1;
    const toRate = this.exchangeRates[toCurrency as keyof typeof this.exchangeRates] || 1;
    
    // Convert to base (DZD) then to target currency
    const baseAmount = amount / fromRate;
    return Math.floor(baseAmount * toRate);
  }

  /**
   * Generate realistic pricing for loft rentals
   */
  generateLoftPricing(loftType: 'studio' | 'apartment' | 'house' | 'luxury'): {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    cleaningFee: number;
    securityDeposit: number;
  } {
    const baseRates = {
      studio: { min: 3000, max: 6000 },
      apartment: { min: 5000, max: 12000 },
      house: { min: 8000, max: 20000 },
      luxury: { min: 15000, max: 40000 }
    };

    const range = baseRates[loftType];
    const dailyRate = faker.datatype.number(range);
    
    return {
      dailyRate: this.roundToRealistic(dailyRate, 'rent'),
      weeklyRate: this.roundToRealistic(dailyRate * 6, 'rent'), // 6 days for weekly discount
      monthlyRate: this.roundToRealistic(dailyRate * 25, 'rent'), // 25 days for monthly discount
      cleaningFee: this.roundToRealistic(dailyRate * 0.3, 'fee'),
      securityDeposit: this.roundToRealistic(dailyRate * 2, 'deposit')
    };
  }

  /**
   * Validate financial amount constraints
   */
  validateFinancialConstraints(amount: number, context: FinancialContext): boolean {
    if (amount <= 0) return false;
    
    const range = context.range;
    if (range && (amount < range.min || amount > range.max)) {
      return false;
    }
    
    // Additional validation for specific types
    if (context.type === 'deposit' && amount < 10000) {
      return false; // Deposits should be substantial
    }
    
    if (context.type === 'fee' && amount > 50000) {
      return false; // Fees shouldn't be too high
    }
    
    return true;
  }
}