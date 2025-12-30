/**
 * Schema Comparison Engine
 * 
 * Compares database schemas and detects differences between environments
 * with dependency analysis for proper migration ordering
 */

import {
  SchemaDefinition,
  SchemaDiff,
  SchemaDifference,
  DifferenceDetails,
  DiffSummary,
  TableDefinition,
  FunctionDefinition,
  TriggerDefinition,
  IndexDefinition,
  PolicyDefinition,
  ExtensionDefinition,
  SchemaDiffError
} from './types'

export interface ComparisonOptions {
  ignoreComments: boolean
  ignoreIndexes: boolean
  ignorePolicies: boolean
  ignoreExtensions: boolean
  customIgnorePatterns: string[]
  dependencyAnalysis: boolean
}

export interface DependencyGraph {
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  cycles: string[][]
}

export interface DependencyNode {
  id: string
  type: 'table' | 'function' | 'trigger' | 'index' | 'policy' | 'extension'
  name: string
  schema: string
}

export interface DependencyEdge {
  from: string
  to: string
  type: 'foreign_key' | 'function_call' | 'trigger_dependency' | 'policy_dependency'
}

export class SchemaComparator {
  
  /**
   * Compare two schema definitions and generate diff
   */
  async compareSchemas(
    sourceSchema: SchemaDefinition, 
    targetSchema: SchemaDefinition,
    options: ComparisonOptions = this.getDefaultOptions()
  ): Promise<SchemaDiff> {
    try {
      console.log('Starting schema comparison...')
      
      const differences: SchemaDifference[] = []

      // Compare each schema component
      differences.push(...await this.compareTables(sourceSchema.tables, targetSchema.tables))
      differences.push(...await this.compareFunctions(sourceSchema.functions, targetSchema.functions))
      differences.push(...await this.compareTriggers(sourceSchema.triggers, targetSchema.triggers))
      
      if (!options.ignoreIndexes) {
        differences.push(...await this.compareIndexes(sourceSchema.indexes, targetSchema.indexes))
      }
      
      if (!options.ignorePolicies) {
        differences.push(...await this.comparePolicies(sourceSchema.policies, targetSchema.policies))
      }
      
      if (!options.ignoreExtensions) {
        differences.push(...await this.compareExtensions(sourceSchema.extensions, targetSchema.extensions))
      }

      // Perform dependency analysis if requested
      if (options.dependencyAnalysis) {
        differences.forEach(diff => {
          diff.dependencies = this.analyzeDependencies(diff, differences)
          diff.priority = this.calculatePriority(diff)
        })
      }

      // Sort differences by priority for proper migration ordering
      differences.sort((a, b) => (a.priority || 0) - (b.priority || 0))

      const summary = this.generateSummary(differences)

      console.log(`Schema comparison completed. Found ${differences.length} differences.`)

      return {
        sourceSchema: 'source',
        targetSchema: 'target',
        differences,
        summary,
        generatedAt: new Date()
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new SchemaDiffError(`Failed to compare schemas: ${message}`, error as Error)
    }
  }

  /**
   * Compare table definitions
   */
  private async compareTables(sourceTables: TableDefinition[], targetTables: TableDefinition[]): Promise<SchemaDifference[]> {
    const differences: SchemaDifference[] = []
    
    const sourceTableMap = new Map(sourceTables.map(t => [`${t.schemaName}.${t.tableName}`, t]))
    const targetTableMap = new Map(targetTables.map(t => [`${t.schemaName}.${t.tableName}`, t]))

    // Find tables to create (exist in source but not in target)
    for (const [tableKey, sourceTable] of sourceTableMap) {
      if (!targetTableMap.has(tableKey)) {
        differences.push({
          type: 'table',
          action: 'create',
          objectName: sourceTable.tableName,
          schemaName: sourceTable.schemaName,
          details: {
            after: sourceTable,
            reason: 'Table exists in source but not in target'
          },
          dependencies: [],
          priority: 1
        })
      }
    }

    // Find tables to drop (exist in target but not in source)
    for (const [tableKey, targetTable] of targetTableMap) {
      if (!sourceTableMap.has(tableKey)) {
        differences.push({
          type: 'table',
          action: 'drop',
          objectName: targetTable.tableName,
          schemaName: targetTable.schemaName,
          details: {
            before: targetTable,
            reason: 'Table exists in target but not in source'
          },
          dependencies: [],
          priority: 10 // Drop operations have lower priority
        })
      }
    }

    // Find tables to alter (exist in both but are different)
    for (const [tableKey, sourceTable] of sourceTableMap) {
      const targetTable = targetTableMap.get(tableKey)
      if (targetTable) {
        const tableDifferences = this.compareTableStructure(sourceTable, targetTable)
        if (tableDifferences.length > 0) {
          differences.push({
            type: 'table',
            action: 'alter',
            objectName: sourceTable.tableName,
            schemaName: sourceTable.schemaName,
            details: {
              before: targetTable,
              after: sourceTable,
              changes: tableDifferences,
              reason: 'Table structure differs between source and target'
            },
            dependencies: [],
            priority: 5
          })
        }
      }
    }

    return differences
  }

  /**
   * Compare table structure in detail
   */
  private compareTableStructure(sourceTable: TableDefinition, targetTable: TableDefinition): Record<string, any> {
    const changes: Record<string, any> = {}

    // Compare columns
    const columnChanges = this.compareColumns(sourceTable.columns, targetTable.columns)
    if (Object.keys(columnChanges).length > 0) {
      changes.columns = columnChanges
    }

    // Compare constraints
    const constraintChanges = this.compareConstraints(sourceTable.constraints, targetTable.constraints)
    if (Object.keys(constraintChanges).length > 0) {
      changes.constraints = constraintChanges
    }

    return changes
  }

  /**
   * Compare column definitions
   */
  private compareColumns(sourceColumns: any[], targetColumns: any[]): Record<string, any> {
    const changes: Record<string, any> = {}
    
    const sourceColMap = new Map(sourceColumns.map(c => [c.columnName, c]))
    const targetColMap = new Map(targetColumns.map(c => [c.columnName, c]))

    // Find columns to add
    const columnsToAdd = sourceColumns.filter(c => !targetColMap.has(c.columnName))
    if (columnsToAdd.length > 0) {
      changes.add = columnsToAdd
    }

    // Find columns to drop
    const columnsToDrop = targetColumns.filter(c => !sourceColMap.has(c.columnName))
    if (columnsToDrop.length > 0) {
      changes.drop = columnsToDrop
    }

    // Find columns to modify
    const columnsToModify: any[] = []
    for (const sourceCol of sourceColumns) {
      const targetCol = targetColMap.get(sourceCol.columnName)
      if (targetCol && !this.areColumnsEqual(sourceCol, targetCol)) {
        columnsToModify.push({
          columnName: sourceCol.columnName,
          before: targetCol,
          after: sourceCol
        })
      }
    }
    if (columnsToModify.length > 0) {
      changes.modify = columnsToModify
    }

    return changes
  }

  /**
   * Compare constraint definitions
   */
  private compareConstraints(sourceConstraints: any[], targetConstraints: any[]): Record<string, any> {
    const changes: Record<string, any> = {}
    
    const sourceConstraintMap = new Map(sourceConstraints.map(c => [c.constraintName, c]))
    const targetConstraintMap = new Map(targetConstraints.map(c => [c.constraintName, c]))

    // Find constraints to add
    const constraintsToAdd = sourceConstraints.filter(c => !targetConstraintMap.has(c.constraintName))
    if (constraintsToAdd.length > 0) {
      changes.add = constraintsToAdd
    }

    // Find constraints to drop
    const constraintsToDrop = targetConstraints.filter(c => !sourceConstraintMap.has(c.constraintName))
    if (constraintsToDrop.length > 0) {
      changes.drop = constraintsToDrop
    }

    return changes
  }

  /**
   * Compare function definitions
   */
  private async compareFunctions(sourceFunctions: FunctionDefinition[], targetFunctions: FunctionDefinition[]): Promise<SchemaDifference[]> {
    const differences: SchemaDifference[] = []
    
    const sourceFunctionMap = new Map(sourceFunctions.map(f => [`${f.schemaName}.${f.functionName}`, f]))
    const targetFunctionMap = new Map(targetFunctions.map(f => [`${f.schemaName}.${f.functionName}`, f]))

    // Find functions to create
    for (const [functionKey, sourceFunction] of sourceFunctionMap) {
      if (!targetFunctionMap.has(functionKey)) {
        differences.push({
          type: 'function',
          action: 'create',
          objectName: sourceFunction.functionName,
          schemaName: sourceFunction.schemaName,
          details: {
            after: sourceFunction,
            reason: 'Function exists in source but not in target'
          },
          dependencies: [],
          priority: 3
        })
      }
    }

    // Find functions to drop
    for (const [functionKey, targetFunction] of targetFunctionMap) {
      if (!sourceFunctionMap.has(functionKey)) {
        differences.push({
          type: 'function',
          action: 'drop',
          objectName: targetFunction.functionName,
          schemaName: targetFunction.schemaName,
          details: {
            before: targetFunction,
            reason: 'Function exists in target but not in source'
          },
          dependencies: [],
          priority: 8
        })
      }
    }

    // Find functions to alter
    for (const [functionKey, sourceFunction] of sourceFunctionMap) {
      const targetFunction = targetFunctionMap.get(functionKey)
      if (targetFunction && !this.areFunctionsEqual(sourceFunction, targetFunction)) {
        differences.push({
          type: 'function',
          action: 'alter',
          objectName: sourceFunction.functionName,
          schemaName: sourceFunction.schemaName,
          details: {
            before: targetFunction,
            after: sourceFunction,
            reason: 'Function definition differs between source and target'
          },
          dependencies: [],
          priority: 6
        })
      }
    }

    return differences
  }

  /**
   * Compare trigger definitions
   */
  private async compareTriggers(sourceTriggers: TriggerDefinition[], targetTriggers: TriggerDefinition[]): Promise<SchemaDifference[]> {
    const differences: SchemaDifference[] = []
    
    const sourceTriggerMap = new Map(sourceTriggers.map(t => [`${t.schemaName}.${t.tableName}.${t.triggerName}`, t]))
    const targetTriggerMap = new Map(targetTriggers.map(t => [`${t.schemaName}.${t.tableName}.${t.triggerName}`, t]))

    // Find triggers to create
    for (const [triggerKey, sourceTrigger] of sourceTriggerMap) {
      if (!targetTriggerMap.has(triggerKey)) {
        differences.push({
          type: 'trigger',
          action: 'create',
          objectName: sourceTrigger.triggerName,
          schemaName: sourceTrigger.schemaName,
          details: {
            after: sourceTrigger,
            reason: 'Trigger exists in source but not in target'
          },
          dependencies: [`${sourceTrigger.schemaName}.${sourceTrigger.tableName}`, `${sourceTrigger.functionSchema}.${sourceTrigger.functionName}`],
          priority: 7
        })
      }
    }

    // Find triggers to drop
    for (const [triggerKey, targetTrigger] of targetTriggerMap) {
      if (!sourceTriggerMap.has(triggerKey)) {
        differences.push({
          type: 'trigger',
          action: 'drop',
          objectName: targetTrigger.triggerName,
          schemaName: targetTrigger.schemaName,
          details: {
            before: targetTrigger,
            reason: 'Trigger exists in target but not in source'
          },
          dependencies: [],
          priority: 2
        })
      }
    }

    return differences
  }

  /**
   * Compare index definitions
   */
  private async compareIndexes(sourceIndexes: IndexDefinition[], targetIndexes: IndexDefinition[]): Promise<SchemaDifference[]> {
    const differences: SchemaDifference[] = []
    
    const sourceIndexMap = new Map(sourceIndexes.map(i => [`${i.schemaName}.${i.tableName}.${i.indexName}`, i]))
    const targetIndexMap = new Map(targetIndexes.map(i => [`${i.schemaName}.${i.tableName}.${i.indexName}`, i]))

    // Find indexes to create
    for (const [indexKey, sourceIndex] of sourceIndexMap) {
      if (!targetIndexMap.has(indexKey)) {
        differences.push({
          type: 'index',
          action: 'create',
          objectName: sourceIndex.indexName,
          schemaName: sourceIndex.schemaName,
          details: {
            after: sourceIndex,
            reason: 'Index exists in source but not in target'
          },
          dependencies: [`${sourceIndex.schemaName}.${sourceIndex.tableName}`],
          priority: 9
        })
      }
    }

    // Find indexes to drop
    for (const [indexKey, targetIndex] of targetIndexMap) {
      if (!sourceIndexMap.has(indexKey)) {
        differences.push({
          type: 'index',
          action: 'drop',
          objectName: targetIndex.indexName,
          schemaName: targetIndex.schemaName,
          details: {
            before: targetIndex,
            reason: 'Index exists in target but not in source'
          },
          dependencies: [],
          priority: 1
        })
      }
    }

    return differences
  }

  /**
   * Compare policy definitions
   */
  private async comparePolicies(sourcePolicies: PolicyDefinition[], targetPolicies: PolicyDefinition[]): Promise<SchemaDifference[]> {
    const differences: SchemaDifference[] = []
    
    const sourcePolicyMap = new Map(sourcePolicies.map(p => [`${p.schemaName}.${p.tableName}.${p.policyName}`, p]))
    const targetPolicyMap = new Map(targetPolicies.map(p => [`${p.schemaName}.${p.tableName}.${p.policyName}`, p]))

    // Find policies to create
    for (const [policyKey, sourcePolicy] of sourcePolicyMap) {
      if (!targetPolicyMap.has(policyKey)) {
        differences.push({
          type: 'policy',
          action: 'create',
          objectName: sourcePolicy.policyName,
          schemaName: sourcePolicy.schemaName,
          details: {
            after: sourcePolicy,
            reason: 'Policy exists in source but not in target'
          },
          dependencies: [`${sourcePolicy.schemaName}.${sourcePolicy.tableName}`],
          priority: 8
        })
      }
    }

    // Find policies to drop
    for (const [policyKey, targetPolicy] of targetPolicyMap) {
      if (!sourcePolicyMap.has(policyKey)) {
        differences.push({
          type: 'policy',
          action: 'drop',
          objectName: targetPolicy.policyName,
          schemaName: targetPolicy.schemaName,
          details: {
            before: targetPolicy,
            reason: 'Policy exists in target but not in source'
          },
          dependencies: [],
          priority: 2
        })
      }
    }

    return differences
  }

  /**
   * Compare extension definitions
   */
  private async compareExtensions(sourceExtensions: ExtensionDefinition[], targetExtensions: ExtensionDefinition[]): Promise<SchemaDifference[]> {
    const differences: SchemaDifference[] = []
    
    const sourceExtensionMap = new Map(sourceExtensions.map(e => [e.extensionName, e]))
    const targetExtensionMap = new Map(targetExtensions.map(e => [e.extensionName, e]))

    // Find extensions to create
    for (const [extensionName, sourceExtension] of sourceExtensionMap) {
      if (!targetExtensionMap.has(extensionName)) {
        differences.push({
          type: 'extension',
          action: 'create',
          objectName: sourceExtension.extensionName,
          schemaName: sourceExtension.schemaName,
          details: {
            after: sourceExtension,
            reason: 'Extension exists in source but not in target'
          },
          dependencies: [],
          priority: 0 // Extensions should be created first
        })
      }
    }

    // Find extensions to drop
    for (const [extensionName, targetExtension] of targetExtensionMap) {
      if (!sourceExtensionMap.has(extensionName)) {
        differences.push({
          type: 'extension',
          action: 'drop',
          objectName: targetExtension.extensionName,
          schemaName: targetExtension.schemaName,
          details: {
            before: targetExtension,
            reason: 'Extension exists in target but not in source'
          },
          dependencies: [],
          priority: 11 // Extensions should be dropped last
        })
      }
    }

    return differences
  }

  /**
   * Analyze dependencies between schema objects
   */
  private analyzeDependencies(difference: SchemaDifference, allDifferences: SchemaDifference[]): string[] {
    const dependencies: string[] = []

    // Add explicit dependencies based on object type
    switch (difference.type) {
      case 'trigger':
        // Triggers depend on tables and functions
        if (difference.details.after) {
          const trigger = difference.details.after as TriggerDefinition
          dependencies.push(`${trigger.schemaName}.${trigger.tableName}`)
          dependencies.push(`${trigger.functionSchema}.${trigger.functionName}`)
        }
        break
      
      case 'index':
        // Indexes depend on tables
        if (difference.details.after) {
          const index = difference.details.after as IndexDefinition
          dependencies.push(`${index.schemaName}.${index.tableName}`)
        }
        break
      
      case 'policy':
        // Policies depend on tables
        if (difference.details.after) {
          const policy = difference.details.after as PolicyDefinition
          dependencies.push(`${policy.schemaName}.${policy.tableName}`)
        }
        break
    }

    return dependencies
  }

  /**
   * Calculate priority for migration ordering
   */
  private calculatePriority(difference: SchemaDifference): number {
    // Base priority from difference
    let priority = difference.priority || 5

    // Adjust based on action type
    if (difference.action === 'drop') {
      priority += 5 // Drop operations should happen later
    }

    // Adjust based on object type
    switch (difference.type) {
      case 'extension':
        priority = difference.action === 'create' ? 0 : 11
        break
      case 'table':
        priority = difference.action === 'create' ? 1 : (difference.action === 'drop' ? 10 : 5)
        break
      case 'function':
        priority = difference.action === 'create' ? 3 : (difference.action === 'drop' ? 8 : 6)
        break
      case 'trigger':
        priority = difference.action === 'create' ? 7 : 2
        break
      case 'policy':
        priority = difference.action === 'create' ? 8 : 2
        break
      case 'index':
        priority = difference.action === 'create' ? 9 : 1
        break
    }

    return priority
  }

  /**
   * Generate summary of differences
   */
  private generateSummary(differences: SchemaDifference[]): DiffSummary {
    const summary: DiffSummary = {
      totalDifferences: differences.length,
      tableChanges: 0,
      functionChanges: 0,
      triggerChanges: 0,
      indexChanges: 0,
      policyChanges: 0,
      extensionChanges: 0
    }

    differences.forEach(diff => {
      switch (diff.type) {
        case 'table':
          summary.tableChanges++
          break
        case 'function':
          summary.functionChanges++
          break
        case 'trigger':
          summary.triggerChanges++
          break
        case 'index':
          summary.indexChanges++
          break
        case 'policy':
          summary.policyChanges++
          break
        case 'extension':
          summary.extensionChanges++
          break
      }
    })

    return summary
  }

  /**
   * Helper methods for equality comparison
   */
  private areColumnsEqual(col1: any, col2: any): boolean {
    return col1.dataType === col2.dataType &&
           col1.isNullable === col2.isNullable &&
           col1.defaultValue === col2.defaultValue &&
           col1.maxLength === col2.maxLength
  }

  private areFunctionsEqual(func1: FunctionDefinition, func2: FunctionDefinition): boolean {
    return func1.body === func2.body &&
           func1.returnType === func2.returnType &&
           func1.language === func2.language
  }

  /**
   * Get default comparison options
   */
  private getDefaultOptions(): ComparisonOptions {
    return {
      ignoreComments: true,
      ignoreIndexes: false,
      ignorePolicies: false,
      ignoreExtensions: false,
      customIgnorePatterns: [],
      dependencyAnalysis: true
    }
  }
}