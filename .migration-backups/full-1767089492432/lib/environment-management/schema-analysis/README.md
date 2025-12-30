# Schema Analysis System

A comprehensive PostgreSQL/Supabase schema analysis, comparison, and migration generation system for the test/training environment setup.

## Overview

This system provides tools to:
- Analyze complete database schemas including tables, functions, triggers, indexes, and RLS policies
- Compare schemas between different environments
- Generate migration scripts with dependency-aware ordering
- Analyze RLS policies and identify security gaps
- Detect Supabase-specific schema components

## Components

### 1. PostgreSQLSchemaAnalyzer

Extracts complete schema information from PostgreSQL/Supabase databases.

```typescript
import { PostgreSQLSchemaAnalyzer } from './postgresql-schema-analyzer'

const analyzer = new PostgreSQLSchemaAnalyzer(environment)
const analysis = await analyzer.analyzeSchema({
  includeSystemTables: true,
  includeFunctions: true,
  includeTriggers: true,
  includePolicies: true,
  includeIndexes: true,
  includeExtensions: true,
  schemasToAnalyze: ['public', 'audit']
})
```

**Features:**
- Extracts table definitions with columns, constraints, and indexes
- Analyzes functions and triggers
- Detects RLS policies
- Identifies extensions and custom schemas
- Calculates complexity scores and statistics

### 2. RLSPolicyAnalyzer

Specialized analyzer for Row Level Security policies and Supabase schema detection.

```typescript
import { RLSPolicyAnalyzer } from './rls-policy-analyzer'

const rlsAnalyzer = new RLSPolicyAnalyzer(environment)
const rlsAnalysis = await rlsAnalyzer.analyzeRLSPolicies(['public'])
const supabaseInfo = await rlsAnalyzer.detectSupabaseSchemas()
```

**Features:**
- Analyzes RLS policies across all tables
- Identifies security gaps and misconfigurations
- Detects Supabase-specific schemas (auth, storage, realtime)
- Generates policy recommendations
- Provides security assessment reports

### 3. SchemaComparator

Compares database schemas and detects differences between environments.

```typescript
import { SchemaComparator } from './schema-comparator'

const comparator = new SchemaComparator()
const diff = await comparator.compareSchemas(sourceSchema, targetSchema, {
  ignoreComments: true,
  dependencyAnalysis: true
})
```

**Features:**
- Detects differences in tables, functions, triggers, indexes, and policies
- Performs dependency analysis for proper ordering
- Categorizes changes by type and priority
- Provides detailed change summaries

### 4. MigrationGenerator

Generates SQL migration scripts from schema differences with rollback support.

```typescript
import { MigrationGenerator } from './migration-generator'

const generator = new MigrationGenerator()
const migration = await generator.generateMigrationScript(schemaDiff, {
  includeRollback: true,
  addComments: true,
  safeMode: true
})
```

**Features:**
- Generates dependency-aware migration scripts
- Creates rollback scripts for failed migrations
- Includes risk assessment and duration estimates
- Supports safe mode with extra validation
- Handles complex schema changes (tables, functions, triggers, policies)

## Usage Examples

### Complete Schema Analysis Workflow

```typescript
import { 
  PostgreSQLSchemaAnalyzer,
  SchemaComparator,
  MigrationGenerator 
} from './schema-analysis'

// 1. Analyze source schema
const sourceAnalyzer = new PostgreSQLSchemaAnalyzer(productionEnv)
const sourceSchema = await sourceAnalyzer.analyzeSchema()

// 2. Analyze target schema
const targetAnalyzer = new PostgreSQLSchemaAnalyzer(testEnv)
const targetSchema = await targetAnalyzer.analyzeSchema()

// 3. Compare schemas
const comparator = new SchemaComparator()
const diff = await comparator.compareSchemas(sourceSchema.schema, targetSchema.schema)

// 4. Generate migration script
const generator = new MigrationGenerator()
const migration = await generator.generateMigrationScript(diff)

console.log(`Generated ${migration.operations.length} migration operations`)
```

