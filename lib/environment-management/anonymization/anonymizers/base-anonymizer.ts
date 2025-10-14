/**
 * Base class for all anonymizers
 */

import { AnonymizationRule, AnonymizationContext } from '../types';

export abstract class BaseAnonymizer {
  /**
   * Abstract method that each anonymizer must implement
   */
  abstract anonymize(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): Promise<any> | any;

  /**
   * Generate a consistent hash for a value to ensure same input produces same output
   */
  protected generateHash(value: string, seed?: string): string {
    let hash = 0;
    const input = seed ? `${seed}-${value}` : value;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Preserve the format of the original value
   */
  protected preserveFormat(original: string, replacement: string, pattern?: string): string {
    if (!pattern) {
      return replacement;
    }

    // Simple format preservation - can be extended
    if (pattern.includes('@') && original.includes('@')) {
      // Email format
      const [, domain] = original.split('@');
      const [newLocal] = replacement.split('@');
      return `${newLocal}@${domain}`;
    }

    return replacement;
  }

  /**
   * Validate that the anonymized value meets constraints
   */
  protected validateConstraints(value: any, rule: AnonymizationRule): boolean {
    if (!rule.constraints) {
      return true;
    }

    const { minLength, maxLength, pattern, range } = rule.constraints;

    if (typeof value === 'string') {
      if (minLength && value.length < minLength) return false;
      if (maxLength && value.length > maxLength) return false;
      if (pattern && !new RegExp(pattern).test(value)) return false;
    }

    if (typeof value === 'number' && range) {
      if (value < range.min || value > range.max) return false;
    }

    return true;
  }
}