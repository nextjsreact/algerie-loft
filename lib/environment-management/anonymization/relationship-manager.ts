/**
 * Relationship preservation system for maintaining referential integrity during anonymization
 */

export interface ForeignKeyRelationship {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  cascadeDelete?: boolean;
}

export interface RelationshipMapping {
  originalValue: any;
  anonymizedValue: any;
  tableName: string;
  columnName: string;
  relatedMappings: Map<string, any>; // table.column -> anonymized value
}

export interface RelationalData {
  tableName: string;
  data: Record<string, any>[];
  relationships: ForeignKeyRelationship[];
}

export class RelationshipManager {
  private idMappings: Map<string, Map<any, any>> = new Map();
  private relationships: ForeignKeyRelationship[] = [];
  private processedTables: Set<string> = new Set();

  /**
   * Register foreign key relationships
   */
  registerRelationships(relationships: ForeignKeyRelationship[]): void {
    this.relationships = [...this.relationships, ...relationships];
  }

  /**
   * Create ID mapping for a table to maintain consistency
   */
  createIdMapping(tableName: string, column: string, originalIds: any[]): Map<any, any> {
    const mappingKey = `${tableName}.${column}`;
    const mapping = new Map<any, any>();

    for (const originalId of originalIds) {
      if (originalId !== null && originalId !== undefined) {
        const anonymizedId = this.generateConsistentId(originalId, mappingKey);
        mapping.set(originalId, anonymizedId);
      }
    }

    this.idMappings.set(mappingKey, mapping);
    return mapping;
  }

  /**
   * Get anonymized value for a foreign key reference
   */
  getAnonymizedReference(
    originalValue: any, 
    sourceTable: string, 
    sourceColumn: string
  ): any {
    if (originalValue === null || originalValue === undefined) {
      return originalValue;
    }

    // Find the target table and column for this foreign key
    const relationship = this.relationships.find(rel => 
      rel.sourceTable === sourceTable && rel.sourceColumn === sourceColumn
    );

    if (!relationship) {
      // No relationship defined, return original value or generate new one
      return this.generateConsistentId(originalValue, `${sourceTable}.${sourceColumn}`);
    }

    const targetMappingKey = `${relationship.targetTable}.${relationship.targetColumn}`;
    const targetMapping = this.idMappings.get(targetMappingKey);

    if (targetMapping && targetMapping.has(originalValue)) {
      return targetMapping.get(originalValue);
    }

    // If no mapping exists, create a consistent ID
    return this.generateConsistentId(originalValue, targetMappingKey);
  }

  /**
   * Process relational data while preserving relationships
   */
  async processRelationalData(relationalData: RelationalData[]): Promise<RelationalData[]> {
    // Sort tables by dependency order (parents first)
    const sortedData = this.sortByDependencies(relationalData);
    const processedData: RelationalData[] = [];

    for (const tableData of sortedData) {
      const processedTableData = await this.processTableData(tableData);
      processedData.push(processedTableData);
      this.processedTables.add(tableData.tableName);
    }

    return processedData;
  }

  /**
   * Process a single table's data while maintaining relationships
   */
  private async processTableData(tableData: RelationalData): Promise<RelationalData> {
    const { tableName, data, relationships } = tableData;
    const processedData: Record<string, any>[] = [];

    // First pass: create ID mappings for primary keys
    await this.createPrimaryKeyMappings(tableName, data);

    // Second pass: process each record
    for (const record of data) {
      const processedRecord = { ...record };

      // Process foreign key references
      for (const relationship of relationships) {
        if (relationship.sourceTable === tableName) {
          const originalValue = record[relationship.sourceColumn];
          const anonymizedValue = this.getAnonymizedReference(
            originalValue, 
            relationship.sourceTable, 
            relationship.sourceColumn
          );
          processedRecord[relationship.sourceColumn] = anonymizedValue;
        }
      }

      processedData.push(processedRecord);
    }

    return {
      tableName,
      data: processedData,
      relationships
    };
  }

  /**
   * Create primary key mappings for a table
   */
  private async createPrimaryKeyMappings(tableName: string, data: Record<string, any>[]): Promise<void> {
    const primaryKeyColumns = this.getPrimaryKeyColumns(tableName);
    
    for (const pkColumn of primaryKeyColumns) {
      const originalIds = data.map(record => record[pkColumn]).filter(id => id !== null && id !== undefined);
      if (originalIds.length > 0) {
        this.createIdMapping(tableName, pkColumn, originalIds);
      }
    }
  }

  /**
   * Get primary key columns for a table
   */
  private getPrimaryKeyColumns(tableName: string): string[] {
    // Common primary key patterns
    const commonPkColumns = ['id', 'uuid', `${tableName}_id`];
    
    // For specific tables in the Loft Algérie system
    const tablePkMap: Record<string, string[]> = {
      'users': ['id'],
      'lofts': ['id'],
      'reservations': ['id'],
      'transactions': ['id'],
      'tasks': ['id'],
      'conversations': ['id'],
      'conversation_participants': ['id'],
      'conversation_messages': ['id'],
      'audit_logs': ['id'],
      'notifications': ['id'],
      'teams': ['id'],
      'team_members': ['user_id', 'team_id'], // Composite key
      'loft_photos': ['id'],
      'availability_calendar': ['id'],
      'bill_notifications': ['id'],
      'transaction_reference_amounts': ['id']
    };

    return tablePkMap[tableName] || ['id'];
  }

