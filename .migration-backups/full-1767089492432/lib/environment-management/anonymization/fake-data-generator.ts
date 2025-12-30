/**
 * Fake data generation system for realistic test data
 */

import { faker } from '@faker-js/faker';
import { AnonymizationRule, AnonymizationContext } from './types';

export interface FakeDataOptions {
  locale?: string;
  preserveFormat?: boolean;
  contextAware?: boolean;
  financialRanges?: {
    min: number;
    max: number;
    currency?: string;
  };
}

export class FakeDataGenerator {
  constructor() {
    // Set locale to French for more appropriate names and addresses
    faker.setLocale('fr');
  }

  /**
   * Generate fake data based on data type and context
   */
  generateFakeData(
    dataType: string,
    originalValue: any,
    context: AnonymizationContext,
    options: FakeDataOptions = {}
  ): any {
    const columnName = context.columnName.toLowerCase();

    // Context-aware generation based on column name
    if (options.contextAware) {
      return this.generateContextAwareData(columnName, originalValue, context, options);
    }

    // Basic type-based generation
    return this.generateByType(dataType, originalValue, options);
  }

  /**
   * Generate context-aware fake data based on column names and patterns
   */
  private generateContextAwareData(
    columnName: string,
    originalValue: any,
    context: AnonymizationContext,
    options: FakeDataOptions
  ): any {
    // Email patterns
    if (columnName.includes('email') || columnName.includes('mail')) {
      return this.generateEmail(originalValue, context);
    }

    // Name patterns
    if (columnName.includes('name') || columnName.includes('nom')) {
      return this.generateName(columnName, originalValue);
    }

    // Phone patterns
    if (columnName.includes('phone') || columnName.includes('tel') || columnName.includes('mobile')) {
      return this.generatePhone(originalValue, options);
    }

    // Address patterns
    if (columnName.includes('address') || columnName.includes('adresse') || columnName.includes('street')) {
      return this.generateAddress(originalValue, options);
    }

    // Financial patterns
    if (columnName.includes('amount') || columnName.includes('price') || columnName.includes('cost') || 
        columnName.includes('montant') || columnName.includes('prix')) {
      return this.generateFinancialAmount(originalValue, options);
    }

    // Date patterns
    if (columnName.includes('date') || columnName.includes('time') || columnName.includes('created') || 
        columnName.includes('updated')) {
      return this.generateDate(originalValue, columnName);
    }

    // Company/Organization patterns
    if (columnName.includes('company') || columnName.includes('organization') || columnName.includes('entreprise')) {
      return this.generateCompanyName();
    }

    // Description/Comment patterns
    if (columnName.includes('description') || columnName.includes('comment') || columnName.includes('note')) {
      return this.generateDescription(originalValue);
    }

    // Default fallback
    return this.generateByType(typeof originalValue, originalValue, options);
  }

  /**
   * Generate fake data by basic type
   */
  private generateByType(dataType: string, originalValue: any, options: FakeDataOptions): any {
    switch (dataType) {
      case 'string':
        return faker.lorem.words(3);
      case 'number':
        return faker.datatype.number({ min: 1, max: 1000 });
      case 'boolean':
        return faker.datatype.boolean();
      case 'date':
        return faker.date.recent();
      default:
        return originalValue;
    }
  }

