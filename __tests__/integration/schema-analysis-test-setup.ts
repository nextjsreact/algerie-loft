/**
 * Schema Analysis Test Setup Utilities
 * 
 * Helper functions for setting up test databases and schemas
 * for integration testing of schema analysis components
 */

import { createClient } from '@supabase/supabase-js'

export interface TestDatabaseConfig {
  name: string
  supabaseUrl: string
  supabaseServiceKey: string
  schema: TestSchemaDefinition
}

export interface TestSchemaDefinition {
  tables: TestTableDefinition[]
  functions: TestFunctionDefinition[]
  triggers: TestTriggerDefinition[]
  policies: TestPolicyDefinition[]
  indexes: TestIndexDefinition[]
}

export interface TestTableDefinition {
  name: string
  schema: string
  columns: TestColumnDefinition[]
  constraints: TestConstraintDefinition[]
}

export interface TestColumnDefinition {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
  unique?: boolean
}

export interface TestConstraintDefinition {
  name: string
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
  columns: string[]
  referencedTable?: string
  referencedColumns?: string[]
}

export interface TestFunctionDefinition {
  name: string
  schema: string
  returnType: string
  language: string
  body: string
}

export interface TestTriggerDefinition {
  name: string
  table: string
  schema: string
  timing: 'BEFORE' | 'AFTER'
  events: string[]
  functionName: string
}

export interface TestPolicyDefinition {
  name: string
  table: string
  schema: string
  command: string
  expression: string
}

export interface TestIndexDefinition {
  name: string
  table: string
  schema: string
  columns: string[]
  unique: boolean
  type: string
}

/**
 * Test schema configurations for different scenarios
 */
export const TEST_SCHEMAS = {
  // Complete schema with all components
  COMPLETE: {
    tables: [
      {
        name: 'test_users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'email', type: 'character varying(255)', nullable: false, unique: true },
          { name: 'name', type: 'character varying(100)', nullable: true },
          { name: 'created_at', type: 'timestamp with time zone', nullable: false, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', nullable: false, defaultValue: 'now()' }
        ],
        constraints: [
          { name: 'test_users_pkey', type: 'PRIMARY KEY', columns: ['id'] },
          { name: 'test_users_email_key', type: 'UNIQUE', columns: ['email'] }
        ]
      },
      {
        name: 'test_posts',
        schema: 'public',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', nullable: false },
          { name: 'title', type: 'character varying(200)', nullable: false },
          { name: 'content', type: 'text', nullable: true },
          { name: 'created_at', type: 'timestamp with time zone', nullable: false, defaultValue: 'now()' }
        ],
        constraints: [
          { name: 'test_posts_pkey', type: 'PRIMARY KEY', columns: ['id'] },
          { 
            name: 'test_posts_user_id_fkey', 
            type: 'FOREIGN KEY', 
            columns: ['user_id'],
            referencedTable: 'test_users',
            referencedColumns: ['id']
          }
        ]
      }
    ],
    functions: [
      {
        name: 'test_audit_function',
        schema: 'public',
        returnType: 'trigger',
        language: 'plpgsql',
        body: `
          BEGIN
            NEW.updated_at = now();
            RETURN NEW;
          END;
        `
      },
      {
        name: 'test_user_count',
        schema: 'public',
        returnType: 'integer',
        language: 'sql',
        body: `
          SELECT count(*)::integer FROM public.test_users;
        `
      }
    ],
    triggers: [
      {
        name: 'test_audit_trigger',
        table: 'test_users',
        schema: 'public',
        timing: 'AFTER',
        events: ['INSERT', 'UPDATE'],
        functionName: 'test_audit_function'
      }
    ],
    policies: [
      {
        name: 'test_user_policy',
        table: 'test_users',
        schema: 'public',
        command: 'ALL',
        expression: 'auth.uid() = id'
      },
      {
        name: 'test_posts_policy',
        table: 'test_posts',
        schema: 'public',
        command: 'ALL',
        expression: 'auth.uid() = user_id'
      }
    ],
    indexes: [
      {
        name: 'test_users_email_idx',
        table: 'test_users',
        schema: 'public',
        columns: ['email'],
        unique: true,
        type: 'btree'
      },
      {
        name: 'test_posts_user_id_idx',
        table: 'test_posts',
        schema: 'public',
        columns: ['user_id'],
        unique: false,
        type: 'btree'
      }
    ]
  },

  // Minimal schema for basic testing
  MINIMAL: {
    tables: [
      {
        name: 'test_simple',
        schema: 'public',
        columns: [
          { name: 'id', type: 'serial', nullable: false },
          { name: 'name', type: 'text', nullable: true }
        ],
        constraints: [
          { name: 'test_simple_pkey', type: 'PRIMARY KEY', columns: ['id'] }
        ]
      }
    ],
    functions: [],
    triggers: [],
    policies: [],
    indexes: []
  },

  // Schema with differences for comparison testing
  MODIFIED: {
    tables: [
      {
        name: 'test_users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'email', type: 'character varying(255)', nullable: false, unique: true },
          { name: 'full_name', type: 'character varying(150)', nullable: true }, // Changed from 'name'
          { name: 'phone', type: 'character varying(20)', nullable: true }, // Added column
          { name: 'created_at', type: 'timestamp with time zone', nullable: false, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', nullable: false, defaultValue: 'now()' }
        ],
        constraints: [
          { name: 'test_users_pkey', type: 'PRIMARY KEY', columns: ['id'] },
          { name: 'test_users_email_key', type: 'UNIQUE', columns: ['email'] }
        ]
      },
      // Missing test_posts table
      {
        name: 'test_profiles', // New table
        schema: 'public',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', nullable: false },
          { name: 'bio', type: 'text', nullable: true }
        ],
        constraints: [
          { name: 'test_profiles_pkey', type: 'PRIMARY KEY', columns: ['id'] }
        ]
      }
    ],
    functions: [
      // Missing test_audit_function
      {
        name: 'test_user_count',
        schema: 'public',
        returnType: 'bigint', // Changed return type
        language: 'sql',
        body: `
          SELECT count(*) FROM public.test_users WHERE created_at > now() - interval '1 day';
        ` // Changed body
      }
    ],
    triggers: [], // No triggers
    policies: [
      {
        name: 'test_user_policy',
        table: 'test_users',
        schema: 'public',
        command: 'SELECT', // Changed from ALL
        expression: 'true' // Changed expression
      }
    ],
    indexes: [
      {
        name: 'test_users_email_idx',
        table: 'test_users',
        schema: 'public',
        columns: ['email'],
        unique: true,
        type: 'btree'
      }
      // Missing test_posts_user_id_idx
    ]
  }
}

