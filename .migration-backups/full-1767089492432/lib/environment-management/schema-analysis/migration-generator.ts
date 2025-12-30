/**
 * Migration Script Generator
 * 
 * Generates SQL migration scripts from schema differences with dependency-aware ordering
 * and rollback script generation for failed migrations
 */

import {
  SchemaDiff,
  SchemaDifference,
  MigrationScript,
  MigrationOperation,
  TableDefinition,
  FunctionDefinition,
  TriggerDefinition,
  IndexDefinition,
  PolicyDefinition,
  ExtensionDefinition,
  ColumnDefinition,
  ConstraintDefinition,
  MigrationGenerationError
} from './types'

export interface MigrationGeneratorOptions {
  includeRollback: boolean
  validateSyntax: boolean
  addComments: boolean
  batchSize: number
  timeoutPerOperation: number
  safeMode: boolean // Extra safety checks for production
}

export interface MigrationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  estimatedDuration: number
  riskAssessment: 'low' | 'medium' | 'high'
}

export class MigrationGenerator {
  
  /**
   * Generate migration script from schema differences
   */
  async generateMigrationScript(
    diff: SchemaDiff,
    options: MigrationGeneratorOptions = this.getDefaultOptions()
  ): Promise<MigrationScript> {
    try {
      console.log(`Generating migration script for ${diff.differences.length} differences`)

      const operations: MigrationOperation[] = []
      const rollbackOperations: MigrationOperation[] = []

      // Process differences in dependency order
      const sortedDifferences = this.sortByDependencies(diff.differences)

      for (const difference of sortedDifferences) {
        const operation = await this.generateOperation(difference, options)
        operations.push(operation)

        if (options.includeRollback) {
          const rollbackOperation = await this.generateRollbackOperation(difference, options)
          if (rollbackOperation) {
            rollbackOperations.unshift(rollbackOperation) // Reverse order for rollback
          }
        }
      }

      const dependencies = this.extractGlobalDependencies(diff.differences)
      const estimatedDuration = this.calculateEstimatedDuration(operations)
      const riskLevel = this.assessRiskLevel(operations)

      const migrationScript: MigrationScript = {
        id: this.generateMigrationId(),
        sourceEnvironment: diff.sourceSchema,
        targetEnvironment: diff.targetSchema,
        operations,
        rollbackOperations,
        dependencies,
        estimatedDuration,
        riskLevel,
        generatedAt: new Date()
      }

      console.log(`Migration script generated with ${operations.length} operations`)
      console.log(`Estimated duration: ${estimatedDuration}ms, Risk level: ${riskLevel}`)

      return migrationScript

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new MigrationGenerationError(`Failed to generate migration script: ${message}`, error as Error)
    }
  }

  /**
   * Generate individual migration operation
   */
  private async generateOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<MigrationOperation> {
    const operationId = `${difference.type}_${difference.action}_${difference.objectName}`
    let sql = ''
    let description = ''
    let estimatedDuration = 1000 // Default 1 second
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    switch (difference.type) {
      case 'table':
        ({ sql, description, estimatedDuration, riskLevel } = await this.generateTableOperation(difference, options))
        break
      case 'function':
        ({ sql, description, estimatedDuration, riskLevel } = await this.generateFunctionOperation(difference, options))
        break
      case 'trigger':
        ({ sql, description, estimatedDuration, riskLevel } = await this.generateTriggerOperation(difference, options))
        break
      case 'index':
        ({ sql, description, estimatedDuration, riskLevel } = await this.generateIndexOperation(difference, options))
        break
      case 'policy':
        ({ sql, description, estimatedDuration, riskLevel } = await this.generatePolicyOperation(difference, options))
        break
      case 'extension':
        ({ sql, description, estimatedDuration, riskLevel } = await this.generateExtensionOperation(difference, options))
        break
      default:
        throw new MigrationGenerationError(`Unsupported difference type: ${difference.type}`)
    }

    return {
      id: operationId,
      type: 'ddl',
      sql,
      description,
      dependencies: difference.dependencies,
      estimatedDuration,
      riskLevel
    }
  }