  /**
   * Generate realistic email addresses
   */
  private generateEmail(originalValue: string, context: AnonymizationContext): string {
    const domains = ['test.local', 'example.com', 'demo.local', 'training.local'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    // Generate consistent email based on context
    const hash = this.generateSimpleHash(originalValue + context.tableName);
    return `user${hash}@${domain}`;
  }

  /**
   * Generate realistic names based on context
   */
  private generateName(columnName: string, originalValue: string): string {
    if (columnName.includes('first') || columnName.includes('prenom')) {
      return faker.name.firstName();
    }
    
    if (columnName.includes('last') || columnName.includes('nom')) {
      return faker.name.lastName();
    }
    
    if (columnName.includes('full') || columnName.includes('complet')) {
      return faker.name.fullName();
    }

    // Default to full name
    return faker.name.fullName();
  }

  /**
   * Generate realistic phone numbers
   */
  private generatePhone(originalValue: string, options: FakeDataOptions): string {
    // Algerian mobile prefixes
    const mobilePrefixes = ['055', '056', '057', '066', '067', '077', '078'];
    const prefix = mobilePrefixes[Math.floor(Math.random() * mobilePrefixes.length)];
    
    // Generate 6 remaining digits
    const remainingDigits = faker.datatype.number({ min: 100000, max: 999999 }).toString();
    
    const phone = `${prefix}${remainingDigits}`;
    
    // Preserve formatting if requested
    if (options.preserveFormat && typeof originalValue === 'string') {
      return this.preservePhoneFormat(phone, originalValue);
    }
    
    return phone;
  }

  /**
   * Generate realistic addresses
   */
  private generateAddress(originalValue: string, options: FakeDataOptions): string {
    const algerianCities = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif'];
    const streetTypes = ['Rue', 'Avenue', 'Boulevard', 'Place'];
    const streetNames = ['1er Novembre', 'Didouche Mourad', 'Emir Abdelkader', 'Ahmed Zabana'];
    
    const number = faker.datatype.number({ min: 1, max: 999 });
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const city = algerianCities[Math.floor(Math.random() * algerianCities.length)];
    
    return `${number} ${streetType} ${streetName}, ${city}`;
  }

  /**
   * Generate realistic financial amounts
   */
  private generateFinancialAmount(originalValue: any, options: FakeDataOptions): number {
    const ranges = options.financialRanges;
    
    if (ranges) {
      return faker.datatype.number({ min: ranges.min, max: ranges.max });
    }

    // Determine range based on original value
    if (typeof originalValue === 'number') {
      const magnitude = Math.abs(originalValue);
      
      if (magnitude < 100) {
        return faker.datatype.number({ min: 10, max: 100 });
      } else if (magnitude < 1000) {
        return faker.datatype.number({ min: 100, max: 1000 });
      } else if (magnitude < 10000) {
        return faker.datatype.number({ min: 1000, max: 10000 });
      } else {
        return faker.datatype.number({ min: 10000, max: 100000 });
      }
    }

    // Default range
    return faker.datatype.number({ min: 100, max: 10000 });
  }

  /**
   * Generate realistic dates
   */
  private generateDate(originalValue: any, columnName: string): Date {
    if (columnName.includes('created') || columnName.includes('cree')) {
      return faker.date.past(2); // Within last 2 years
    }
    
    if (columnName.includes('updated') || columnName.includes('modifie')) {
      return faker.date.recent(30); // Within last 30 days
    }
    
    if (columnName.includes('birth') || columnName.includes('naissance')) {
      return faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
    }
    
    if (columnName.includes('due') || columnName.includes('echeance')) {
      return faker.date.future(1); // Within next year
    }

    // Default to recent date
    return faker.date.recent(90);
  }

  /**
   * Generate company names
   */
  private generateCompanyName(): string {
    const companyTypes = ['SARL', 'SPA', 'EURL', 'SNC'];
    const businessWords = ['Tech', 'Solutions', 'Services', 'Group', 'Consulting'];
    
    const word = businessWords[Math.floor(Math.random() * businessWords.length)];
    const type = companyTypes[Math.floor(Math.random() * companyTypes.length)];
    
    return `${word} ${type}`;
  }

  /**
   * Generate descriptions and comments
   */
  private generateDescription(originalValue: string): string {
    if (typeof originalValue === 'string') {
      const wordCount = originalValue.split(' ').length;
      return faker.lorem.words(Math.min(wordCount, 10));
    }
    
    return faker.lorem.sentence();
  }

  /**
   * Generate financial data with realistic ranges and patterns
   */
  generateFinancialData(context: {
    type: 'rent' | 'deposit' | 'fee' | 'utility' | 'maintenance' | 'other';
    currency?: string;
    originalAmount?: number;
  }): number {
    const { type, originalAmount } = context;
    
    const ranges = {
      rent: { min: 15000, max: 80000 },      // DZD monthly rent
      deposit: { min: 30000, max: 160000 },  // DZD security deposit
      fee: { min: 1000, max: 10000 },        // DZD various fees
      utility: { min: 2000, max: 15000 },    // DZD utilities
      maintenance: { min: 5000, max: 25000 }, // DZD maintenance
      other: { min: 1000, max: 50000 }       // DZD other expenses
    };

    const range = ranges[type];
    
    // If we have original amount, generate within similar magnitude
    if (originalAmount && originalAmount > 0) {
      const magnitude = Math.floor(Math.log10(originalAmount));
      const factor = Math.pow(10, magnitude);
      return faker.datatype.number({ 
        min: Math.max(factor, range.min), 
        max: Math.min(factor * 10, range.max) 
      });
    }

    return faker.datatype.number(range);
  }

  /**
   * Generate reservation-specific fake data
   */
  generateReservationData(field: string, originalValue: any): any {
    switch (field) {
      case 'guest_name':
        return faker.name.fullName();
      
      case 'guest_email':
        return `guest${faker.datatype.number({ min: 1000, max: 9999 })}@test.local`;
      
      case 'guest_phone':
        const mobilePrefixes = ['055', '066', '077'];
        const prefix = mobilePrefixes[Math.floor(Math.random() * mobilePrefixes.length)];
        return `${prefix}${faker.datatype.number({ min: 100000, max: 999999 })}`;
      
      case 'check_in_date':
        return faker.date.future(0.5); // Within next 6 months
      
      case 'check_out_date':
        const checkIn = faker.date.future(0.5);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + faker.datatype.number({ min: 1, max: 14 }));
        return checkOut;
      
      case 'total_amount':
        return faker.datatype.number({ min: 5000, max: 50000 });
      
      case 'notes':
        return faker.lorem.sentence();
      
      default:
        return originalValue;
    }
  }

