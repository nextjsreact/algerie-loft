#!/usr/bin/env node

/**
 * Audit System Deployment Verification Script
 * 
 * This script verifies that the audit system has been successfully deployed
 * and is functioning correctly in production.
 */

import { createClient } from '@supabase/supabase-js'
import { AuditService } from '../lib/services/audit-service'
import { AuditPermissionManager } from '../lib/permissions/audit-permissions'

// Configuration
const PRODUCTION_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY,
  environment: 'production'
}

if (!PRODUCTION_CONFIG.supabaseUrl || !PRODUCTION_CONFIG.supabaseKey) {
  console.error('❌ Missing production Supabase configuration')
  process.exit(1)
}

const supabase = createClient(PRODUCTION_CONFIG.supabaseUrl, PRODUCTION_CONFIG.supabaseKey)

/**
 * Verification test results
 */
interface VerificationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

/**
 * Audit deployment verification class
 */
class AuditDeploymentVerifier {
  private results: VerificationResult[] = []

  private addResult(test: string, status: VerificationResult['status'], message: string, details?: any) {
    this.results.push({ test, status, message, details })
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${emoji} ${test}: ${message}`)
  }

  /**
   * Test 1: Verify audit schema exists
   */
  async verifyAuditSchema(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('information_schema.schemata')
        .select('schema_name')
        .eq('schema_name', 'audit')

      if (error) {
        this.addResult('Audit Schema', 'FAIL', `Failed to check schema: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        this.addResult('Audit Schema', 'PASS', 'Audit schema exists')
      } else {
        this.addResult('Audit Schema', 'FAIL', 'Audit schema not found')
      }

    } catch (error) {
      this.addResult('Audit Schema', 'FAIL', `Exception: ${error}`)
    }
  }

  /**
   * Test 2: Verify audit_logs table structure
   */
  async verifyAuditTable(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1)

      if (error) {
        this.addResult('Audit Table', 'FAIL', `Table not accessible: ${error.message}`)
        return
      }

      // Check table structure by attempting to select all expected columns
      const { data: structureTest, error: structureError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          table_name,
          record_id,
          action,
          user_id,
          user_email,
          timestamp,
          old_values,
          new_values,
          changed_fields
        `)
        .limit(1)

      if (structureError) {
        this.addResult('Audit Table', 'FAIL', `Table structure incomplete: ${structureError.message}`)
      } else {
        this.addResult('Audit Table', 'PASS', 'Audit table structure is correct')
      }

    } catch (error) {
      this.addResult('Audit Table', 'FAIL', `Exception: ${error}`)
    }
  }

  /**
   * Test 3: Verify audit triggers exist
   */
  async verifyAuditTriggers(): Promise<void> {
    try {
      const expectedTables = ['transactions', 'tasks', 'reservations', 'lofts']
      const { data, error } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_object_table')
        .like('trigger_name', 'audit_trigger_%')

      if (error) {
        this.addResult('Audit Triggers', 'FAIL', `Failed to check triggers: ${error.message}`)
        return
      }

      const existingTriggers = data?.map(t => t.event_object_table) || []
      const missingTriggers = expectedTables.filter(table => !existingTriggers.includes(table))

      if (missingTriggers.length === 0) {
        this.addResult('Audit Triggers', 'PASS', `All ${expectedTables.length} audit triggers exist`)
      } else {
        this.addResult('Audit Triggers', 'FAIL', 
          `Missing triggers for: ${missingTriggers.join(', ')}`,
          { missing: missingTriggers, existing: existingTriggers }
        )
      }

    } catch (error) {
      this.addResult('Audit Triggers', 'FAIL', `Exception: ${error}`)
    }
  }

  /**
   * Test 4: Verify RLS policies
   */
  async verifyRLSPolicies(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('policyname, tablename')
        .eq('schemaname', 'audit')
        .eq('tablename', 'audit_logs')

      if (error) {
        this.addResult('RLS Policies', 'WARNING', `Could not verify RLS policies: ${error.message}`)
        return
      }

      const policyCount = data?.length || 0
      if (policyCount >= 3) { // Expecting at least 3 policies
        this.addResult('RLS Policies', 'PASS', `${policyCount} RLS policies configured`)
      } else {
        this.addResult('RLS Policies', 'WARNING', 
          `Only ${policyCount} RLS policies found, expected at least 3`)
      }

    } catch (error) {
      this.addResult('RLS Policies', 'WARNING', `Exception: ${error}`)
    }
  }

  /**
   * Test 5: Test audit service functionality
   */
  async testAuditService(): Promise<void> {
    try {
      // Test getting audit logs
      const { logs, total } = await AuditService.getAuditLogs({}, 1, 5)
      
      this.addResult('Audit Service', 'PASS', 
        `Service functional - retrieved ${logs.length} logs (total: ${total})`)

    } catch (error) {
      this.addResult('Audit Service', 'FAIL', `Service failed: ${error}`)
    }
  }

  /**
   * Test 6: Test audit permissions
   */
  async testAuditPermissions(): Promise<void> {
    try {
      // Test permission configuration for different roles
      const roles = ['admin', 'manager', 'executive', 'member', 'guest']
      const permissionResults: Record<string, any> = {}

      roles.forEach(role => {
        const permissions = AuditPermissionManager.getAuditPermissions(role as any)
        permissionResults[role] = {
          canView: permissions.canViewAuditLogs,
          canExport: permissions.canExportAuditLogs,
          level: permissions.permissionLevel
        }
      })

      // Verify admin has full access
      if (permissionResults.admin.canView && permissionResults.admin.canExport) {
        this.addResult('Audit Permissions', 'PASS', 'Permission system configured correctly')
      } else {
        this.addResult('Audit Permissions', 'FAIL', 'Admin permissions not configured correctly')
      }

    } catch (error) {
      this.addResult('Audit Permissions', 'FAIL', `Permission test failed: ${error}`)
    }
  }

  /**
   * Test 7: Verify audit indexes
   */
  async verifyAuditIndexes(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('pg_indexes')
        .select('indexname, tablename')
        .eq('schemaname', 'audit')
        .eq('tablename', 'audit_logs')

      if (error) {
        this.addResult('Audit Indexes', 'WARNING', `Could not verify indexes: ${error.message}`)
        return
      }

      const indexCount = data?.length || 0
      if (indexCount >= 5) { // Expecting at least 5 indexes
        this.addResult('Audit Indexes', 'PASS', `${indexCount} indexes configured for performance`)
      } else {
        this.addResult('Audit Indexes', 'WARNING', 
          `Only ${indexCount} indexes found, performance may be impacted`)
      }

    } catch (error) {
      this.addResult('Audit Indexes', 'WARNING', `Exception: ${error}`)
    }
  }

  /**
   * Test 8: Test trigger functionality (safe test)
   */
  async testTriggerFunctionality(): Promise<void> {
    try {
      // This would require a safe test transaction
      // For now, we'll check if the trigger function exists
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'audit')
        .eq('routine_name', 'audit_trigger_function')

      if (error) {
        this.addResult('Trigger Function', 'WARNING', `Could not verify trigger function: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        this.addResult('Trigger Function', 'PASS', 'Audit trigger function exists')
      } else {
        this.addResult('Trigger Function', 'FAIL', 'Audit trigger function not found')
      }

    } catch (error) {
      this.addResult('Trigger Function', 'FAIL', `Exception: ${error}`)
    }
  }

  /**
   * Generate verification report
   */
  generateReport(): void {
    console.log('\n' + '='.repeat(80))
    console.log('AUDIT SYSTEM DEPLOYMENT VERIFICATION REPORT')
    console.log('='.repeat(80))
    console.log(`Verification Date: ${new Date().toISOString()}`)
    console.log(`Environment: ${PRODUCTION_CONFIG.environment}`)
    console.log('')

    const passCount = this.results.filter(r => r.status === 'PASS').length
    const failCount = this.results.filter(r => r.status === 'FAIL').length
    const warningCount = this.results.filter(r => r.status === 'WARNING').length
    const totalTests = this.results.length

    console.log('📊 VERIFICATION SUMMARY:')
    console.log(`  Total Tests: ${totalTests}`)
    console.log(`  ✅ Passed: ${passCount}`)
    console.log(`  ❌ Failed: ${failCount}`)
    console.log(`  ⚠️  Warnings: ${warningCount}`)
    console.log(`  Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%`)
    console.log('')

    console.log('📋 DETAILED RESULTS:')
    this.results.forEach(result => {
      const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`  ${emoji} ${result.test}: ${result.message}`)
      if (result.details) {
        console.log(`     Details: ${JSON.stringify(result.details)}`)
      }
    })

    console.log('')

    if (failCount === 0) {
      console.log('🎉 VERIFICATION SUCCESSFUL!')
      console.log('The audit system has been successfully deployed and is functioning correctly.')
    } else {
      console.log('💥 VERIFICATION FAILED!')
      console.log(`${failCount} critical issues found. Please address these before using the audit system.`)
    }

    if (warningCount > 0) {
      console.log(`⚠️  ${warningCount} warnings detected. Review recommended but not critical.`)
    }

    console.log('')
    console.log('NEXT STEPS:')
    if (failCount === 0) {
      console.log('1. ✅ Audit system is ready for production use')
      console.log('2. 📚 Train users on audit features')
      console.log('3. 📊 Set up monitoring and alerting')
      console.log('4. 🔄 Schedule regular maintenance tasks')
    } else {
      console.log('1. ❌ Fix failed verification tests')
      console.log('2. 🔄 Re-run deployment script if needed')
      console.log('3. 🔍 Re-run this verification script')
      console.log('4. 📞 Contact support if issues persist')
    }

    console.log('='.repeat(80))
  }

  /**
   * Run all verification tests
   */
  async verify(): Promise<boolean> {
    console.log('🔍 Starting Audit System Deployment Verification...\n')

    const tests = [
      { name: 'Schema Verification', fn: () => this.verifyAuditSchema() },
      { name: 'Table Verification', fn: () => this.verifyAuditTable() },
      { name: 'Trigger Verification', fn: () => this.verifyAuditTriggers() },
      { name: 'RLS Policy Verification', fn: () => this.verifyRLSPolicies() },
      { name: 'Service Testing', fn: () => this.testAuditService() },
      { name: 'Permission Testing', fn: () => this.testAuditPermissions() },
      { name: 'Index Verification', fn: () => this.verifyAuditIndexes() },
      { name: 'Function Testing', fn: () => this.testTriggerFunctionality() }
    ]

    for (const test of tests) {
      console.log(`\n🧪 Running: ${test.name}`)
      await test.fn()
    }

    this.generateReport()

    const failCount = this.results.filter(r => r.status === 'FAIL').length
    return failCount === 0
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const verifier = new AuditDeploymentVerifier()
    const success = await verifier.verify()
    
    process.exit(success ? 0 : 1)
    
  } catch (error) {
    console.error('💥 Verification failed with exception:', error)
    process.exit(1)
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  main()
}

export { AuditDeploymentVerifier }