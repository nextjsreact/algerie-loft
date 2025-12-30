/**
 * Schema Analysis Module
 * 
 * Exports for PostgreSQL/Supabase schema analysis functionality
 */

export * from './types'
export * from './postgresql-schema-analyzer'
export * from './rls-policy-analyzer'
export * from './schema-comparator'
export * from './migration-generator'

// Re-export main classes for convenience
export { PostgreSQLSchemaAnalyzer as SchemaAnalyzer } from './postgresql-schema-analyzer'
export { SchemaComparator } from './schema-comparator'
export { MigrationGenerator } from './migration-generator'