### RLS Security Analysis

```typescript
import { RLSPolicyAnalyzer } from './rls-policy-analyzer'

const rlsAnalyzer = new RLSPolicyAnalyzer(environment)

// Analyze RLS policies
const analysis = await rlsAnalyzer.analyzeRLSPolicies(['public', 'audit'])

// Check for security gaps
analysis.securityGaps.forEach(gap => {
  console.log(`${gap.severity}: ${gap.description} in ${gap.tableName}`)
  console.log(`Recommendation: ${gap.recommendation}`)
})

// Generate policy recommendations
const recommendations = await rlsAnalyzer.generatePolicyRecommendations('users')
console.log(recommendations.join('\n'))
```

## Schema Analysis Options

### PostgreSQLSchemaAnalyzer Options

```typescript
interface SchemaAnalysisOptions {
  includeSystemTables: boolean    // Include system/internal tables
  includeViews: boolean          // Include database views
  includeFunctions: boolean      // Include stored functions
  includeTriggers: boolean       // Include triggers
  includePolicies: boolean       // Include RLS policies
  includeIndexes: boolean        // Include indexes
  includeExtensions: boolean     // Include extensions
  schemasToAnalyze?: string[]    // Specific schemas to analyze
  tablesToExclude?: string[]     // Tables to exclude from analysis
}
```

### Schema Comparison Options

```typescript
interface ComparisonOptions {
  ignoreComments: boolean        // Ignore comment differences
  ignoreIndexes: boolean         // Ignore index differences
  ignorePolicies: boolean        // Ignore policy differences
  ignoreExtensions: boolean      // Ignore extension differences
  customIgnorePatterns: string[] // Custom patterns to ignore
  dependencyAnalysis: boolean    // Perform dependency analysis
}
```

### Migration Generation Options

```typescript
interface MigrationGeneratorOptions {
  includeRollback: boolean       // Generate rollback scripts
  validateSyntax: boolean        // Validate SQL syntax
  addComments: boolean           // Add descriptive comments
  batchSize: number             // Batch size for operations
  timeoutPerOperation: number    // Timeout per operation (ms)
  safeMode: boolean             // Extra safety checks
}
```

## Error Handling

The system includes comprehensive error handling with specific error types:

- `SchemaAnalysisError`: Errors during schema analysis
- `SchemaDiffError`: Errors during schema comparison
- `MigrationGenerationError`: Errors during migration generation

```typescript
try {
  const analysis = await analyzer.analyzeSchema()
} catch (error) {
  if (error instanceof SchemaAnalysisError) {
    console.error('Schema analysis failed:', error.message)
    // Handle schema analysis specific error
  }
}
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

### Requirement 4.1 (Schema Synchronization)
- ✅ Automatically detects differences between environments
- ✅ Includes tables, triggers, functions, and audit/conversations/reservations schemas
- ✅ Handles complex schema structures

### Requirement 4.2 (Migration Generation)
- ✅ Generates migration scripts with proper dependency ordering
- ✅ Preserves data relationships and constraints
- ✅ Includes rollback capabilities

### Requirement 10.1 & 10.2 (Schema Migration)
- ✅ Detects new tables and functions automatically
- ✅ Proposes migrations to test environments
- ✅ Preserves existing data during migrations

## Integration

This schema analysis system integrates with:
- Environment management system for database connections
- Production safety guards for read-only access
- Validation engine for post-migration verification
- Logging system for operation tracking

## Performance Considerations

- Uses connection pooling for database queries
- Implements parallel analysis where possible
- Provides progress tracking for long operations
- Includes timeout handling for large schemas

## Security Features

- Enforces read-only access to production environments
- Validates environment types before operations
- Includes security gap detection for RLS policies
- Provides risk assessment for migration operations