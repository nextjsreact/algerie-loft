/**
 * Anonymization orchestrator that coordinates all anonymization components
 */

import { CoreAnonymizationEngine } from './core-engine';
import { FakeDataGenerator } from './fake-data-generator';
import { RelationshipManager, RelationalData, ForeignKeyRelationship } from './relationship-manager';
import { AnonymizationRule, AnonymizationReport } from './types';

export interface AnonymizationConfig {
  preserveRelationships: boolean;
  generateRealisticData: boolean;
  customRules?: AnonymizationRule[];
  financialRanges?: {
    [key: string]: { min: number; max: number };
  };
  excludeTables?: string[];
  excludeColumns?: string[];
}

export interface AnonymizationResult {
  success: boolean;
  processedTables: string[];
  reports: AnonymizationReport[];
  relationshipStats?: {
    totalRelationships: number;
    tablesProcessed: number;
    idMappingsCreated: number;
  };
  errors: string[];
  warnings: string[];
  duration: number;
}

export class AnonymizationOrchestrator {
  private coreEngine: CoreAnonymizationEngine;
  private fakeDataGenerator: FakeDataGenerator;
  private relationshipManager: RelationshipManager;

  constructor() {
    this.coreEngine = new CoreAnonymizationEngine();
    this.fakeDataGenerator = new FakeDataGenerator();
    this.relationshipManager = new RelationshipManager();
  }

  /**
   * Anonymize complete dataset with relationship preservation
   */
  async anonymizeDataset(
    relationalData: RelationalData[],
    config: AnonymizationConfig
  ): Promise<AnonymizationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const reports: AnonymizationReport[] = [];
    const processedTables: string[] = [];

