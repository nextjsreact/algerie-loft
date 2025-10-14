/**
 * Schema Analysis Types for PostgreSQL/Supabase
 * 
 * Types for analyzing and comparing database schemas
 */

export interface TableDefinition {
  schemaName: string
  tableName: string
  columns: ColumnDefinition[]
  constraints: ConstraintDefinition[]
  indexes: IndexDefinition[]
  triggers: TriggerDefinition[]
  policies: PolicyDefinition[]
  comment?: string
}

export interface ColumnDefinition {
  columnName: string
  dataType: string
  isNullable: boolean
  defaultValue?: string
  maxLength?: number
  numericPrecision?: number
  numericScale?: number
  isIdentity: boolean
  identityGeneration?: 'ALWAYS' | 'BY DEFAULT'
  comment?: string
}

export interface ConstraintDefinition {
  constraintName: string
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL'
  columnNames: string[]
  referencedTable?: string
  referencedColumns?: string[]
  referencedSchema?: string
  checkClause?: string
  isDeferrable?: boolean
  initiallyDeferred?: boolean
}

export interface IndexDefinition {
  schemaName: string
  tableName: string
  indexName: string
  indexType: 'btree' | 'hash' | 'gist' | 'gin' | 'brin'
  columns: IndexColumnDefinition[]
  isUnique: boolean
  isPrimary: boolean
  whereClause?: string
  comment?: string
}

export interface IndexColumnDefinition {
  columnName: string
  sortOrder: 'ASC' | 'DESC'
  nullsOrder?: 'FIRST' | 'LAST'
}

export interface FunctionDefinition {
  schemaName: string
  functionName: string
  returnType: string
  parameters: FunctionParameter[]
  language: string
  body: string
  isSecurityDefiner: boolean
  volatility: 'IMMUTABLE' | 'STABLE' | 'VOLATILE'
  comment?: string
}

export interface FunctionParameter {
  parameterName?: string
  parameterMode: 'IN' | 'OUT' | 'INOUT' | 'VARIADIC'
  dataType: string
  defaultValue?: string
}

export interface TriggerDefinition {
  schemaName: string
  tableName: string
  triggerName: string
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: ('INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE')[]
  orientation: 'ROW' | 'STATEMENT'
  condition?: string
  functionSchema: string
  functionName: string
  comment?: string
}

export interface PolicyDefinition {
  schemaName: string
  tableName: string
  policyName: string
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  roles: string[]
  usingExpression?: string
  checkExpression?: string
  isPermissive: boolean
}

export interface SchemaDefinition {
  schemas: string[]
  tables: TableDefinition[]
  functions: FunctionDefinition[]
  triggers: TriggerDefinition[]
  indexes: IndexDefinition[]
  policies: PolicyDefinition[]
  extensions: ExtensionDefinition[]
  version?: string
  analyzedAt: Date
}

export interface ExtensionDefinition {
  extensionName: string
  schemaName: string
  version: string
  comment?: string
}

export interface SchemaDiff {
  sourceSchema: string
  targetSchema: string
  differences: SchemaDifference[]
  summary: DiffSummary
  generatedAt: Date
}

export interface SchemaDifference {
  type: 'table' | 'function' | 'trigger' | 'index' | 'policy' | 'extension'
  action: 'create' | 'drop' | 'alter'
  objectName: string
  schemaName: string
  details: DifferenceDetails
  dependencies: string[]
  priority: number // For ordering migrations
}

export interface DifferenceDetails {
  before?: any
  after?: any
  changes?: Record<string, { before: any; after: any }>
  reason?: string
}

export interface DiffSummary {
  totalDifferences: number
  tableChanges: number
  functionChanges: number
  triggerChanges: number
  indexChanges: number
  policyChanges: number
  extensionChanges: number
}

export interface MigrationScript {
  id: string
  sourceEnvironment: string
  targetEnvironment: string
  operations: MigrationOperation[]
  rollbackOperations: MigrationOperation[]
  dependencies: string[]
  estimatedDuration: number
  riskLevel: 'low' | 'medium' | 'high'
  generatedAt: Date
}

export interface MigrationOperation {
  id: string
  type: 'ddl' | 'dml' | 'function' | 'trigger' | 'policy'
  sql: string
  description: string
  dependencies: string[]
  rollbackSql?: string
  estimatedDuration: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface SchemaAnalysisOptions {
  includeSystemTables: boolean
  includeViews: boolean
  includeFunctions: boolean
  includeTriggers: boolean
  includePolicies: boolean
  includeIndexes: boolean
  includeExtensions: boolean
  schemasToAnalyze?: string[]
  tablesToExclude?: string[]
}

export interface SchemaAnalysisResult {
  schema: SchemaDefinition
  statistics: SchemaStatistics
  warnings: string[]
  errors: string[]
  analysisTime: number
}

export interface SchemaStatistics {
  totalTables: number
  totalColumns: number
  totalFunctions: number
  totalTriggers: number
  totalIndexes: number
  totalPolicies: number
  totalExtensions: number
  schemaSize: number // in bytes
  complexityScore: number
}

export class SchemaAnalysisError extends Error {
  constructor(message: string, public cause?: Error) {
    super(`Schema analysis failed: ${message}`)
    this.name = 'SchemaAnalysisError'
  }
}

export class SchemaDiffError extends Error {
  constructor(message: string, public cause?: Error) {
    super(`Schema comparison failed: ${message}`)
    this.name = 'SchemaDiffError'
  }
}

export class MigrationGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(`Migration generation failed: ${message}`)
    this.name = 'MigrationGenerationError'
  }
}