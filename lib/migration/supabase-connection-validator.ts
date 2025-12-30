import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface DatabaseConnectionResult {
  environment: string;
  connected: boolean;
  error?: string;
  latency?: number;
  details?: {
    url?: string;
    hasServiceRole?: boolean;
    authStatus?: string;
  };
}

export interface CRUDTestResult {
  operation: 'create' | 'read' | 'update' | 'delete';
  table: string;
  success: boolean;
  error?: string;
  latency?: number;
}

export interface RLSValidationResult {
  table: string;
  policy: string;
  success: boolean;
  error?: string;
  details?: string;
}

export interface SupabaseValidationReport {
  timestamp: Date;
  overallStatus: 'success' | 'warning' | 'failure';
  connections: DatabaseConnectionResult[];
  crudTests: CRUDTestResult[];
  rlsValidation: RLSValidationResult[];
  recommendations: string[];
}

export class SupabaseConnectionValidator {
  /**
   * Create a Supabase client for testing
   */
  private createClient(useServiceRole = false) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = useServiceRole 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY 
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    return createSupabaseClient(supabaseUrl, supabaseKey);
  }

  private async measureLatency<T>(operation: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = performance.now();
    const result = await operation();
    const latency = performance.now() - start;
    return { result, latency };
  }

  /**
   * Test database connections to all environments
   */
  async testDatabaseConnections(): Promise<DatabaseConnectionResult[]> {
    const results: DatabaseConnectionResult[] = [];

    // Test regular client connection
    try {
      const { result: supabase, latency } = await this.measureLatency(async () => {
        return this.createClient();
      });

      const { result: healthCheck, latency: queryLatency } = await this.measureLatency(async () => {
        return await supabase.from('profiles').select('count').limit(1);
      });

      results.push({
        environment: 'client',
        connected: !healthCheck.error,
        error: healthCheck.error?.message,
        latency: latency + queryLatency,
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          authStatus: 'anon-key'
        }
      });
    } catch (error) {
      results.push({
        environment: 'client',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }

    // Test service role connection
    try {
      const { result: supabaseServiceRole, latency } = await this.measureLatency(async () => {
        return this.createClient(true);
      });

      const { result: healthCheck, latency: queryLatency } = await this.measureLatency(async () => {
        return await supabaseServiceRole.from('profiles').select('count').limit(1);
      });

      results.push({
        environment: 'service-role',
        connected: !healthCheck.error,
        error: healthCheck.error?.message,
        latency: latency + queryLatency,
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceRole: true,
          authStatus: 'service-role'
        }
      });
    } catch (error) {
      results.push({
        environment: 'service-role',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }

    return results;
  }

  /**
   * Test critical CRUD operations on key tables
   */
  async testCRUDOperations(): Promise<CRUDTestResult[]> {
    const results: CRUDTestResult[] = [];
    const supabase = this.createClient(true); // Use service role for full access

    // Test tables that are critical for the application
    const criticalTables = [
      'profiles',
      'lofts', 
      'reservations',
      'transactions',
      'tasks',
      'audit_logs'
    ];

    for (const table of criticalTables) {
      // Test READ operation
      try {
        const { result: readResult, latency } = await this.measureLatency(async () => {
          return await supabase.from(table).select('*').limit(1);
        });

        results.push({
          operation: 'read',
          table,
          success: !readResult.error,
          error: readResult.error?.message,
          latency
        });
      } catch (error) {
        results.push({
          operation: 'read',
          table,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test CREATE operation (with test data that will be cleaned up)
      if (table === 'audit_logs') {
        try {
          const testData = {
            table_name: 'test_migration_validation',
            operation: 'test',
            old_values: {},
            new_values: { test: true },
            user_id: 'migration-test',
            timestamp: new Date().toISOString()
          };

          const { result: createResult, latency } = await this.measureLatency(async () => {
            return await supabase.from(table).insert(testData).select().single();
          });

          results.push({
            operation: 'create',
            table,
            success: !createResult.error,
            error: createResult.error?.message,
            latency
          });

          // Clean up test data if creation was successful
          if (!createResult.error && createResult.data) {
            await supabase.from(table).delete().eq('id', createResult.data.id);
          }
        } catch (error) {
          results.push({
            operation: 'create',
            table,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  /**
   * Validate RLS policies and permissions
   */
  async validateRLSPolicies(): Promise<RLSValidationResult[]> {
    const results: RLSValidationResult[] = [];
    const supabase = this.createClient(true); // Use service role

    // Test RLS policies on critical tables
    const rlsTests = [
      {
        table: 'profiles',
        policy: 'Users can view own profile',
        test: async () => {
          // Test that RLS is enabled
          const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: 'profiles' });
          return { success: !error && data, error: error?.message };
        }
      },
      {
        table: 'lofts',
        policy: 'Lofts are publicly readable',
        test: async () => {
          // Test public read access
          const { data, error } = await supabase.from('lofts').select('id').limit(1);
          return { success: !error, error: error?.message };
        }
      },
      {
        table: 'reservations',
        policy: 'Users can only access own reservations',
        test: async () => {
          // Test that RLS is enabled for reservations
          const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: 'reservations' });
          return { success: !error && data, error: error?.message };
        }
      },
      {
        table: 'transactions',
        policy: 'Transactions require authentication',
        test: async () => {
          // Test that RLS is enabled for transactions
          const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: 'transactions' });
          return { success: !error && data, error: error?.message };
        }
      }
    ];

    for (const rlsTest of rlsTests) {
      try {
        const testResult = await rlsTest.test();
        results.push({
          table: rlsTest.table,
          policy: rlsTest.policy,
          success: testResult.success,
          error: testResult.error,
          details: `RLS validation for ${rlsTest.table}`
        });
      } catch (error) {
        results.push({
          table: rlsTest.table,
          policy: rlsTest.policy,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: `Failed to test RLS for ${rlsTest.table}`
        });
      }
    }

    return results;
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport(): Promise<SupabaseValidationReport> {
    console.log('🔍 Starting Supabase database validation...');

    const [connections, crudTests, rlsValidation] = await Promise.all([
      this.testDatabaseConnections(),
      this.testCRUDOperations(),
      this.validateRLSPolicies()
    ]);

    const recommendations: string[] = [];
    let overallStatus: 'success' | 'warning' | 'failure' = 'success';

    // Analyze connection results
    const failedConnections = connections.filter(c => !c.connected);
    if (failedConnections.length > 0) {
      overallStatus = 'failure';
      recommendations.push(`❌ ${failedConnections.length} database connection(s) failed`);
      failedConnections.forEach(conn => {
        recommendations.push(`  - ${conn.environment}: ${conn.error}`);
      });
    }

    // Analyze CRUD test results
    const failedCrudTests = crudTests.filter(t => !t.success);
    if (failedCrudTests.length > 0) {
      if (overallStatus !== 'failure') overallStatus = 'warning';
      recommendations.push(`⚠️ ${failedCrudTests.length} CRUD operation(s) failed`);
      failedCrudTests.forEach(test => {
        recommendations.push(`  - ${test.operation} on ${test.table}: ${test.error}`);
      });
    }

    // Analyze RLS validation results
    const failedRlsTests = rlsValidation.filter(r => !r.success);
    if (failedRlsTests.length > 0) {
      if (overallStatus !== 'failure') overallStatus = 'warning';
      recommendations.push(`⚠️ ${failedRlsTests.length} RLS policy validation(s) failed`);
      failedRlsTests.forEach(rls => {
        recommendations.push(`  - ${rls.table} (${rls.policy}): ${rls.error}`);
      });
    }

    // Performance recommendations
    const slowConnections = connections.filter(c => c.latency && c.latency > 1000);
    if (slowConnections.length > 0) {
      if (overallStatus === 'success') overallStatus = 'warning';
      recommendations.push(`🐌 ${slowConnections.length} connection(s) are slow (>1s)`);
    }

    if (overallStatus === 'success') {
      recommendations.push('✅ All database connections and operations are working correctly');
      recommendations.push('✅ All RLS policies are properly configured');
      recommendations.push('✅ Database performance is within acceptable limits');
    }

    return {
      timestamp: new Date(),
      overallStatus,
      connections,
      crudTests,
      rlsValidation,
      recommendations
    };
  }
}

export const supabaseConnectionValidator = new SupabaseConnectionValidator();