  /**
   * Generate table operation SQL
   */
  private async generateTableOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<{ sql: string; description: string; estimatedDuration: number; riskLevel: 'low' | 'medium' | 'high' }> {
    let sql = ''
    let description = ''
    let estimatedDuration = 2000
    let riskLevel: 'low' | 'medium' | 'high' = 'medium'

    switch (difference.action) {
      case 'create':
        const tableToCreate = difference.details.after as TableDefinition
        sql = this.generateCreateTableSQL(tableToCreate, options)
        description = `Create table ${tableToCreate.schemaName}.${tableToCreate.tableName}`
        estimatedDuration = 3000
        riskLevel = 'low'
        break

      case 'drop':
        const tableToDrop = difference.details.before as TableDefinition
        sql = this.generateDropTableSQL(tableToDrop, options)
        description = `Drop table ${tableToDrop.schemaName}.${tableToDrop.tableName}`
        estimatedDuration = 1000
        riskLevel = 'high' // Dropping tables is risky
        break

      case 'alter':
        const tableBefore = difference.details.before as TableDefinition
        const tableAfter = difference.details.after as TableDefinition
        sql = this.generateAlterTableSQL(tableBefore, tableAfter, difference.details.changes, options)
        description = `Alter table ${tableAfter.schemaName}.${tableAfter.tableName}`
        estimatedDuration = 5000
        riskLevel = 'medium'
        break
    }

    return { sql, description, estimatedDuration, riskLevel }
  }

  /**
   * Generate CREATE TABLE SQL
   */
  private generateCreateTableSQL(table: TableDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Create table ${table.schemaName}.${table.tableName}`)
    }

    lines.push(`CREATE TABLE ${table.schemaName}.${table.tableName} (`)

    // Add columns
    const columnDefinitions = table.columns.map(col => this.generateColumnDefinition(col))
    lines.push(columnDefinitions.map(def => `  ${def}`).join(',\n'))

    // Add table constraints
    const constraintDefinitions = table.constraints
      .filter(c => c.constraintType !== 'NOT NULL') // NOT NULL is handled in column definition
      .map(constraint => this.generateConstraintDefinition(constraint))
    
    if (constraintDefinitions.length > 0) {
      lines.push(',')
      lines.push(constraintDefinitions.map(def => `  ${def}`).join(',\n'))
    }

    lines.push(');')

    // Add table comment if exists
    if (table.comment && options.addComments) {
      lines.push(`COMMENT ON TABLE ${table.schemaName}.${table.tableName} IS '${table.comment}';`)
    }

    // Add column comments
    if (options.addComments) {
      table.columns.forEach(col => {
        if (col.comment) {
          lines.push(`COMMENT ON COLUMN ${table.schemaName}.${table.tableName}.${col.columnName} IS '${col.comment}';`)
        }
      })
    }

    return lines.join('\n')
  }

  /**
   * Generate DROP TABLE SQL
   */
  private generateDropTableSQL(table: TableDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Drop table ${table.schemaName}.${table.tableName}`)
    }

    if (options.safeMode) {
      lines.push(`DROP TABLE IF EXISTS ${table.schemaName}.${table.tableName} CASCADE;`)
    } else {
      lines.push(`DROP TABLE ${table.schemaName}.${table.tableName};`)
    }