  /**
   * Generate conversation-specific fake data
   */
  generateConversationData(field: string, originalValue: any): any {
    switch (field) {
      case 'title':
        const topics = ['Maintenance Request', 'Payment Issue', 'General Inquiry', 'Booking Question'];
        return topics[Math.floor(Math.random() * topics.length)];
      
      case 'message_content':
        return faker.lorem.sentences(faker.datatype.number({ min: 1, max: 3 }));
      
      case 'participant_name':
        return faker.name.fullName();
      
      case 'participant_email':
        return `participant${faker.datatype.number({ min: 100, max: 999 })}@test.local`;
      
      default:
        return originalValue;
    }
  }

  /**
   * Utility methods
   */
  private generateSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 6);
  }

  private preservePhoneFormat(newPhone: string, originalFormat: string): string {
    if (originalFormat.includes('-')) {
      return `${newPhone.slice(0, 3)}-${newPhone.slice(3, 6)}-${newPhone.slice(6)}`;
    }
    
    if (originalFormat.includes(' ')) {
      return `${newPhone.slice(0, 3)} ${newPhone.slice(3, 6)} ${newPhone.slice(6)}`;
    }
    
    return newPhone;
  }

  /**
   * Generate batch of fake data for testing
   */
  generateBatchData(count: number, template: Record<string, any>): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    
    for (let i = 0; i < count; i++) {
      const record: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(template)) {
        const context: AnonymizationContext = {
          tableName: 'batch_generation',
          columnName: key,
          originalValue: value,
          rowData: template,
          preserveRelationships: false
        };
        
        record[key] = this.generateFakeData(typeof value, value, context, { contextAware: true });
      }
      
      results.push(record);
    }
    
    return results;
  }
}