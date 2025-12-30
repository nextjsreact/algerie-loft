/**
 * Phone number anonymization implementation
 */

import { BaseAnonymizer } from './base-anonymizer';
import { AnonymizationRule, AnonymizationContext } from '../types';

export class PhoneAnonymizer extends BaseAnonymizer {
  // Algerian mobile prefixes
  private readonly algerianMobilePrefixes = [
    '055', '056', '057', '058', '059', // Mobilis
    '066', '067', '068', '069',        // Ooredoo
    '077', '078', '079'                // Djezzy
  ];

  // Algerian landline prefixes by region
  private readonly algerianLandlinePrefixes = [
    '021', '023', '024', '025', '026', '027', '028', '029', // Algiers region
    '031', '032', '033', '034', '035', '036', '037', '038', '039' // Other regions
  ];

  anonymize(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      return value;
    }

    const originalPhone = this.cleanPhoneNumber(value);
    
    if (rule.preserveFormat) {
      return this.preservePhoneFormat(originalPhone, value, context);
    }

    // Generate completely new phone number
    return this.generateRandomPhone(originalPhone, context);
  }

  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }

  private preservePhoneFormat(
    cleanPhone: string, 
    originalFormat: string, 
    context: AnonymizationContext
  ): string {
    const newPhone = this.generateRandomPhone(cleanPhone, context);
    
    // Try to preserve the original formatting
    return this.applyOriginalFormatting(newPhone, originalFormat);
  }

  private generateRandomPhone(originalPhone: string, context: AnonymizationContext): string {
    const hash = this.generateHash(originalPhone, context.tableName);
    
    // Determine if it's mobile or landline based on original
    const isMobile = this.isMobileNumber(originalPhone);
    const isInternational = originalPhone.startsWith('+213') || originalPhone.startsWith('213');
    
    let newPhone: string;
    
    if (isMobile) {
      newPhone = this.generateMobileNumber(hash);
    } else {
      newPhone = this.generateLandlineNumber(hash);
    }

    // Add international prefix if original had it
    if (isInternational) {
      if (originalPhone.startsWith('+')) {
        newPhone = `+213${newPhone}`;
      } else {
        newPhone = `213${newPhone}`;
      }
    }

    return newPhone;
  }

  private isMobileNumber(phone: string): boolean {
    // Remove country code if present
    const localPhone = phone.replace(/^(\+213|213)/, '');
    
    // Check if starts with mobile prefix
    return this.algerianMobilePrefixes.some(prefix => 
      localPhone.startsWith(prefix)
    );
  }

  private generateMobileNumber(hash: string): string {
    const prefixIndex = parseInt(hash.slice(0, 1), 36) % this.algerianMobilePrefixes.length;
    const prefix = this.algerianMobilePrefixes[prefixIndex];
    
    // Generate 6 remaining digits
    const remainingDigits = this.generateDigitsFromHash(hash.slice(1), 6);
    
    return `${prefix}${remainingDigits}`;
  }

  private generateLandlineNumber(hash: string): string {
    const prefixIndex = parseInt(hash.slice(0, 1), 36) % this.algerianLandlinePrefixes.length;
    const prefix = this.algerianLandlinePrefixes[prefixIndex];
    
    // Generate 6 remaining digits
    const remainingDigits = this.generateDigitsFromHash(hash.slice(1), 6);
    
    return `${prefix}${remainingDigits}`;
  }

  private generateDigitsFromHash(hash: string, count: number): string {
    let digits = '';
    let hashIndex = 0;
    
    for (let i = 0; i < count; i++) {
      if (hashIndex >= hash.length) {
        hashIndex = 0;
      }
      
      const char = hash[hashIndex];
      const digit = parseInt(char, 36) % 10;
      digits += digit.toString();
      hashIndex++;
    }
    
    return digits;
  }

  private applyOriginalFormatting(newPhone: string, originalFormat: string): string {
    // Simple formatting preservation
    if (originalFormat.includes('-')) {
      // Format like: 055-123-456
      if (newPhone.length >= 9) {
        return `${newPhone.slice(0, 3)}-${newPhone.slice(3, 6)}-${newPhone.slice(6)}`;
      }
    }
    
    if (originalFormat.includes(' ')) {
      // Format like: 055 123 456
      if (newPhone.length >= 9) {
        return `${newPhone.slice(0, 3)} ${newPhone.slice(3, 6)} ${newPhone.slice(6)}`;
      }
    }
    
    if (originalFormat.includes('.')) {
      // Format like: 055.123.456
      if (newPhone.length >= 9) {
        return `${newPhone.slice(0, 3)}.${newPhone.slice(3, 6)}.${newPhone.slice(6)}`;
      }
    }

    // Return without formatting if no pattern detected
    return newPhone;
  }

  /**
   * Generate phone number for specific roles
   */
  generateRolePhone(role: string, index: number = 0): string {
    const baseNumbers = {
      admin: '0551234567',
      manager: '0661234567', 
      member: '0771234567',
      guest: '0211234567'
    };

    const baseNumber = baseNumbers[role as keyof typeof baseNumbers] || baseNumbers.member;
    
    // Modify last digits based on index
    if (index > 0) {
      const lastDigits = (parseInt(baseNumber.slice(-2)) + index).toString().padStart(2, '0');
      return baseNumber.slice(0, -2) + lastDigits;
    }

    return baseNumber;
  }

  /**
   * Generate guest phone for reservations
   */
  generateGuestPhone(guestName?: string, reservationId?: string): string {
    let seed = 'guest';
    
    if (guestName) {
      seed = guestName;
    } else if (reservationId) {
      seed = reservationId;
    }

    const hash = this.generateHash(seed, 'guest-phone');
    return this.generateMobileNumber(hash);
  }

  /**
   * Validate Algerian phone number format
   */
  isValidAlgerianPhone(phone: string): boolean {
    const cleanPhone = this.cleanPhoneNumber(phone);
    
    // Remove international prefix
    const localPhone = cleanPhone.replace(/^(\+213|213)/, '');
    
    // Should be 9 digits
    if (localPhone.length !== 9) {
      return false;
    }

    // Should start with valid prefix
    const hasValidPrefix = [
      ...this.algerianMobilePrefixes,
      ...this.algerianLandlinePrefixes
    ].some(prefix => localPhone.startsWith(prefix));

    return hasValidPrefix;
  }
}