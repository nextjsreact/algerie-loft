import { validatePricingRule, formatAdjustmentValue, getDayName } from '@/lib/types/pricing';
import type { PricingRuleFormData } from '@/lib/types/pricing';

describe('Pricing Rules', () => {
  describe('validatePricingRule', () => {
    it('should validate required fields', () => {
      const rule: PricingRuleFormData = {
        rule_name: '',
        rule_type: 'seasonal',
        adjustment_type: 'percentage',
        adjustment_value: 0,
        priority: 0,
        is_active: true,
      };

      const errors = validatePricingRule(rule);
      expect(errors).toContain('Rule name is required');
      expect(errors).toContain('Adjustment value cannot be zero');
    });

    it('should validate seasonal rule dates', () => {
      const rule: PricingRuleFormData = {
        rule_name: 'Summer Season',
        rule_type: 'seasonal',
        adjustment_type: 'percentage',
        adjustment_value: 25,
        priority: 0,
        is_active: true,
      };

      const errors = validatePricingRule(rule);
      expect(errors).toContain('Start date and end date are required for this rule type');
    });

    it('should validate weekend rule days', () => {
      const rule: PricingRuleFormData = {
        rule_name: 'Weekend Premium',
        rule_type: 'weekend',
        adjustment_type: 'percentage',
        adjustment_value: 20,
        priority: 0,
        is_active: true,
      };

      const errors = validatePricingRule(rule);
      expect(errors).toContain('Days of week are required for weekend rules');
    });

    it('should pass validation for valid rule', () => {
      const rule: PricingRuleFormData = {
        rule_name: 'Summer Season',
        rule_type: 'seasonal',
        start_date: '2024-06-01',
        end_date: '2024-08-31',
        adjustment_type: 'percentage',
        adjustment_value: 25,
        priority: 5,
        is_active: true,
      };

      const errors = validatePricingRule(rule);
      expect(errors).toHaveLength(0);
    });
  });

  describe('formatAdjustmentValue', () => {
    it('should format percentage values', () => {
      expect(formatAdjustmentValue('percentage', 25)).toBe('+25%');
      expect(formatAdjustmentValue('percentage', -15)).toBe('-15%');
    });

    it('should format fixed amount values', () => {
      expect(formatAdjustmentValue('fixed_amount', 50)).toBe('+$50');
      expect(formatAdjustmentValue('fixed_amount', -25)).toBe('-$25');
    });

    it('should format override values', () => {
      expect(formatAdjustmentValue('override', 150)).toBe('$150');
    });
  });

  describe('getDayName', () => {
    it('should return correct day names', () => {
      expect(getDayName(0)).toBe('Sunday');
      expect(getDayName(1)).toBe('Monday');
      expect(getDayName(6)).toBe('Saturday');
      expect(getDayName(7)).toBe('Unknown');
    });
  });
});