// Pricing Rules Types for Dynamic Pricing System

export type PricingRuleType = 'seasonal' | 'weekend' | 'holiday' | 'event' | 'length_of_stay' | 'advance_booking';
export type PricingAdjustmentType = 'percentage' | 'fixed_amount' | 'override';

export interface PricingRule {
  id: string;
  loft_id: string;
  rule_name: string;
  rule_type: PricingRuleType;
  start_date?: string;
  end_date?: string;
  days_of_week?: number[];
  minimum_nights?: number;
  maximum_nights?: number;
  advance_booking_days?: number;
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  priority: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DynamicPricingCalculation {
  base_price: number;
  final_price: number;
  applied_rules: {
    rule_name: string;
    rule_type: PricingRuleType;
    adjustment_type: PricingAdjustmentType;
    adjustment_value: number;
    price_before: number;
    price_after: number;
  }[];
}

export interface PricingRuleFormData {
  rule_name: string;
  rule_type: PricingRuleType;
  start_date?: string;
  end_date?: string;
  days_of_week?: number[];
  minimum_nights?: number;
  maximum_nights?: number;
  advance_booking_days?: number;
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  priority: number;
  is_active: boolean;
  description?: string;
}

export interface SeasonalRate {
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  description?: string;
}

export interface WeekendRate {
  name: string;
  days_of_week: number[];
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  description?: string;
}

export interface LengthOfStayDiscount {
  name: string;
  minimum_nights: number;
  maximum_nights?: number;
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  description?: string;
}

export interface AdvanceBookingDiscount {
  name: string;
  advance_booking_days: number;
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  description?: string;
}

// Predefined rule templates
export const PRICING_RULE_TEMPLATES = {
  SUMMER_SEASON: {
    rule_name: 'Summer Season',
    rule_type: 'seasonal' as PricingRuleType,
    adjustment_type: 'percentage' as PricingAdjustmentType,
    adjustment_value: 25,
    priority: 5,
    description: 'Higher rates during summer season'
  },
  WINTER_SEASON: {
    rule_name: 'Winter Season',
    rule_type: 'seasonal' as PricingRuleType,
    adjustment_type: 'percentage' as PricingAdjustmentType,
    adjustment_value: -15,
    priority: 5,
    description: 'Lower rates during winter season'
  },
  WEEKEND_PREMIUM: {
    rule_name: 'Weekend Premium',
    rule_type: 'weekend' as PricingRuleType,
    days_of_week: [5, 6], // Friday, Saturday
    adjustment_type: 'percentage' as PricingAdjustmentType,
    adjustment_value: 20,
    priority: 3,
    description: 'Premium rates for weekends'
  },
  WEEKLY_DISCOUNT: {
    rule_name: 'Weekly Stay Discount',
    rule_type: 'length_of_stay' as PricingRuleType,
    minimum_nights: 7,
    adjustment_type: 'percentage' as PricingAdjustmentType,
    adjustment_value: -10,
    priority: 2,
    description: 'Discount for stays of 7+ nights'
  },
  MONTHLY_DISCOUNT: {
    rule_name: 'Monthly Stay Discount',
    rule_type: 'length_of_stay' as PricingRuleType,
    minimum_nights: 28,
    adjustment_type: 'percentage' as PricingAdjustmentType,
    adjustment_value: -20,
    priority: 1,
    description: 'Discount for stays of 28+ nights'
  },
  EARLY_BIRD: {
    rule_name: 'Early Bird Discount',
    rule_type: 'advance_booking' as PricingRuleType,
    advance_booking_days: 30,
    adjustment_type: 'percentage' as PricingAdjustmentType,
    adjustment_value: -5,
    priority: 1,
    description: 'Discount for bookings made 30+ days in advance'
  }
} as const;

// Helper functions for rule validation
export const validatePricingRule = (rule: PricingRuleFormData): string[] => {
  const errors: string[] = [];

  if (!rule.rule_name.trim()) {
    errors.push('Rule name is required');
  }

  if (rule.adjustment_value === 0) {
    errors.push('Adjustment value cannot be zero');
  }

  if (rule.rule_type === 'seasonal' || rule.rule_type === 'holiday' || rule.rule_type === 'event') {
    if (!rule.start_date || !rule.end_date) {
      errors.push('Start date and end date are required for this rule type');
    }
    if (rule.start_date && rule.end_date && rule.start_date > rule.end_date) {
      errors.push('Start date must be before end date');
    }
  }

  if (rule.rule_type === 'weekend' && (!rule.days_of_week || rule.days_of_week.length === 0)) {
    errors.push('Days of week are required for weekend rules');
  }

  if (rule.rule_type === 'length_of_stay' && !rule.minimum_nights) {
    errors.push('Minimum nights is required for length of stay rules');
  }

  if (rule.rule_type === 'advance_booking' && !rule.advance_booking_days) {
    errors.push('Advance booking days is required for advance booking rules');
  }

  if (rule.minimum_nights && rule.maximum_nights && rule.minimum_nights > rule.maximum_nights) {
    errors.push('Minimum nights cannot be greater than maximum nights');
  }

  return errors;
};

export const formatAdjustmentValue = (type: PricingAdjustmentType, value: number): string => {
  switch (type) {
    case 'percentage':
      return `${value > 0 ? '+' : ''}${value}%`;
    case 'fixed_amount':
      return `${value > 0 ? '+' : '-'}$${Math.abs(value)}`;
    case 'override':
      return `$${value}`;
    default:
      return `${value}`;
  }
};

export const getDayName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
};