    return lines.join('\n')
  }

  /**
   * Generate ALTER TABLE SQL
   */
  private generateAlterTableSQL(
    tableBefore: TableDefinition,
    tableAfter: TableDefinition,
    changes: Record<string, any>,
    options: MigrationGeneratorOptions
  ): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Alter table ${tableAfter.schemaName}.${tableAfter.tableName}`)
    }

    const tableName = `${tableAfter.schemaName}.${tableAfter.tableName}`

    // Handle column changes
    if (changes.columns) {
      // Add new columns
      if (changes.columns.add) {
        changes.columns.add.forEach((col: ColumnDefinition) => {
          lines.push(`ALTER TABLE ${tableName} ADD COLUMN ${this.generateColumnDefinition(col)};`)
        })
      }

      // Drop columns
      if (changes.columns.drop) {
        changes.columns.drop.forEach((col: ColumnDefinition) => {
          lines.push(`ALTER TABLE ${tableName} DROP COLUMN ${col.columnName};`)
        })
      }

      // Modify columns
      if (changes.columns.modify) {
        changes.columns.modify.forEach((change: any) => {
          const col = change.after
          lines.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.columnName} TYPE ${col.dataType};`)
          
          if (col.isNullable !== change.before.isNullable) {
            if (col.isNullable) {
              lines.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.columnName} DROP NOT NULL;`)
            } else {
              lines.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.columnName} SET NOT NULL;`)
            }
          }

          if (col.defaultValue !== change.before.defaultValue) {
            if (col.defaultValue) {
              lines.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.columnName} SET DEFAULT ${col.defaultValue};`)
            } else {
              lines.push(`ALTER TABLE ${tableName} ALTER COLUMN ${col.columnName} DROP DEFAULT;`)
            }
          }
        })
      }
    }

    // Handle constraint changes
    if (changes.constraints) {
      // Add new constraints
      if (changes.constraints.add) {
        changes.constraints.add.forEach((constraint: ConstraintDefinition) => {
          lines.push(`ALTER TABLE ${tableName} ADD ${this.generateConstraintDefinition(constraint)};`)
        })
      }

      // Drop constraints
      if (changes.constraints.drop) {
        changes.constraints.drop.forEach((constraint: ConstraintDefinition) => {
          lines.push(`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraint.constraintName};`)
        })
      }
    }

    return lines.join('\n')
  }

  /**
   * Generate function operation SQL
   */
  private async generateFunctionOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<{ sql: string; description: string; estimatedDuration: number; riskLevel: 'low' | 'medium' | 'high' }> {
    let sql = ''
    let description = ''
    let estimatedDuration = 1000
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    switch (difference.action) {
      case 'create':
      case 'alter':
        const func = difference.details.after as FunctionDefinition
        sql = this.generateCreateFunctionSQL(func, options)
        description = `${difference.action === 'create' ? 'Create' : 'Replace'} function ${func.schemaName}.${func.functionName}`
        break

      case 'drop':
        const funcToDrop = difference.details.before as FunctionDefinition
        sql = this.generateDropFunctionSQL(funcToDrop, options)
        description = `Drop function ${funcToDrop.schemaName}.${funcToDrop.functionName}`
        riskLevel = 'medium'
        break
    }

    return { sql, description, estimatedDuration, riskLevel }
  }

  /**
   * Generate CREATE FUNCTION SQL
   */
  private generateCreateFunctionSQL(func: FunctionDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Create function ${func.schemaName}.${func.functionName}`)
    }

    const parameters = func.parameters.map(p => 
      `${p.parameterName || ''} ${p.parameterMode !== 'IN' ? p.parameterMode + ' ' : ''}${p.dataType}${p.defaultValue ? ' DEFAULT ' + p.defaultValue : ''}`
    ).join(', ')

    lines.push(`CREATE OR REPLACE FUNCTION ${func.schemaName}.${func.functionName}(${parameters})`)
    lines.push(`RETURNS ${func.returnType}`)
    lines.push(`LANGUAGE ${func.language}`)
    lines.push(`${func.volatility}`)
    
    if (func.isSecurityDefiner) {
      lines.push('SECURITY DEFINER')
    }

    lines.push('AS $$')
    lines.push(func.body)
    lines.push('$$;')

    if (func.comment && options.addComments) {
      lines.push(`COMMENT ON FUNCTION ${func.schemaName}.${func.functionName} IS '${func.comment}';`)
    }

    return lines.join('\n')
  }

  /**
   * Generate DROP FUNCTION SQL
   */
  private generateDropFunctionSQL(func: FunctionDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Drop function ${func.schemaName}.${func.functionName}`)
    }

    const parameters = func.parameters.map(p => p.dataType).join(', ')
    lines.push(`DROP FUNCTION IF EXISTS ${func.schemaName}.${func.functionName}(${parameters});`)

    return lines.join('\n')
  }

  /**
   * Generate trigger operation SQL
   */
  private async generateTriggerOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<{ sql: string; description: string; estimatedDuration: number; riskLevel: 'low' | 'medium' | 'high' }> {
    let sql = ''
    let description = ''
    let estimatedDuration = 500
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    switch (difference.action) {
      case 'create':
        const trigger = difference.details.after as TriggerDefinition
        sql = this.generateCreateTriggerSQL(trigger, options)
        description = `Create trigger ${trigger.triggerName} on ${trigger.schemaName}.${trigger.tableName}`
        break

      case 'drop':
        const triggerToDrop = difference.details.before as TriggerDefinition
        sql = this.generateDropTriggerSQL(triggerToDrop, options)
        description = `Drop trigger ${triggerToDrop.triggerName} on ${triggerToDrop.schemaName}.${triggerToDrop.tableName}`
        break
    }

    return { sql, description, estimatedDuration, riskLevel }
  }

  /**
   * Generate CREATE TRIGGER SQL
   */
  private generateCreateTriggerSQL(trigger: TriggerDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Create trigger ${trigger.triggerName}`)
    }

    const events = trigger.events.join(' OR ')
    lines.push(`CREATE TRIGGER ${trigger.triggerName}`)
    lines.push(`  ${trigger.timing} ${events} ON ${trigger.schemaName}.${trigger.tableName}`)
    lines.push(`  FOR EACH ${trigger.orientation}`)
    
    if (trigger.condition) {
      lines.push(`  WHEN (${trigger.condition})`)
    }
    
    lines.push(`  EXECUTE FUNCTION ${trigger.functionSchema}.${trigger.functionName}();`)

    return lines.join('\n')
  }

  /**
   * Generate DROP TRIGGER SQL
   */
  private generateDropTriggerSQL(trigger: TriggerDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Drop trigger ${trigger.triggerName}`)
    }

    lines.push(`DROP TRIGGER IF EXISTS ${trigger.triggerName} ON ${trigger.schemaName}.${trigger.tableName};`)

    return lines.join('\n')
  }

  /**
   * Generate index operation SQL
   */
  private async generateIndexOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<{ sql: string; description: string; estimatedDuration: number; riskLevel: 'low' | 'medium' | 'high' }> {
    let sql = ''
    let description = ''
    let estimatedDuration = 3000 // Indexes can take time
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    switch (difference.action) {
      case 'create':
        const index = difference.details.after as IndexDefinition
        sql = this.generateCreateIndexSQL(index, options)
        description = `Create index ${index.indexName} on ${index.schemaName}.${index.tableName}`
        break

      case 'drop':
        const indexToDrop = difference.details.before as IndexDefinition
        sql = this.generateDropIndexSQL(indexToDrop, options)
        description = `Drop index ${indexToDrop.indexName}`
        break
    }

    return { sql, description, estimatedDuration, riskLevel }
  }

  /**
   * Generate CREATE INDEX SQL
   */
  private generateCreateIndexSQL(index: IndexDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Create index ${index.indexName}`)
    }

    const uniqueClause = index.isUnique ? 'UNIQUE ' : ''
    const columns = index.columns.map(col => 
      `${col.columnName}${col.sortOrder !== 'ASC' ? ' ' + col.sortOrder : ''}`
    ).join(', ')

    lines.push(`CREATE ${uniqueClause}INDEX CONCURRENTLY ${index.indexName}`)
    lines.push(`  ON ${index.schemaName}.${index.tableName}`)
    lines.push(`  USING ${index.indexType} (${columns})`)
    
    if (index.whereClause) {
      lines.push(`  WHERE ${index.whereClause}`)
    }

    lines.push(';')

    return lines.join('\n')
  }

  /**
   * Generate DROP INDEX SQL
   */
  private generateDropIndexSQL(index: IndexDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Drop index ${index.indexName}`)
    }

    lines.push(`DROP INDEX CONCURRENTLY IF EXISTS ${index.schemaName}.${index.indexName};`)

    return lines.join('\n')
  }

  /**
   * Generate policy operation SQL
   */
  private async generatePolicyOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<{ sql: string; description: string; estimatedDuration: number; riskLevel: 'low' | 'medium' | 'high' }> {
    let sql = ''
    let description = ''
    let estimatedDuration = 500
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    switch (difference.action) {
      case 'create':
        const policy = difference.details.after as PolicyDefinition
        sql = this.generateCreatePolicySQL(policy, options)
        description = `Create policy ${policy.policyName} on ${policy.schemaName}.${policy.tableName}`
        break

      case 'drop':
        const policyToDrop = difference.details.before as PolicyDefinition
        sql = this.generateDropPolicySQL(policyToDrop, options)
        description = `Drop policy ${policyToDrop.policyName} on ${policyToDrop.schemaName}.${policyToDrop.tableName}`
        break
    }

    return { sql, description, estimatedDuration, riskLevel }
  }

  /**
   * Generate CREATE POLICY SQL
   */
  private generateCreatePolicySQL(policy: PolicyDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Create policy ${policy.policyName}`)
    }

    const permissiveClause = policy.isPermissive ? 'PERMISSIVE' : 'RESTRICTIVE'
    lines.push(`CREATE POLICY ${policy.policyName} ON ${policy.schemaName}.${policy.tableName}`)
    lines.push(`  AS ${permissiveClause}`)
    lines.push(`  FOR ${policy.command}`)
    
    if (policy.roles.length > 0) {
      lines.push(`  TO ${policy.roles.join(', ')}`)
    }
    
    if (policy.usingExpression) {
      lines.push(`  USING (${policy.usingExpression})`)
    }
    
    if (policy.checkExpression) {
      lines.push(`  WITH CHECK (${policy.checkExpression})`)
    }

    lines.push(';')

    return lines.join('\n')
  }

  /**
   * Generate DROP POLICY SQL
   */
  private generateDropPolicySQL(policy: PolicyDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Drop policy ${policy.policyName}`)
    }

    lines.push(`DROP POLICY IF EXISTS ${policy.policyName} ON ${policy.schemaName}.${policy.tableName};`)

    return lines.join('\n')
  }

  /**
   * Generate extension operation SQL
   */
  private async generateExtensionOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<{ sql: string; description: string; estimatedDuration: number; riskLevel: 'low' | 'medium' | 'high' }> {
    let sql = ''
    let description = ''
    let estimatedDuration = 2000
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    switch (difference.action) {
      case 'create':
        const extension = difference.details.after as ExtensionDefinition
        sql = this.generateCreateExtensionSQL(extension, options)
        description = `Create extension ${extension.extensionName}`
        break

      case 'drop':
        const extensionToDrop = difference.details.before as ExtensionDefinition
        sql = this.generateDropExtensionSQL(extensionToDrop, options)
        description = `Drop extension ${extensionToDrop.extensionName}`
        riskLevel = 'medium'
        break
    }

    return { sql, description, estimatedDuration, riskLevel }
  }

  /**
   * Generate CREATE EXTENSION SQL
   */
  private generateCreateExtensionSQL(extension: ExtensionDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Create extension ${extension.extensionName}`)
    }

    lines.push(`CREATE EXTENSION IF NOT EXISTS ${extension.extensionName}`)
    
    if (extension.schemaName !== 'public') {
      lines.push(`  SCHEMA ${extension.schemaName}`)
    }
    
    if (extension.version) {
      lines.push(`  VERSION '${extension.version}'`)
    }

    lines.push(';')

    return lines.join('\n')
  }

  /**
   * Generate DROP EXTENSION SQL
   */
  private generateDropExtensionSQL(extension: ExtensionDefinition, options: MigrationGeneratorOptions): string {
    const lines: string[] = []
    
    if (options.addComments) {
      lines.push(`-- Drop extension ${extension.extensionName}`)
    }

    lines.push(`DROP EXTENSION IF EXISTS ${extension.extensionName};`)

    return lines.join('\n')
  }

  /**
   * Generate rollback operation
   */
  private async generateRollbackOperation(
    difference: SchemaDifference,
    options: MigrationGeneratorOptions
  ): Promise<MigrationOperation | null> {
    // Generate the opposite operation for rollback
    const rollbackDifference: SchemaDifference = {
      ...difference,
      action: this.getOppositeAction(difference.action),
      details: {
        before: difference.details.after,
        after: difference.details.before
      }
    }

    try {
      const operation = await this.generateOperation(rollbackDifference, options)
      return {
        ...operation,
        id: `rollback_${operation.id}`,
        rollbackSql: operation.sql
      }
    } catch (error) {
      // Some operations might not be reversible
      console.warn(`Could not generate rollback for ${difference.type} ${difference.action}: ${error}`)
      return null
    }
  }

  /**
   * Helper methods
   */
  private generateColumnDefinition(column: ColumnDefinition): string {
    let definition = `${column.columnName} ${column.dataType}`
    
    if (column.maxLength) {
      definition += `(${column.maxLength})`
    } else if (column.numericPrecision && column.numericScale) {
      definition += `(${column.numericPrecision},${column.numericScale})`
    }
    
    if (!column.isNullable) {
      definition += ' NOT NULL'
    }
    
    if (column.defaultValue) {
      definition += ` DEFAULT ${column.defaultValue}`
    }
    
    return definition
  }

  private generateConstraintDefinition(constraint: ConstraintDefinition): string {
    switch (constraint.constraintType) {
      case 'PRIMARY KEY':
        return `CONSTRAINT ${constraint.constraintName} PRIMARY KEY (${constraint.columnNames.join(', ')})`
      
      case 'FOREIGN KEY':
        return `CONSTRAINT ${constraint.constraintName} FOREIGN KEY (${constraint.columnNames.join(', ')}) REFERENCES ${constraint.referencedSchema}.${constraint.referencedTable} (${constraint.referencedColumns?.join(', ')})`
      
      case 'UNIQUE':
        return `CONSTRAINT ${constraint.constraintName} UNIQUE (${constraint.columnNames.join(', ')})`
      
      case 'CHECK':
        return `CONSTRAINT ${constraint.constraintName} CHECK (${constraint.checkClause})`
      
      default:
        return `CONSTRAINT ${constraint.constraintName} ${constraint.constraintType}`
    }
  }

  private sortByDependencies(differences: SchemaDifference[]): SchemaDifference[] {
    // Simple topological sort based on priority
    return differences.sort((a, b) => (a.priority || 0) - (b.priority || 0))
  }

  private extractGlobalDependencies(differences: SchemaDifference[]): string[] {
    const dependencies = new Set<string>()
    differences.forEach(diff => {
      diff.dependencies.forEach(dep => dependencies.add(dep))
    })
    return Array.from(dependencies)
  }

  private calculateEstimatedDuration(operations: MigrationOperation[]): number {
    return operations.reduce((total, op) => total + op.estimatedDuration, 0)
  }

  private assessRiskLevel(operations: MigrationOperation[]): 'low' | 'medium' | 'high' {
    const highRiskOps = operations.filter(op => op.riskLevel === 'high').length
    const mediumRiskOps = operations.filter(op => op.riskLevel === 'medium').length
    
    if (highRiskOps > 0) return 'high'
    if (mediumRiskOps > operations.length / 2) return 'medium'
    return 'low'
  }

  private getOppositeAction(action: string): 'create' | 'drop' | 'alter' {
    switch (action) {
      case 'create': return 'drop'
      case 'drop': return 'create'
      case 'alter': return 'alter'
      default: return 'alter'
    }
  }

  private generateMigrationId(): string {
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').replace(/\..+/, '')
    const random = Math.random().toString(36).substring(2, 8)
    return `migration_${timestamp}_${random}`
  }

  private getDefaultOptions(): MigrationGeneratorOptions {
    return {
      includeRollback: true,
      validateSyntax: false,
      addComments: true,
      batchSize: 100,
      timeoutPerOperation: 30000,
      safeMode: true
    }
  }
}