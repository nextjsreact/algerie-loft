import { PricingBreakdown } from '@/lib/schemas/booking';
import { Loft } from '@/lib/types';

export interface PricingCalculationParams {
  loft: Loft;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export function calculatePricing(params: PricingCalculationParams): PricingBreakdown {
  const { loft, checkIn, checkOut, guests } = params;
  
  // Calculate number of nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Base nightly rate
  const nightlyRate = loft.price_per_night || 0;
  const subtotal = nightlyRate * nights;
  
  // Calculate fees
  const cleaningFee = calculateCleaningFee(loft, guests);
  const serviceFee = calculateServiceFee(subtotal);
  const taxes = calculateTaxes(subtotal + cleaningFee + serviceFee, loft);
  
  // Calculate total
  const total = subtotal + cleaningFee + serviceFee + taxes;
  
  return {
    nightlyRate,
    nights,
    subtotal,
    cleaningFee,
    serviceFee,
    taxes,
    total,
    currency: 'EUR'
  };
}

function calculateCleaningFee(loft: Loft, guests: number): number {
  // Base cleaning fee - could be stored in loft data or calculated
  const baseFee = 50; // Base cleaning fee in EUR
  const guestMultiplier = Math.max(1, Math.ceil(guests / 2)); // Additional fee for more guests
  return baseFee * guestMultiplier;
}

function calculateServiceFee(subtotal: number): number {
  // Service fee as percentage of subtotal (typically 3-5%)
  const serviceRate = 0.04; // 4%
  return subtotal * serviceRate;
}

function calculateTaxes(baseAmount: number, loft: Loft): number {
  // Tax calculation - could vary by location
  // For France, typical tourist tax is around 1-4 EUR per person per night
  // Plus VAT on accommodation services
  const touristTax = 2.50; // EUR per person per night - simplified
  const vatRate = 0.10; // 10% VAT on accommodation in France
  
  const vat = baseAmount * vatRate;
  // Tourist tax would need guest count and nights, simplified here
  const touristTaxTotal = touristTax * 2; // Simplified calculation
  
  return vat + touristTaxTotal;
}

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatPriceCompact(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Validate pricing calculation
export function validatePricing(pricing: PricingBreakdown): boolean {
  const calculatedTotal = pricing.subtotal + pricing.cleaningFee + pricing.serviceFee + pricing.taxes;
  const tolerance = 0.01; // 1 cent tolerance for rounding
  
  return Math.abs(calculatedTotal - pricing.total) <= tolerance;
}

// Get pricing breakdown for display
export function getPricingBreakdownItems(pricing: PricingBreakdown): Array<{
  label: string;
  amount: number;
  type: 'base' | 'fee' | 'tax' | 'total';
}> {
  const items = [
    {
      label: `€${pricing.nightlyRate.toFixed(2)} × ${pricing.nights} nights`,
      amount: pricing.subtotal,
      type: 'base' as const
    }
  ];

  if (pricing.cleaningFee > 0) {
    items.push({
      label: 'Cleaning fee',
      amount: pricing.cleaningFee,
      type: 'fee' as const
    });
  }

  if (pricing.serviceFee > 0) {
    items.push({
      label: 'Service fee',
      amount: pricing.serviceFee,
      type: 'fee' as const
    });
  }

  if (pricing.taxes > 0) {
    items.push({
      label: 'Taxes',
      amount: pricing.taxes,
      type: 'tax' as const
    });
  }

  items.push({
    label: 'Total',
    amount: pricing.total,
    type: 'total' as const
  });

  return items;
}