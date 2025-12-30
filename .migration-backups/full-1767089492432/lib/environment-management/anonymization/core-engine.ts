/**
 * Core anonymization engine for processing sensitive data
 */

import { 
  AnonymizationRule, 
  AnonymizationContext, 
  AnonymizationResult,
  AnonymizationType,
  DataType 
} from './types';
import { EmailAnonymizer } from './anonymizers/email-anonymizer';
import { NameAnonymizer } from './anonymizers/name-anonymizer';
import { PhoneAnonymizer } from './anonymizers/phone-anonymizer';
import { AddressAnonymizer } from './anonymizers/address-anonymizer';
import { FinancialAnonymizer } from './anonymizers/financial-anonymizer';

export class CoreAnonymizationEngine {
  private emailAnonymizer: EmailAnonymizer;
  private nameAnonymizer: NameAnonymizer;
  private phoneAnonymizer: PhoneAnonymizer;
  private addressAnonymizer: AddressAnonymizer;
  private financialAnonymizer: FinancialAnonymizer;

  constructor() {
    this.emailAnonymizer = new EmailAnonymizer();
    this.nameAnonymizer = new NameAnonymizer();
    this.phoneAnonymizer = new PhoneAnonymizer();
    this.addressAnonymizer = new AddressAnonymizer();
    this.financialAnonymizer = new FinancialAnonymizer();
  }

  /**
   * Anonymize a single value based on the provided rule
   */
  async anonymizeValue(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): Promise<AnonymizationResult> {
    if (value === null || value === undefined) {
      return {
        anonymizedValue: value,
        wasAnonymized: false,
        preservedFormat: true
      };
    }

    try {
      const anonymizedValue = await this.applyAnonymization(value, rule, context);
      
      return {
        anonymizedValue,
        wasAnonymized: true,
        preservedFormat: rule.preserveFormat || false,
        metadata: {
          originalType: typeof value,
          anonymizationType: rule.anonymizationType,
          tableName: rule.tableName,
          columnName: rule.columnName
        }
      };
    } catch (error) {
      console.error(`Anonymization failed for ${rule.tableName}.${rule.columnName}:`, error);
      
      // Return original value if anonymization fails
      return {
        anonymizedValue: value,
        wasAnonymized: false,
        preservedFormat: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Apply anonymization based on the rule type
   */
  private async applyAnonymization(
    value: any, 
    rule: AnonymizationRule, 
    context: AnonymizationContext
  ): Promise<any> {
    switch (rule.anonymizationType) {
      case 'email':
        return this.emailAnonymizer.anonymize(value, rule, context);
      
      case 'name':
        return this.nameAnonymizer.anonymize(value, rule, context);
      
      case 'phone':
        return this.phoneAnonymizer.anonymize(value, rule, context);
      
      case 'address':
        return this.addressAnonymizer.anonymize(value, rule, context);
      
      case 'financial':
        return this.financialAnonymizer.anonymize(value, rule, context);
      
      case 'custom':
        if (rule.customGenerator) {
          return rule.customGenerator(value);
        }
        throw new Error(`Custom anonymization rule requires customGenerator function`);
      
      default:
        throw new Error(`Unsupported anonymization type: ${rule.anonymizationType}`);
    }
  }

  /**
   * Detect the data type of a value
   */
  detectDataType(value: any): DataType {
    if (value === null || value === undefined) {
      return 'string'; // Default fallback
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (value instanceof Date) {
      return 'date';
    }

    if (typeof value === 'string') {
      // Check for UUID pattern
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(value)) {
        return 'uuid';
      }

      // Check for date string
      if (!isNaN(Date.parse(value))) {
        return 'date';
      }

      return 'string';
    }

    if (typeof value === 'object') {
      return 'json';
    }

    return 'string'; // Default fallback
  }

  /**
   * Determine appropriate anonymization type based on column name and data type
   */
  suggestAnonymizationType(columnName: string, dataType: DataType, sampleValue?: any): AnonymizationType {
    const lowerColumnName = columnName.toLowerCase();

    // Email detection
    if (lowerColumnName.includes('email') || lowerColumnName.includes('mail')) {
      return 'email';
    }

    // Name detection
    if (lowerColumnName.includes('name') || 
        lowerColumnName.includes('first_name') || 
        lowerColumnName.includes('last_name') ||
        lowerColumnName.includes('full_name')) {
      return 'name';
    }

    // Phone detection
    if (lowerColumnName.includes('phone') || 
        lowerColumnName.includes('tel') || 
        lowerColumnName.includes('mobile')) {
      return 'phone';
    }

    // Address detection
    if (lowerColumnName.includes('address') || 
        lowerColumnName.includes('street') || 
        lowerColumnName.includes('city') ||
        lowerColumnName.includes('location')) {
      return 'address';
    }

    // Financial detection
    if (lowerColumnName.includes('amount') || 
        lowerColumnName.includes('price') || 
        lowerColumnName.includes('cost') ||
        lowerColumnName.includes('payment') ||
        lowerColumnName.includes('salary')) {
      return 'financial';
    }

    // Default to custom for manual handling
    return 'custom';
  }

  /**
   * Process a batch of data with anonymization rules
   */
  async anonymizeBatch(
    data: Record<string, any>[], 
    rules: AnonymizationRule[], 
    tableName: string
  ): Promise<{
    anonymizedData: Record<string, any>[];
    report: {
      totalRecords: number;
      anonymizedRecords: number;
      anonymizedFields: string[];
      errors: string[];
    };
  }> {
    const anonymizedData: Record<string, any>[] = [];
    const errors: string[] = [];
    const anonymizedFields = new Set<string>();
    let anonymizedRecords = 0;

    for (const row of data) {
      const anonymizedRow = { ...row };
      let rowWasAnonymized = false;

      for (const rule of rules) {
        if (rule.tableName === tableName && row.hasOwnProperty(rule.columnName)) {
          const context: AnonymizationContext = {
            tableName,
            columnName: rule.columnName,
            originalValue: row[rule.columnName],
            rowData: row,
            preserveRelationships: true
          };

          const result = await this.anonymizeValue(row[rule.columnName], rule, context);
          
          if (result.wasAnonymized) {
            anonymizedRow[rule.columnName] = result.anonymizedValue;
            anonymizedFields.add(rule.columnName);
            rowWasAnonymized = true;
          }

          if (result.metadata?.error) {
            errors.push(`${tableName}.${rule.columnName}: ${result.metadata.error}`);
          }
        }
      }

      if (rowWasAnonymized) {
        anonymizedRecords++;
      }

      anonymizedData.push(anonymizedRow);
    }

    return {
      anonymizedData,
      report: {
        totalRecords: data.length,
        anonymizedRecords,
        anonymizedFields: Array.from(anonymizedFields),
        errors
      }
    };
  }
}