  /**
   * Sort tables by dependency order (parents before children)
   */
  private sortByDependencies(relationalData: RelationalData[]): RelationalData[] {
    const tableMap = new Map(relationalData.map(data => [data.tableName, data]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: RelationalData[] = [];

    const visit = (tableName: string) => {
      if (visited.has(tableName)) return;
      if (visiting.has(tableName)) {
        // Circular dependency detected, continue anyway
        return;
      }

      visiting.add(tableName);

      // Visit all parent tables first
      const tableData = tableMap.get(tableName);
      if (tableData) {
        for (const relationship of tableData.relationships) {
          if (relationship.sourceTable === tableName) {
            // This table references another table, visit the target first
            visit(relationship.targetTable);
          }
        }
      }

      visiting.delete(tableName);
      visited.add(tableName);
      
      if (tableData) {
        sorted.push(tableData);
      }
    };

    for (const data of relationalData) {
      visit(data.tableName);
    }

    return sorted;
  }

  /**
   * Generate consistent ID based on original value
   */
  private generateConsistentId(originalValue: any, context: string): any {
    if (typeof originalValue === 'string') {
      // For UUID strings, generate new UUID-like string
      if (this.isUUID(originalValue)) {
        return this.generateConsistentUUID(originalValue, context);
      }
      // For other strings, generate hash-based string
      return this.generateHashedString(originalValue, context);
    }

    if (typeof originalValue === 'number') {
      return this.generateConsistentNumber(originalValue, context);
    }

    return originalValue;
  }

  /**
   * Check if string is UUID format
   */
  private isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Generate consistent UUID-like string
   */
  private generateConsistentUUID(originalUUID: string, context: string): string {
    const hash = this.generateHash(originalUUID + context);
    
    // Format as UUID
    return [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '4' + hash.slice(13, 16), // Version 4 UUID
      '8' + hash.slice(17, 20), // Variant bits
      hash.slice(20, 32)
    ].join('-');
  }

  /**
   * Generate consistent number
   */
  private generateConsistentNumber(originalNumber: number, context: string): number {
    const hash = this.generateHash(originalNumber.toString() + context);
    const hashNumber = parseInt(hash.slice(0, 8), 16);
    
    // Maintain similar magnitude
    const magnitude = Math.floor(Math.log10(Math.abs(originalNumber)));
    const factor = Math.pow(10, magnitude);
    
    return Math.floor((hashNumber % (factor * 9)) + factor);
  }

  /**
   * Generate hashed string
   */
  private generateHashedString(originalString: string, context: string): string {
    const hash = this.generateHash(originalString + context);
    return `anon_${hash.slice(0, 8)}`;
  }

  /**
   * Generate hash from string
   */
  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex and pad
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).slice(0, 32);
  }

  /**
   * Validate referential integrity after anonymization
   */
  async validateReferentialIntegrity(processedData: RelationalData[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const tableData of processedData) {
      for (const relationship of this.relationships) {
        if (relationship.sourceTable === tableData.tableName) {
          const validationResult = await this.validateRelationship(tableData, relationship, processedData);
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a specific relationship
   */
  private async validateRelationship(
    sourceTableData: RelationalData,
    relationship: ForeignKeyRelationship,
    allData: RelationalData[]
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const targetTableData = allData.find(data => data.tableName === relationship.targetTable);
    if (!targetTableData) {
      errors.push(`Target table ${relationship.targetTable} not found for relationship validation`);
      return { errors, warnings };
    }

    // Get all target values
    const targetValues = new Set(
      targetTableData.data.map(record => record[relationship.targetColumn])
        .filter(value => value !== null && value !== undefined)
    );

    // Check each source record
    for (const sourceRecord of sourceTableData.data) {
      const foreignKeyValue = sourceRecord[relationship.sourceColumn];
      
      if (foreignKeyValue !== null && foreignKeyValue !== undefined) {
        if (!targetValues.has(foreignKeyValue)) {
          errors.push(
            `Referential integrity violation: ${relationship.sourceTable}.${relationship.sourceColumn} ` +
            `references non-existent ${relationship.targetTable}.${relationship.targetColumn} = ${foreignKeyValue}`
          );
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Get relationship statistics
   */
  getRelationshipStatistics(): {
    totalRelationships: number;
    tablesProcessed: number;
    idMappingsCreated: number;
    mappingsByTable: Record<string, number>;
  } {
    const mappingsByTable: Record<string, number> = {};
    
    for (const [key, mapping] of this.idMappings.entries()) {
      const [tableName] = key.split('.');
      mappingsByTable[tableName] = (mappingsByTable[tableName] || 0) + mapping.size;
    }

    return {
      totalRelationships: this.relationships.length,
      tablesProcessed: this.processedTables.size,
      idMappingsCreated: this.idMappings.size,
      mappingsByTable
    };
  }

  /**
   * Clear all mappings and reset state
   */
  reset(): void {
    this.idMappings.clear();
    this.relationships = [];
    this.processedTables.clear();
  }

  /**
   * Export mappings for backup/restore
   */
  exportMappings(): Record<string, Record<string, any>> {
    const exported: Record<string, Record<string, any>> = {};
    
    for (const [key, mapping] of this.idMappings.entries()) {
      exported[key] = Object.fromEntries(mapping.entries());
    }
    
    return exported;
  }

  /**
   * Import mappings from backup
   */
  importMappings(mappings: Record<string, Record<string, any>>): void {
    for (const [key, mapping] of Object.entries(mappings)) {
      this.idMappings.set(key, new Map(Object.entries(mapping)));
    }
  }
}