    try {
      // Register relationships if preservation is enabled
      if (config.preserveRelationships) {
        const allRelationships = this.extractAllRelationships(relationalData);
        this.relationshipManager.registerRelationships(allRelationships);
      }

      // Generate anonymization rules for each table
      const anonymizationRules = await this.generateAnonymizationRules(relationalData, config);

      // Process data with relationship preservation
      let processedData: RelationalData[];
      
      if (config.preserveRelationships) {
        processedData = await this.relationshipManager.processRelationalData(relationalData);
      } else {
        processedData = relationalData;
      }

      // Apply anonymization to each table
      for (const tableData of processedData) {
        if (config.excludeTables?.includes(tableData.tableName)) {
          continue;
        }

        try {
          const tableRules = anonymizationRules.filter(rule => rule.tableName === tableData.tableName);
          const result = await this.anonymizeTableData(tableData, tableRules, config);
          
          reports.push(result.report);
          processedTables.push(tableData.tableName);
          
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          const errorMessage = `Failed to anonymize table ${tableData.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
        }
      }

      // Validate referential integrity if relationships were preserved
      if (config.preserveRelationships) {
        const validationResult = await this.relationshipManager.validateReferentialIntegrity(processedData);
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        processedTables,
        reports,
        relationshipStats: config.preserveRelationships ? this.relationshipManager.getRelationshipStatistics() : undefined,
        errors,
        warnings,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        processedTables,
        reports,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings,
        duration
      };
    }
  }

  /**
   * Anonymize a single table's data
   */
  private async anonymizeTableData(
    tableData: RelationalData,
    rules: AnonymizationRule[],
    config: AnonymizationConfig
  ): Promise<{
    report: AnonymizationReport;
    errors: string[];
  }> {
    const { tableName, data } = tableData;
    const errors: string[] = [];

    // Filter out excluded columns
    const filteredRules = rules.filter(rule => 
      !config.excludeColumns?.includes(rule.columnName)
    );

    // Use core engine for batch anonymization
    const result = await this.coreEngine.anonymizeBatch(data, filteredRules, tableName);

    // Update the original data with anonymized values
    tableData.data = result.anonymizedData;

    const report: AnonymizationReport = {
      tableName,
      originalRecords: data.length,
      anonymizedRecords: result.report.anonymizedRecords,
      anonymizedFields: result.report.anonymizedFields,
      preservedRelationships: config.preserveRelationships ? 
        this.relationshipManager.getRelationshipStatistics().idMappingsCreated : 0,
      generatedFakeData: result.report.anonymizedRecords,
      errors: result.report.errors
    };

    return { report, errors: result.report.errors };
  }

  /**
   * Generate anonymization rules for all tables
   */
  private async generateAnonymizationRules(
    relationalData: RelationalData[],
    config: AnonymizationConfig
  ): Promise<AnonymizationRule[]> {
    const rules: AnonymizationRule[] = [];

    // Add custom rules if provided
    if (config.customRules) {
      rules.push(...config.customRules);
    }

    // Generate automatic rules based on column names and data types
    for (const tableData of relationalData) {
      const tableRules = await this.generateTableRules(tableData, config);
      rules.push(...tableRules);
    }

    return rules;
  }

  /**
   * Generate anonymization rules for a specific table
   */
  private async generateTableRules(
    tableData: RelationalData,
    config: AnonymizationConfig
  ): Promise<AnonymizationRule[]> {
    const rules: AnonymizationRule[] = [];
    const { tableName, data } = tableData;

    if (data.length === 0) {
      return rules;
    }

    const sampleRecord = data[0];

    for (const [columnName, value] of Object.entries(sampleRecord)) {
      // Skip if column is excluded
      if (config.excludeColumns?.includes(columnName)) {
        continue;
      }

      // Skip primary keys and foreign keys (handled by relationship manager)
      if (this.isPrimaryOrForeignKey(columnName, tableName)) {
        continue;
      }

      const dataType = this.coreEngine.detectDataType(value);
      const suggestedType = this.coreEngine.suggestAnonymizationType(columnName, dataType, value);

      if (suggestedType !== 'custom') {
        const rule: AnonymizationRule = {
          tableName,
          columnName,
          anonymizationType: suggestedType,
          preserveFormat: this.shouldPreserveFormat(columnName, suggestedType),
          constraints: this.generateConstraints(columnName, suggestedType, config)
        };

        rules.push(rule);
      }
    }

    return rules;
  }

  /**
   * Check if column is a primary key or foreign key
   */
  private isPrimaryOrForeignKey(columnName: string, tableName: string): boolean {
    const lowerColumnName = columnName.toLowerCase();
    
    // Common primary key patterns
    if (lowerColumnName === 'id' || lowerColumnName === 'uuid' || lowerColumnName === `${tableName}_id`) {
      return true;
    }

    // Common foreign key patterns
    if (lowerColumnName.endsWith('_id') || lowerColumnName.endsWith('_uuid')) {
      return true;
    }

    return false;
  }

  /**
   * Determine if format should be preserved for a column
   */
  private shouldPreserveFormat(columnName: string, anonymizationType: string): boolean {
    const lowerColumnName = columnName.toLowerCase();

    // Preserve format for certain types
    if (anonymizationType === 'phone' && lowerColumnName.includes('phone')) {
      return true;
    }

    if (anonymizationType === 'email' && lowerColumnName.includes('email')) {
      return false; // Use test domains
    }

    return false;
  }

  /**
   * Generate constraints for anonymization rules
   */
  private generateConstraints(
    columnName: string,
    anonymizationType: string,
    config: AnonymizationConfig
  ): AnonymizationRule['constraints'] {
    const lowerColumnName = columnName.toLowerCase();

    if (anonymizationType === 'financial' && config.financialRanges) {
      // Find matching financial range
      for (const [pattern, range] of Object.entries(config.financialRanges)) {
        if (lowerColumnName.includes(pattern.toLowerCase())) {
          return { range };
        }
      }
    }

    // Default constraints based on type
    switch (anonymizationType) {
      case 'phone':
        return {
          pattern: '^[0-9]{9,10}$',
          minLength: 9,
          maxLength: 10
        };
      
      case 'email':
        return {
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
          minLength: 5,
          maxLength: 100
        };
      
      case 'financial':
        return {
          range: { min: 1000, max: 100000 }
        };
      
      default:
        return undefined;
    }
  }

  /**
   * Extract all relationships from relational data
   */
  private extractAllRelationships(relationalData: RelationalData[]): ForeignKeyRelationship[] {
    const allRelationships: ForeignKeyRelationship[] = [];

    for (const tableData of relationalData) {
      allRelationships.push(...tableData.relationships);
    }

    return allRelationships;
  }

  /**
   * Get predefined relationships for Loft Algérie system
   */
  getLoftAlgerieRelationships(): ForeignKeyRelationship[] {
    return [
      // User relationships
      { sourceTable: 'lofts', sourceColumn: 'owner_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'reservations', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'reservations', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'transactions', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'transactions', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'tasks', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'tasks', sourceColumn: 'assigned_to', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      
      // Team relationships
      { sourceTable: 'team_members', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'team_members', sourceColumn: 'team_id', targetTable: 'teams', targetColumn: 'id', relationshipType: 'many-to-one' },
      
      // Conversation relationships
      { sourceTable: 'conversation_participants', sourceColumn: 'conversation_id', targetTable: 'conversations', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'conversation_participants', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'conversation_messages', sourceColumn: 'conversation_id', targetTable: 'conversations', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'conversation_messages', sourceColumn: 'sender_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      
      // Audit relationships
      { sourceTable: 'audit_logs', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      
      // Notification relationships
      { sourceTable: 'notifications', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', relationshipType: 'many-to-one' },
      { sourceTable: 'bill_notifications', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' },
      
      // Photo relationships
      { sourceTable: 'loft_photos', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' },
      
      // Availability relationships
      { sourceTable: 'availability_calendar', sourceColumn: 'loft_id', targetTable: 'lofts', targetColumn: 'id', relationshipType: 'many-to-one' }
    ];
  }

  /**
   * Reset all components
   */
  reset(): void {
    this.relationshipManager.reset();
  }

  /**
   * Get anonymization statistics
   */
  getStatistics(): {
    relationshipStats: ReturnType<RelationshipManager['getRelationshipStatistics']>;
  } {
    return {
      relationshipStats: this.relationshipManager.getRelationshipStatistics()
    };
  }
}