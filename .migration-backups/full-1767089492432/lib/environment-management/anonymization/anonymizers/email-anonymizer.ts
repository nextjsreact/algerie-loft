/**
 * Email anonymization implementation
 */

import { BaseAnonymizer } from './base-anonymizer';
import { AnonymizationRule, AnonymizationContext } from '../types';

export class EmailAnonymizer extends BaseAnonymizer {
  private readonly testDomains = [
    'test.local',
    'example.com',
    'demo.local',
    'training.local'
  ];

  anonymize(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): string {
    if (typeof value !== 'string' || !this.isValidEmail(value)) {
      return value;
    }

    const [localPart, domain] = value.split('@');
    
    if (rule.preserveFormat) {
      // Preserve the domain if specified
      const preservedDomain = rule.constraints?.pattern ? domain : this.getRandomTestDomain();
      return `${this.anonymizeLocalPart(localPart, context)}@${preservedDomain}`;
    }

    // Generate completely new email
    const hash = this.generateHash(value, context.tableName);
    const testDomain = this.getRandomTestDomain();
    
    return `user${hash}@${testDomain}`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private anonymizeLocalPart(localPart: string, context: AnonymizationContext): string {
    const hash = this.generateHash(localPart, context.tableName);
    
    // Preserve some characteristics of the original local part
    const isNumeric = /^\d+$/.test(localPart);
    const hasNumbers = /\d/.test(localPart);
    const hasSpecialChars = /[._-]/.test(localPart);

    let anonymized = `user${hash}`;

    if (isNumeric) {
      anonymized = hash.replace(/[a-z]/g, '').padStart(localPart.length, '0');
    } else if (hasNumbers) {
      anonymized = `user${hash.slice(0, 3)}`;
    }

    if (hasSpecialChars && localPart.length > 6) {
      anonymized = anonymized.slice(0, 4) + '.' + anonymized.slice(4);
    }

    return anonymized;
  }

  private getRandomTestDomain(): string {
    // Use a deterministic approach based on current context
    return this.testDomains[0]; // Always use test.local for consistency
  }

  /**
   * Generate email for specific roles (admin, manager, etc.)
   */
  generateRoleBasedEmail(role: string, index: number = 0): string {
    const suffix = index > 0 ? index.toString() : '';
    return `${role}${suffix}@test.local`;
  }

  /**
   * Generate guest email for reservations
   */
  generateGuestEmail(guestName?: string, reservationId?: string): string {
    if (guestName) {
      const cleanName = guestName.toLowerCase().replace(/[^a-z]/g, '');
      const hash = this.generateHash(cleanName);
      return `guest${hash}@test.local`;
    }

    if (reservationId) {
      const hash = this.generateHash(reservationId);
      return `guest${hash}@test.local`;
    }

    return `guest${Date.now()}@test.local`;
  }
}