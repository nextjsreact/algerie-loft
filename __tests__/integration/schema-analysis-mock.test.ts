/**
 * Schema Analysis Integration Tests with Mocked Data
 * 
 * Tests schema analysis components with mocked database responses
 * to ensure functionality without requiring real database connections
 */

import { SchemaComparator } from '@/lib/environment-management/schema-analysis/schema-comparator'
import { MigrationGenerator } from '@/lib/environment-management/schema-analysis/migration-generator'
import {
  SchemaDefinition,
  TableDefinition,
  FunctionDefinition,
  TriggerDefinition,
  IndexDefinition,
  PolicyDefinition,
  ExtensionDefinition,
  ColumnDefinition,
  ConstraintDefinition,
  SchemaDiff,
  MigrationScript,
  ComparisonOptions,
  MigrationGeneratorOptions
} from '@/lib/environment-management/schema-analysis/types'

describe('Schema Analysis Integration Tests (Mocked)', () => {
  let comparator: SchemaComparator
  let migrationGenerator: MigrationGenerator

  beforeAll(() => {
    comparator = new SchemaComparator()
    migrationGenerator = new MigrationGenerator()
  })

  describe('Schema Comparison with Known Differences', () => {
    let sourceSchema: SchemaDefinition
    let targetSchema: SchemaDefinition
    let schemaDiff: SchemaDiff

    beforeAll(() => {
      // Create mock source schema (complete)
      sourceSchema = createMockSourceSchema()
      
      // Create mock target schema (with differences)
      targetSchema = createMockTargetSchema()
    })

    test('should detect table differences between schemas', async () => {
      const options: ComparisonOptions = {
        ignoreComments: true,
        ignoreIndexes: false,
        ignorePolicies: false,
        ignoreExtensions: false,
        customIgnorePatterns: [],
        dependencyAnalysis: true
      }

      schemaDiff = await comparator.compareSchemas(sourceSchema, targetSchema, options)

      // Verify diff structure
      expect(schemaDiff).toBeDefined()
      expect(schemaDiff.differences).toBeDefined()
      expect(schemaDiff.summary).toBeDefined()
      expect(schemaDiff.generatedAt).toBeDefined()

      // Verify specific differences
      expect(schemaDiff.differences.length).toBeGreaterThan(0)

      // Should detect missing table in target
      const missingTableDiff = schemaDiff.differences.find(d => 
        d.type === 'table' && 
        d.action === 'create' && 
        d.objectName === 'users'
      )
      expect(missingTableDiff).toBeDefined()
      expect(missingTableDiff?.details.reason).toContain('exists in source but not in target')

      // Should detect extra table in target
      const extraTableDiff = schemaDiff.differences.find(d => 
        d.type === 'table' && 
        d.action === 'drop' && 
        d.objectName === 'profiles'
      )
      expect(extraTableDiff).toBeDefined()

      console.log(`Schema comparison found ${schemaDiff.differences.length} differences`)
    })

    test('should detect function differences', async () => {
      // Should detect missing function in target
      const missingFunctionDiff = schemaDiff.differences.find(d => 
        d.type === 'function' && 
        d.action === 'create' && 
        d.objectName === 'audit_function'
      )
      expect(missingFunctionDiff).toBeDefined()

      // Should detect function body differences
      const alteredFunctionDiff = schemaDiff.differences.find(d => 
        d.type === 'function' && 
        d.action === 'alter' &&
        d.objectName === 'user_count'
      )
      expect(alteredFunctionDiff).toBeDefined()
      expect(alteredFunctionDiff?.details.before).toBeDefined()
      expect(alteredFunctionDiff?.details.after).toBeDefined()
    })

    test('should detect trigger differences', async () => {
      // Should detect missing trigger in target
      const missingTriggerDiff = schemaDiff.differences.find(d => 
        d.type === 'trigger' && 
        d.action === 'create' && 
        d.objectName === 'audit_trigger'
      )
      expect(missingTriggerDiff).toBeDefined()
      expect(missingTriggerDiff?.dependencies).toContain('public.users')
      expect(missingTriggerDiff?.dependencies).toContain('public.audit_function')
    })

    test('should detect policy differences', async () => {
      // Should detect missing policy in target
      const missingPolicyDiff = schemaDiff.differences.find(d => 
        d.type === 'policy' && 
        d.action === 'create' && 
        d.objectName === 'user_policy'
      )
      expect(missingPolicyDiff).toBeDefined()
      expect(missingPolicyDiff?.dependencies).toContain('public.users')

      // Should detect policy differences (create or drop)
      const policyDifferences = schemaDiff.differences.filter(d => d.type === 'policy')
      expect(policyDifferences.length).toBeGreaterThan(0)
      
      // Log policy differences for debugging
      console.log('Policy differences found:', policyDifferences.map(d => `${d.action} ${d.objectName}`))
    })

    test('should detect index differences', async () => {
      // Should detect missing index in target
      const missingIndexDiff = schemaDiff.differences.find(d => 
        d.type === 'index' && 
        d.action === 'create' && 
        d.objectName === 'users_email_idx'
      )
      expect(missingIndexDiff).toBeDefined()
      expect(missingIndexDiff?.dependencies).toContain('public.users')
    })

    test('should properly order differences by dependencies', async () => {
      // Verify dependency ordering
      const tableDiff = schemaDiff.differences.find(d => 
        d.type === 'table' && d.objectName === 'users'
      )
      const triggerDiff = schemaDiff.differences.find(d => 
        d.type === 'trigger' && d.objectName === 'audit_trigger'
      )
      const functionDiff = schemaDiff.differences.find(d => 
        d.type === 'function' && d.objectName === 'audit_function'
      )

      if (tableDiff && triggerDiff && functionDiff) {
        // Table should come before trigger
        expect(tableDiff.priority).toBeLessThan(triggerDiff.priority!)
        // Function should come before trigger
        expect(functionDiff.priority).toBeLessThan(triggerDiff.priority!)
      }
    })

    test('should generate accurate summary statistics', async () => {
      const summary = schemaDiff.summary

      expect(summary.totalDifferences).toBe(schemaDiff.differences.length)
      expect(summary.tableChanges).toBeGreaterThan(0)
      expect(summary.functionChanges).toBeGreaterThan(0)
      expect(summary.triggerChanges).toBeGreaterThan(0)
      expect(summary.indexChanges).toBeGreaterThan(0)
      expect(summary.policyChanges).toBeGreaterThan(0)

      // Verify summary matches actual differences
      const actualTableChanges = schemaDiff.differences.filter(d => d.type === 'table').length
      expect(summary.tableChanges).toBe(actualTableChanges)
    })
  })

  describe('Migration Script Generation and Validation', () => {
    let migrationScript: MigrationScript
    let schemaDiff: SchemaDiff

    beforeAll(async () => {
      // Create schema diff for migration generation
      const sourceSchema = createMockSourceSchema()
      const targetSchema = createMockTargetSchema()
      
      schemaDiff = await comparator.compareSchemas(sourceSchema, targetSchema)
    })

    test('should generate migration script from schema differences', async () => {
      const options: MigrationGeneratorOptions = {
        includeRollback: true,
        validateSyntax: false,
        addComments: true,
        batchSize: 100,
        timeoutPerOperation: 30000,
        safeMode: true
      }

      migrationScript = await migrationGenerator.generateMigrationScript(schemaDiff, options)

      // Verify migration script structure
      expect(migrationScript).toBeDefined()
      expect(migrationScript.id).toBeDefined()
      expect(migrationScript.operations).toBeDefined()
      expect(migrationScript.rollbackOperations).toBeDefined()
      expect(migrationScript.dependencies).toBeDefined()
      expect(migrationScript.estimatedDuration).toBeGreaterThan(0)
      expect(migrationScript.riskLevel).toBeDefined()

      // Verify operations are generated
      expect(migrationScript.operations.length).toBeGreaterThan(0)
      expect(migrationScript.rollbackOperations.length).toBeGreaterThan(0)

      console.log(`Migration script generated with ${migrationScript.operations.length} operations`)
      console.log(`Estimated duration: ${migrationScript.estimatedDuration}ms, Risk level: ${migrationScript.riskLevel}`)
    })

    test('should generate correct CREATE TABLE operations', async () => {
      const createTableOp = migrationScript.operations.find(op => 
        op.description.includes('Create table') && 
        op.description.includes('users')
      )

      expect(createTableOp).toBeDefined()
      expect(createTableOp?.type).toBe('ddl')
      expect(createTableOp?.sql).toContain('CREATE TABLE')
      expect(createTableOp?.sql).toContain('users')
      expect(createTableOp?.sql).toContain('id uuid')
      expect(createTableOp?.sql).toContain('email character varying')
      expect(createTableOp?.sql).toContain('NOT NULL')
      expect(createTableOp?.riskLevel).toBe('low')
    })

    test('should generate correct ALTER TABLE operations', async () => {
      const alterTableOp = migrationScript.operations.find(op => 
        op.description.includes('Alter table') && 
        op.description.includes('posts')
      )

      if (alterTableOp) {
        expect(alterTableOp.type).toBe('ddl')
        expect(alterTableOp.sql).toContain('ALTER TABLE')
        expect(alterTableOp.sql).toContain('posts')
        expect(alterTableOp.riskLevel).toBe('medium')
      }
    })

    test('should generate correct CREATE FUNCTION operations', async () => {
      const createFunctionOp = migrationScript.operations.find(op => 
        op.description.includes('Create function') && 
        op.description.includes('audit_function')
      )

      expect(createFunctionOp).toBeDefined()
      expect(createFunctionOp?.sql).toContain('CREATE OR REPLACE FUNCTION')
      expect(createFunctionOp?.sql).toContain('audit_function')
      expect(createFunctionOp?.sql).toContain('RETURNS trigger')
      expect(createFunctionOp?.sql).toContain('LANGUAGE plpgsql')
    })

    test('should generate correct CREATE TRIGGER operations', async () => {
      const createTriggerOp = migrationScript.operations.find(op => 
        op.description.includes('Create trigger') && 
        op.description.includes('audit_trigger')
      )

      expect(createTriggerOp).toBeDefined()
      expect(createTriggerOp?.sql).toContain('CREATE TRIGGER')
      expect(createTriggerOp?.sql).toContain('audit_trigger')
      expect(createTriggerOp?.sql).toContain('AFTER')
      expect(createTriggerOp?.sql).toContain('INSERT OR UPDATE')
      expect(createTriggerOp?.sql).toContain('EXECUTE FUNCTION')
      expect(createTriggerOp?.dependencies).toContain('public.users')
      expect(createTriggerOp?.dependencies).toContain('public.audit_function')
    })

    test('should generate correct CREATE INDEX operations', async () => {
      const createIndexOp = migrationScript.operations.find(op => 
        op.description.includes('Create index') && 
        op.description.includes('users_email_idx')
      )

      expect(createIndexOp).toBeDefined()
      expect(createIndexOp?.sql).toContain('CREATE UNIQUE INDEX CONCURRENTLY')
      expect(createIndexOp?.sql).toContain('users_email_idx')
      expect(createIndexOp?.sql).toContain('ON public.users')
      expect(createIndexOp?.sql).toContain('USING btree')
    })

    test('should generate correct CREATE POLICY operations', async () => {
      const createPolicyOp = migrationScript.operations.find(op => 
        op.description.includes('Create policy') && 
        op.description.includes('user_policy')
      )

      expect(createPolicyOp).toBeDefined()
      expect(createPolicyOp?.sql).toContain('CREATE POLICY')
      expect(createPolicyOp?.sql).toContain('user_policy')
      expect(createPolicyOp?.sql).toContain('ON public.users')
      expect(createPolicyOp?.sql).toContain('AS PERMISSIVE')
      expect(createPolicyOp?.sql).toContain('FOR ALL')
    })

    test('should generate rollback operations in reverse order', async () => {
      expect(migrationScript.rollbackOperations.length).toBeGreaterThan(0)

      // Find corresponding rollback operations
      const rollbackTableOp = migrationScript.rollbackOperations.find(op => 
        op.description.includes('Drop table') && 
        op.description.includes('users')
      )

      expect(rollbackTableOp).toBeDefined()
      expect(rollbackTableOp?.sql).toContain('DROP TABLE')
      expect(rollbackTableOp?.sql).toContain('users')
    })

    test('should properly order operations by dependencies', async () => {
      // Find operations
      const tableOp = migrationScript.operations.find(op => 
        op.description.includes('Create table users')
      )
      const functionOp = migrationScript.operations.find(op => 
        op.description.includes('Create function audit_function')
      )
      const triggerOp = migrationScript.operations.find(op => 
        op.description.includes('Create trigger audit_trigger')
      )

      if (tableOp && functionOp && triggerOp) {
        const tableIndex = migrationScript.operations.indexOf(tableOp)
        const functionIndex = migrationScript.operations.indexOf(functionOp)
        const triggerIndex = migrationScript.operations.indexOf(triggerOp)

        // Table and function should come before trigger
        expect(tableIndex).toBeLessThan(triggerIndex)
        expect(functionIndex).toBeLessThan(triggerIndex)
      }
    })

    test('should validate migration script SQL syntax', async () => {
      // Basic SQL syntax validation
      for (const operation of migrationScript.operations) {
        expect(operation.sql).toBeDefined()
        expect(operation.sql.length).toBeGreaterThan(0)
        
        // SQL can start with comments, so check for SQL keywords anywhere in the first few lines
        const sqlLines = operation.sql.split('\n').filter(line => line.trim() && !line.trim().startsWith('--'))
        expect(sqlLines.length).toBeGreaterThan(0)
        expect(sqlLines[0]).toMatch(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/i)
        
        expect(operation.sql).toMatch(/;$/m) // Should end with semicolon
      }
    })

    test('should calculate realistic duration estimates', async () => {
      expect(migrationScript.estimatedDuration).toBeGreaterThan(0)
      
      // Duration should be sum of individual operations
      const totalDuration = migrationScript.operations.reduce(
        (sum, op) => sum + op.estimatedDuration, 0
      )
      expect(migrationScript.estimatedDuration).toBe(totalDuration)
    })

    test('should assess risk levels appropriately', async () => {
      expect(['low', 'medium', 'high']).toContain(migrationScript.riskLevel)

      // Check individual operation risk levels
      const dropOperations = migrationScript.operations.filter(op => 
        op.description.includes('Drop')
      )
      dropOperations.forEach(op => {
        expect(['medium', 'high']).toContain(op.riskLevel)
      })

      const createOperations = migrationScript.operations.filter(op => 
        op.description.includes('Create')
      )
      createOperations.forEach(op => {
        expect(['low', 'medium']).toContain(op.riskLevel)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty schema gracefully', async () => {
      const emptySchema: SchemaDefinition = {
        schemas: ['public'],
        tables: [],
        functions: [],
        triggers: [],
        indexes: [],
        policies: [],
        extensions: [],
        analyzedAt: new Date()
      }

      const sourceSchema = createMockSourceSchema()
      const diff = await comparator.compareSchemas(sourceSchema, emptySchema)

      expect(diff).toBeDefined()
      expect(diff.differences.length).toBeGreaterThan(0)
      expect(diff.summary.totalDifferences).toBe(diff.differences.length)
    })

    test('should handle identical schemas', async () => {
      const schema = createMockSourceSchema()
      const diff = await comparator.compareSchemas(schema, schema)

      expect(diff).toBeDefined()
      expect(diff.differences.length).toBe(0)
      expect(diff.summary.totalDifferences).toBe(0)
    })

    test('should handle invalid migration operations', async () => {
      const invalidDiff: SchemaDiff = {
        sourceSchema: 'source',
        targetSchema: 'target',
        differences: [{
          type: 'table',
          action: 'create',
          objectName: 'invalid_table',
          schemaName: 'public',
          details: {
            after: null, // Invalid: missing table definition
            reason: 'Test invalid operation'
          },
          dependencies: [],
          priority: 1
        }],
        summary: {
          totalDifferences: 1,
          tableChanges: 1,
          functionChanges: 0,
          triggerChanges: 0,
          indexChanges: 0,
          policyChanges: 0,
          extensionChanges: 0
        },
        generatedAt: new Date()
      }

      await expect(migrationGenerator.generateMigrationScript(invalidDiff))
        .rejects.toThrow()
    })
  })

  // Helper functions to create mock schemas
  function createMockSourceSchema(): SchemaDefinition {
    const usersTable: TableDefinition = {
      schemaName: 'public',
      tableName: 'users',
      columns: [
        {
          columnName: 'id',
          dataType: 'uuid',
          isNullable: false,
          defaultValue: 'gen_random_uuid()',
          isIdentity: false
        },
        {
          columnName: 'email',
          dataType: 'character varying',
          isNullable: false,
          maxLength: 255,
          isIdentity: false
        },
        {
          columnName: 'name',
          dataType: 'character varying',
          isNullable: true,
          maxLength: 100,
          isIdentity: false
        },
        {
          columnName: 'created_at',
          dataType: 'timestamp with time zone',
          isNullable: false,
          defaultValue: 'now()',
          isIdentity: false
        }
      ],
      constraints: [
        {
          constraintName: 'users_pkey',
          constraintType: 'PRIMARY KEY',
          columnNames: ['id']
        },
        {
          constraintName: 'users_email_key',
          constraintType: 'UNIQUE',
          columnNames: ['email']
        }
      ],
      indexes: [
        {
          schemaName: 'public',
          tableName: 'users',
          indexName: 'users_email_idx',
          indexType: 'btree',
          columns: [{ columnName: 'email', sortOrder: 'ASC' }],
          isUnique: true,
          isPrimary: false
        }
      ],
      triggers: [
        {
          schemaName: 'public',
          tableName: 'users',
          triggerName: 'audit_trigger',
          timing: 'AFTER',
          events: ['INSERT', 'UPDATE'],
          orientation: 'ROW',
          functionSchema: 'public',
          functionName: 'audit_function'
        }
      ],
      policies: [
        {
          schemaName: 'public',
          tableName: 'users',
          policyName: 'user_policy',
          command: 'ALL',
          roles: ['public'],
          usingExpression: 'auth.uid() = id',
          isPermissive: true
        }
      ]
    }

    const postsTable: TableDefinition = {
      schemaName: 'public',
      tableName: 'posts',
      columns: [
        {
          columnName: 'id',
          dataType: 'uuid',
          isNullable: false,
          defaultValue: 'gen_random_uuid()',
          isIdentity: false
        },
        {
          columnName: 'user_id',
          dataType: 'uuid',
          isNullable: false,
          isIdentity: false
        },
        {
          columnName: 'title',
          dataType: 'character varying',
          isNullable: false,
          maxLength: 200,
          isIdentity: false
        },
        {
          columnName: 'content',
          dataType: 'text',
          isNullable: true,
          isIdentity: false
        }
      ],
      constraints: [
        {
          constraintName: 'posts_pkey',
          constraintType: 'PRIMARY KEY',
          columnNames: ['id']
        },
        {
          constraintName: 'posts_user_id_fkey',
          constraintType: 'FOREIGN KEY',
          columnNames: ['user_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          referencedSchema: 'public'
        }
      ],
      indexes: [],
      triggers: [],
      policies: [
        {
          schemaName: 'public',
          tableName: 'posts',
          policyName: 'posts_policy',
          command: 'ALL',
          roles: ['public'],
          usingExpression: 'auth.uid() = user_id',
          isPermissive: true
        }
      ]
    }

    const auditFunction: FunctionDefinition = {
      schemaName: 'public',
      functionName: 'audit_function',
      returnType: 'trigger',
      parameters: [],
      language: 'plpgsql',
      body: 'BEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;',
      isSecurityDefiner: false,
      volatility: 'VOLATILE'
    }

    const userCountFunction: FunctionDefinition = {
      schemaName: 'public',
      functionName: 'user_count',
      returnType: 'integer',
      parameters: [],
      language: 'sql',
      body: 'SELECT count(*)::integer FROM public.users;',
      isSecurityDefiner: false,
      volatility: 'STABLE'
    }

    return {
      schemas: ['public'],
      tables: [usersTable, postsTable],
      functions: [auditFunction, userCountFunction],
      triggers: usersTable.triggers,
      indexes: usersTable.indexes,
      policies: [...usersTable.policies, ...postsTable.policies],
      extensions: [],
      analyzedAt: new Date()
    }
  }

  function createMockTargetSchema(): SchemaDefinition {
    // Target schema has differences:
    // - Missing 'users' table
    // - Has 'profiles' table instead
    // - Missing 'audit_function'
    // - Different 'user_count' function body
    // - Different policy on posts

    const profilesTable: TableDefinition = {
      schemaName: 'public',
      tableName: 'profiles',
      columns: [
        {
          columnName: 'id',
          dataType: 'uuid',
          isNullable: false,
          defaultValue: 'gen_random_uuid()',
          isIdentity: false
        },
        {
          columnName: 'user_id',
          dataType: 'uuid',
          isNullable: false,
          isIdentity: false
        },
        {
          columnName: 'bio',
          dataType: 'text',
          isNullable: true,
          isIdentity: false
        }
      ],
      constraints: [
        {
          constraintName: 'profiles_pkey',
          constraintType: 'PRIMARY KEY',
          columnNames: ['id']
        }
      ],
      indexes: [],
      triggers: [],
      policies: []
    }

    const postsTable: TableDefinition = {
      schemaName: 'public',
      tableName: 'posts',
      columns: [
        {
          columnName: 'id',
          dataType: 'uuid',
          isNullable: false,
          defaultValue: 'gen_random_uuid()',
          isIdentity: false
        },
        {
          columnName: 'user_id',
          dataType: 'uuid',
          isNullable: false,
          isIdentity: false
        },
        {
          columnName: 'title',
          dataType: 'character varying',
          isNullable: false,
          maxLength: 200,
          isIdentity: false
        },
        {
          columnName: 'content',
          dataType: 'text',
          isNullable: true,
          isIdentity: false
        },
        {
          columnName: 'status',
          dataType: 'character varying',
          isNullable: true,
          maxLength: 20,
          defaultValue: "'draft'",
          isIdentity: false
        }
      ],
      constraints: [
        {
          constraintName: 'posts_pkey',
          constraintType: 'PRIMARY KEY',
          columnNames: ['id']
        }
      ],
      indexes: [],
      triggers: [],
      policies: [
        {
          schemaName: 'public',
          tableName: 'posts',
          policyName: 'posts_policy',
          command: 'SELECT', // Different from source (was ALL)
          roles: ['public'],
          usingExpression: 'true', // Different from source
          isPermissive: true
        }
      ]
    }

    const userCountFunction: FunctionDefinition = {
      schemaName: 'public',
      functionName: 'user_count',
      returnType: 'bigint', // Different return type
      parameters: [],
      language: 'sql',
      body: 'SELECT count(*) FROM public.users WHERE created_at > now() - interval \'1 day\';', // Different body
      isSecurityDefiner: false,
      volatility: 'STABLE'
    }

    return {
      schemas: ['public'],
      tables: [profilesTable, postsTable],
      functions: [userCountFunction], // Missing audit_function
      triggers: [],
      indexes: [],
      policies: postsTable.policies,
      extensions: [],
      analyzedAt: new Date()
    }
  }
})