/**
 * Database setup utility class
 */
export class TestDatabaseSetup {
  private supabase: any

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  /**
   * Create a complete test schema
   */
  async createSchema(schemaDefinition: TestSchemaDefinition): Promise<void> {
    console.log('Creating test schema...')

    try {
      // Create tables first
      for (const table of schemaDefinition.tables) {
        await this.createTable(table)
      }

      // Create functions
      for (const func of schemaDefinition.functions) {
        await this.createFunction(func)
      }

      // Create triggers (after functions and tables)
      for (const trigger of schemaDefinition.triggers) {
        await this.createTrigger(trigger)
      }

      // Create indexes
      for (const index of schemaDefinition.indexes) {
        await this.createIndex(index)
      }

      // Create policies (after tables)
      for (const policy of schemaDefinition.policies) {
        await this.createPolicy(policy)
      }

      console.log('✓ Test schema created successfully')
    } catch (error) {
      console.error('Failed to create test schema:', error)
      throw error
    }
  }

  /**
   * Create a table with columns and constraints
   */
  private async createTable(table: TestTableDefinition): Promise<void> {
    const columnDefs = table.columns.map(col => {
      let def = `${col.name} ${col.type}`
      if (!col.nullable) def += ' NOT NULL'
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`
      return def
    }).join(',\n  ')

    const constraintDefs = table.constraints.map(constraint => {
      switch (constraint.type) {
        case 'PRIMARY KEY':
          return `CONSTRAINT ${constraint.name} PRIMARY KEY (${constraint.columns.join(', ')})`
        case 'FOREIGN KEY':
          return `CONSTRAINT ${constraint.name} FOREIGN KEY (${constraint.columns.join(', ')}) REFERENCES ${constraint.referencedTable} (${constraint.referencedColumns?.join(', ')})`
        case 'UNIQUE':
          return `CONSTRAINT ${constraint.name} UNIQUE (${constraint.columns.join(', ')})`
        default:
          return `CONSTRAINT ${constraint.name} ${constraint.type}`
      }
    }).join(',\n  ')

    const sql = `
      CREATE TABLE IF NOT EXISTS ${table.schema}.${table.name} (
        ${columnDefs}${constraintDefs ? ',\n  ' + constraintDefs : ''}
      );
    `

    const { error } = await this.supabase.rpc('execute_sql', { query: sql })
    if (error) throw new Error(`Failed to create table ${table.name}: ${error.message}`)

    console.log(`✓ Created table ${table.schema}.${table.name}`)
  }

  /**
   * Create a function
   */
  private async createFunction(func: TestFunctionDefinition): Promise<void> {
    const sql = `
      CREATE OR REPLACE FUNCTION ${func.schema}.${func.name}()
      RETURNS ${func.returnType}
      LANGUAGE ${func.language}
      AS $$${func.body}$$;
    `

    const { error } = await this.supabase.rpc('execute_sql', { query: sql })
    if (error) throw new Error(`Failed to create function ${func.name}: ${error.message}`)

    console.log(`✓ Created function ${func.schema}.${func.name}`)
  }

  /**
   * Create a trigger
   */
  private async createTrigger(trigger: TestTriggerDefinition): Promise<void> {
    const events = trigger.events.join(' OR ')
    const sql = `
      CREATE TRIGGER ${trigger.name}
        ${trigger.timing} ${events} ON ${trigger.schema}.${trigger.table}
        FOR EACH ROW
        EXECUTE FUNCTION ${trigger.schema}.${trigger.functionName}();
    `

    const { error } = await this.supabase.rpc('execute_sql', { query: sql })
    if (error) throw new Error(`Failed to create trigger ${trigger.name}: ${error.message}`)

    console.log(`✓ Created trigger ${trigger.name}`)
  }

  /**
   * Create an index
   */
  private async createIndex(index: TestIndexDefinition): Promise<void> {
    const uniqueClause = index.unique ? 'UNIQUE ' : ''
    const sql = `
      CREATE ${uniqueClause}INDEX IF NOT EXISTS ${index.name}
        ON ${index.schema}.${index.table}
        USING ${index.type} (${index.columns.join(', ')});
    `

    const { error } = await this.supabase.rpc('execute_sql', { query: sql })
    if (error) throw new Error(`Failed to create index ${index.name}: ${error.message}`)

    console.log(`✓ Created index ${index.name}`)
  }

  /**
   * Create a policy
   */
  private async createPolicy(policy: TestPolicyDefinition): Promise<void> {
    // Enable RLS first
    await this.supabase.rpc('execute_sql', {
      query: `ALTER TABLE ${policy.schema}.${policy.table} ENABLE ROW LEVEL SECURITY;`
    })

    const sql = `
      CREATE POLICY ${policy.name} ON ${policy.schema}.${policy.table}
        AS PERMISSIVE
        FOR ${policy.command}
        TO public
        USING (${policy.expression});
    `

    const { error } = await this.supabase.rpc('execute_sql', { query: sql })
    if (error) throw new Error(`Failed to create policy ${policy.name}: ${error.message}`)

    console.log(`✓ Created policy ${policy.name}`)
  }

  /**
   * Clean up all test objects
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up test schema...')

    try {
      // Drop all test objects
      const cleanupQueries = [
        // Drop triggers first
        'DROP TRIGGER IF EXISTS test_audit_trigger ON public.test_users;',
        
        // Drop functions
        'DROP FUNCTION IF EXISTS public.test_audit_function();',
        'DROP FUNCTION IF EXISTS public.test_user_count();',
        
        // Drop tables (with CASCADE to handle dependencies)
        'DROP TABLE IF EXISTS public.test_posts CASCADE;',
        'DROP TABLE IF EXISTS public.test_users CASCADE;',
        'DROP TABLE IF EXISTS public.test_profiles CASCADE;',
        'DROP TABLE IF EXISTS public.test_simple CASCADE;',
        
        // Drop test schema if it exists
        'DROP SCHEMA IF EXISTS test_schema CASCADE;'
      ]

      for (const query of cleanupQueries) {
        await this.supabase.rpc('execute_sql', { query })
      }

      console.log('✓ Test schema cleaned up successfully')
    } catch (error) {
      console.error('Failed to clean up test schema:', error)
      // Don't throw - cleanup failures shouldn't fail tests
    }
  }

  /**
   * Verify schema exists
   */
  async verifySchema(expectedTables: string[]): Promise<boolean> {
    try {
      for (const tableName of expectedTables) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`Table ${tableName} does not exist or is not accessible`)
          return false
        }
      }
      return true
    } catch (error) {
      console.error('Schema verification failed:', error)
      return false
    }
  }

  /**
   * Insert test data
   */
  async insertTestData(): Promise<void> {
    try {
      // Insert test users
      await this.supabase.from('test_users').insert([
        {
          email: 'user1@test.com',
          name: 'Test User 1'
        },
        {
          email: 'user2@test.com',
          name: 'Test User 2'
        }
      ])

      console.log('✓ Test data inserted successfully')
    } catch (error) {
      console.error('Failed to insert test data:', error)
      // Don't throw - test data is optional
    }
  }
}

/**
 * Test environment factory
 */
export class TestEnvironmentFactory {
  static createTestEnvironments() {
    return {
      source: {
        id: 'test-source',
        name: 'Test Source',
        type: 'test' as const,
        supabaseUrl: process.env.TEST_SOURCE_SUPABASE_URL || 'http://localhost:54321',
        supabaseAnonKey: process.env.TEST_SOURCE_SUPABASE_ANON_KEY || 'test-anon-key',
        supabaseServiceKey: process.env.TEST_SOURCE_SUPABASE_SERVICE_KEY || 'test-service-key',
        databaseUrl: process.env.TEST_SOURCE_DATABASE_URL || 'postgresql://localhost:54322/test_source',
        status: 'active' as const,
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      target: {
        id: 'test-target',
        name: 'Test Target',
        type: 'test' as const,
        supabaseUrl: process.env.TEST_TARGET_SUPABASE_URL || 'http://localhost:54321',
        supabaseAnonKey: process.env.TEST_TARGET_SUPABASE_ANON_KEY || 'test-anon-key',
        supabaseServiceKey: process.env.TEST_TARGET_SUPABASE_SERVICE_KEY || 'test-service-key',
        databaseUrl: process.env.TEST_TARGET_DATABASE_URL || 'postgresql://localhost:54322/test_target',
        status: 'active' as const,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    }
  }
}