/**
 * Name anonymization implementation
 */

import { BaseAnonymizer } from './base-anonymizer';
import { AnonymizationRule, AnonymizationContext } from '../types';

export class NameAnonymizer extends BaseAnonymizer {
  private readonly firstNames = [
    'Ahmed', 'Fatima', 'Mohamed', 'Aicha', 'Omar', 'Khadija', 'Ali', 'Amina',
    'Youssef', 'Zahra', 'Hassan', 'Nadia', 'Karim', 'Leila', 'Rachid', 'Samira',
    'Mehdi', 'Salma', 'Tarek', 'Yasmine', 'Samir', 'Houda', 'Bilal', 'Rim'
  ];

  private readonly lastNames = [
    'Benali', 'Benaissa', 'Boumediene', 'Cherif', 'Djelloul', 'Ferhat', 'Ghali',
    'Hamidi', 'Kaci', 'Larbi', 'Mansouri', 'Naceri', 'Ouali', 'Rahmani',
    'Saidi', 'Tebboune', 'Yahiaoui', 'Zeroual', 'Amrani', 'Belkacem'
  ];

  anonymize(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      return value;
    }

    const originalName = value.trim();
    
    if (rule.preserveFormat) {
      return this.preserveNameStructure(originalName, context);
    }

    // Generate completely new name
    return this.generateRandomName(originalName, context);
  }

  private preserveNameStructure(originalName: string, context: AnonymizationContext): string {
    const parts = originalName.split(/\s+/);
    
    if (parts.length === 1) {
      // Single name - could be first or last
      return this.getConsistentName(originalName, 'first', context);
    }

    if (parts.length === 2) {
      // First and last name
      const firstName = this.getConsistentName(parts[0], 'first', context);
      const lastName = this.getConsistentName(parts[1], 'last', context);
      return `${firstName} ${lastName}`;
    }

    // Multiple names - preserve structure
    const anonymizedParts = parts.map((part, index) => {
      const type = index === 0 ? 'first' : 'last';
      return this.getConsistentName(part, type, context);
    });

    return anonymizedParts.join(' ');
  }

  private generateRandomName(originalName: string, context: AnonymizationContext): string {
    const hash = this.generateHash(originalName, context.tableName);
    const firstIndex = parseInt(hash.slice(0, 2), 36) % this.firstNames.length;
    const lastIndex = parseInt(hash.slice(2, 4), 36) % this.lastNames.length;

    return `${this.firstNames[firstIndex]} ${this.lastNames[lastIndex]}`;
  }

  private getConsistentName(
    originalPart: string, 
    type: 'first' | 'last', 
    context: AnonymizationContext
  ): string {
    const hash = this.generateHash(originalPart, `${context.tableName}-${type}`);
    const names = type === 'first' ? this.firstNames : this.lastNames;
    const index = parseInt(hash.slice(0, 2), 36) % names.length;
    
    return names[index];
  }

  /**
   * Generate name for specific roles
   */
  generateRoleName(role: string, index: number = 0): string {
    const roleNames = {
      admin: ['Admin User', 'System Administrator', 'Super Admin'],
      manager: ['Manager User', 'Team Manager', 'Project Manager'],
      member: ['Team Member', 'Regular User', 'Staff Member'],
      guest: ['Guest User', 'Visitor', 'External User']
    };

    const names = roleNames[role as keyof typeof roleNames] || roleNames.member;
    return names[index % names.length];
  }

  /**
   * Generate guest name for reservations
   */
  generateGuestName(originalName?: string): string {
    if (originalName) {
      const hash = this.generateHash(originalName, 'guest');
      const firstIndex = parseInt(hash.slice(0, 2), 36) % this.firstNames.length;
      const lastIndex = parseInt(hash.slice(2, 4), 36) % this.lastNames.length;
      return `${this.firstNames[firstIndex]} ${this.lastNames[lastIndex]}`;
    }

    // Generate random guest name
    const randomFirst = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    const randomLast = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    return `${randomFirst} ${randomLast}`;
  }

  /**
   * Anonymize company or organization names
   */
  anonymizeCompanyName(originalName: string, context: AnonymizationContext): string {
    const companyTypes = ['SARL', 'SPA', 'EURL', 'SNC', 'SCS'];
    const businessWords = ['Tech', 'Solutions', 'Services', 'Group', 'Company', 'Enterprise'];
    
    const hash = this.generateHash(originalName, context.tableName);
    const typeIndex = parseInt(hash.slice(0, 1), 36) % companyTypes.length;
    const wordIndex = parseInt(hash.slice(1, 2), 36) % businessWords.length;
    
    return `${businessWords[wordIndex]} ${companyTypes[typeIndex]}`;
  }
}