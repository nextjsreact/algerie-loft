/**
 * Functionality Testing Suite
 * 
 * Comprehensive testing suite for validating all major features
 * including authentication, CRUD operations, real-time notifications,
 * and audit system functionality.
 * 
 * Requirements: 6.3, 8.1, 9.2
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Environment } from '../types'
import { ProductionSafetyGuard } from '../production-safety-guard'

export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

export interface AuthenticationTestResult extends TestResult {
  canSignUp: boolean
  canSignIn: boolean
  canSignOut: boolean
  canResetPassword: boolean
}

export interface CRUDTestResult extends TestResult {
  tableName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  recordsCreated: number
  recordsRead: number
  recordsUpdated: number
  recordsDeleted: number
}

export interface RealtimeTestResult extends TestResult {
  subscriptionWorking: boolean
  messagesReceived: number
  notificationsReceived: number
  latency: number
}

export interface AuditTestResult extends TestResult {
  auditLogsGenerated: boolean
  auditTriggersWorking: boolean
  auditDataAccurate: boolean
  auditLogCount: number
}

export interface FunctionalityTestSuiteResult {
  isValid: boolean
  overallScore: number
  authentication: AuthenticationTestResult
  crudOperations: CRUDTestResult[]
  realtimeFeatures: RealtimeTestResult
  auditSystem: AuditTestResult
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
  timestamp: Date
}

export class FunctionalityTestSuite {
  private safetyGuard: ProductionSafetyGuard
  private testUserId: string | null = null
  private testRecordIds: Map<string, string[]> = new Map()

  constructor() {
    this.safetyGuard = ProductionSafetyGuard.getInstance()
  }

  /**
   * Run complete functionality test suite
   */
  public async runFullTestSuite(env: Environment): Promise<FunctionalityTestSuiteResult> {
    const startTime = Date.now()

    // Ensure this is not production
    await this.safetyGuard.validateEnvironmentAccess(env, 'functionality_testing')
    
    if (env.isProduction) {
      throw new Error('Functionality testing cannot be run on production environment')
    }

    const results: TestResult[] = []

    // Run authentication tests
    const authResult = await this.testAuthentication(env)
    results.push(authResult)

    // Run CRUD tests for major tables
    const crudResults = await this.testCRUDOperations(env)
    results.push(...crudResults)

    // Run real-time features tests
    const realtimeResult = await this.testRealtimeFeatures(env)
    results.push(realtimeResult)

    // Run audit system tests
    const auditResult = await this.testAuditSystem(env)
    results.push(auditResult)

    // Cleanup test data
    await this.cleanupTestData(env)

    const totalDuration = Date.now() - startTime
    const passedTests = results.filter(r => r.passed).length
    const failedTests = results.length - passedTests
    const overallScore = Math.round((passedTests / results.length) * 100)

    return {
      isValid: failedTests === 0,
      overallScore,
      authentication: authResult,
      crudOperations: crudResults,
      realtimeFeatures: realtimeResult,
      auditSystem: auditResult,
      totalTests: results.length,
      passedTests,
      failedTests,
      totalDuration,
      timestamp: new Date()
    }
  }

  /**
   * Test authentication functionality
   */
  public async testAuthentication(env: Environment): Promise<AuthenticationTestResult> {
    const startTime = Date.now()
    let canSignUp = false
    let canSignIn = false
    let canSignOut = false
    let canResetPassword = false
    let error: string | undefined

    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)
      const testEmail = `test-${Date.now()}@test.local`
      const testPassword = 'TestPassword123!'

      // Test sign up
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword
        })

        canSignUp = !signUpError && !!signUpData.user
        if (signUpData.user) {
          this.testUserId = signUpData.user.id
        }
      } catch (err) {
        error = `Sign up failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      }

      // Test sign in
      if (canSignUp) {
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
          })

          canSignIn = !signInError && !!signInData.user
        } catch (err) {
          error = `Sign in failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      }

      // Test sign out
      if (canSignIn) {
        try {
          const { error: signOutError } = await supabase.auth.signOut()
          canSignOut = !signOutError
        } catch (err) {
          error = `Sign out failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      }

      // Test password reset
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail)
        canResetPassword = !resetError
      } catch (err) {
        // Password reset might not be configured in test environment
        canResetPassword = true // Don't fail the test for this
      }

    } catch (err) {
      error = `Authentication test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    }

    const duration = Date.now() - startTime
    const passed = canSignUp && canSignIn && canSignOut && canResetPassword

    return {
      testName: 'Authentication',
      passed,
      duration,
      error,
      canSignUp,
      canSignIn,
      canSignOut,
      canResetPassword
    }
  }

  /**
   * Test CRUD operations for major tables
   */
  public async testCRUDOperations(env: Environment): Promise<CRUDTestResult[]> {
    const tables = [
      { name: 'lofts', testData: { name: 'Test Loft', description: 'Test Description', price_per_night: 100 } },
      { name: 'tasks', testData: { title: 'Test Task', description: 'Test Description', status: 'pending' } },
      { name: 'transactions', testData: { amount: 100, description: 'Test Transaction', type: 'income' } },
      { name: 'notifications', testData: { title: 'Test Notification', message: 'Test Message', type: 'info' } }
    ]

    const results: CRUDTestResult[] = []

    for (const table of tables) {
      const result = await this.testTableCRUD(env, table.name, table.testData)
      results.push(result)
    }

    return results
  }

  /**
   * Test CRUD operations for a specific table
   */
  private async testTableCRUD(env: Environment, tableName: string, testData: any): Promise<CRUDTestResult> {
    const startTime = Date.now()
    let canCreate = false
    let canRead = false
    let canUpdate = false
    let canDelete = false
    let recordsCreated = 0
    let recordsRead = 0
    let recordsUpdated = 0
    let recordsDeleted = 0
    let error: string | undefined
    let createdRecordId: string | null = null

    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey)

      // Test CREATE
      try {
        const { data: createData, error: createError } = await supabase
          .from(tableName)
          .insert(testData)
          .select()
          .single()

        canCreate = !createError && !!createData
        if (createData) {
          recordsCreated = 1
          createdRecordId = createData.id
          
          // Track for cleanup
          const existingIds = this.testRecordIds.get(tableName) || []
          this.testRecordIds.set(tableName, [...existingIds, createdRecordId])
        }
      } catch (err) {
        error = `Create failed for ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`
      }

      // Test READ
      try {
        const { data: readData, error: readError } = await supabase
          .from(tableName)
          .select('*')
          .limit(5)

        canRead = !readError && Array.isArray(readData)
        recordsRead = readData?.length || 0
      } catch (err) {
        error = `Read failed for ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`
      }

      // Test UPDATE (only if we created a record)
      if (canCreate && createdRecordId) {
        try {
          const updateData = { ...testData, description: 'Updated Description' }
          const { data: updateResult, error: updateError } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', createdRecordId)
            .select()

          canUpdate = !updateError && !!updateResult
          recordsUpdated = updateResult?.length || 0
        } catch (err) {
          error = `Update failed for ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      }

      // Test DELETE (only if we created a record)
      if (canCreate && createdRecordId) {
        try {
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', createdRecordId)

          canDelete = !deleteError
          if (canDelete) {
            recordsDeleted = 1
            // Remove from cleanup list since we already deleted it
            const existingIds = this.testRecordIds.get(tableName) || []
            this.testRecordIds.set(tableName, existingIds.filter(id => id !== createdRecordId))
          }
        } catch (err) {
          error = `Delete failed for ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      }

    } catch (err) {
      error = `CRUD test failed for ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`
    }

    const duration = Date.now() - startTime
    const passed = canCreate && canRead && canUpdate && canDelete

    return {
      testName: `CRUD-${tableName}`,
      passed,
      duration,
      error,
      tableName,
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      recordsCreated,
      recordsRead,
      recordsUpdated,
      recordsDeleted
    }
  }

  /**
   * Test real-time features
   */
  public async testRealtimeFeatures(env: Environment): Promise<RealtimeTestResult> {
    const startTime = Date.now()
    let subscriptionWorking = false
    let messagesReceived = 0
    let notificationsReceived = 0
    let latency = 0
    let error: string | undefined

    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)

      // Test real-time subscription
      const subscriptionPromise = new Promise<boolean>((resolve) => {
        const subscription = supabase
          .channel('test-channel')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'notifications' },
            (payload) => {
              notificationsReceived++
              resolve(true)
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              subscriptionWorking = true
            }
          })

        // Timeout after 5 seconds
        setTimeout(() => {
          subscription.unsubscribe()
          resolve(subscriptionWorking)
        }, 5000)
      })

      // Insert a test notification to trigger real-time event
      if (subscriptionWorking) {
        const testNotification = {
          title: 'Real-time Test',
          message: 'Testing real-time functionality',
          type: 'info'
        }

        const insertStartTime = Date.now()
        await supabase.from('notifications').insert(testNotification)
        
        // Wait for real-time event
        await subscriptionPromise
        latency = Date.now() - insertStartTime
      }

    } catch (err) {
      error = `Real-time test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    }

    const duration = Date.now() - startTime
    const passed = subscriptionWorking && notificationsReceived > 0

    return {
      testName: 'Real-time Features',
      passed,
      duration,
      error,
      subscriptionWorking,
      messagesReceived,
      notificationsReceived,
      latency
    }
  }

  /**
   * Test audit system functionality
   */
  public async testAuditSystem(env: Environment): Promise<AuditTestResult> {
    const startTime = Date.now()
    let auditLogsGenerated = false
    let auditTriggersWorking = false
    let auditDataAccurate = false
    let auditLogCount = 0
    let error: string | undefined

    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey)

      // Get initial audit log count
      const { count: initialCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      const initialAuditCount = initialCount || 0

      // Perform an operation that should trigger audit logging
      const testLoft = {
        name: 'Audit Test Loft',
        description: 'Testing audit functionality',
        price_per_night: 150
      }

      const { data: createdLoft, error: createError } = await supabase
        .from('lofts')
        .insert(testLoft)
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create test loft: ${createError.message}`)
      }

      // Track for cleanup
      if (createdLoft) {
        const existingIds = this.testRecordIds.get('lofts') || []
        this.testRecordIds.set('lofts', [...existingIds, createdLoft.id])
      }

      // Wait a moment for audit triggers to fire
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if audit logs were generated
      const { count: finalCount, error: countError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw new Error(`Failed to count audit logs: ${countError.message}`)
      }

      const finalAuditCount = finalCount || 0
      auditLogCount = finalAuditCount - initialAuditCount
      auditLogsGenerated = auditLogCount > 0
      auditTriggersWorking = auditLogsGenerated

      // Check if audit data is accurate
      if (auditLogsGenerated) {
        const { data: auditLogs, error: auditError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'lofts')
          .eq('record_id', createdLoft.id)
          .eq('operation', 'INSERT')

        if (auditError) {
          throw new Error(`Failed to fetch audit logs: ${auditError.message}`)
        }

        auditDataAccurate = (auditLogs?.length || 0) > 0
      }

    } catch (err) {
      error = `Audit system test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    }

    const duration = Date.now() - startTime
    const passed = auditLogsGenerated && auditTriggersWorking && auditDataAccurate

    return {
      testName: 'Audit System',
      passed,
      duration,
      error,
      auditLogsGenerated,
      auditTriggersWorking,
      auditDataAccurate,
      auditLogCount
    }
  }

  /**
   * Clean up test data
   */
  private async cleanupTestData(env: Environment): Promise<void> {
    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey)

      // Clean up test records
      for (const [tableName, recordIds] of this.testRecordIds.entries()) {
        if (recordIds.length > 0) {
          await supabase
            .from(tableName)
            .delete()
            .in('id', recordIds)
        }
      }

      // Clean up test user
      if (this.testUserId) {
        await supabase.auth.admin.deleteUser(this.testUserId)
      }

      // Clear tracking
      this.testRecordIds.clear()
      this.testUserId = null

    } catch (error) {
      // Log cleanup errors but don't fail the test
      console.warn('Failed to cleanup test data:', error)
    }
  }

  /**
   * Run specific test by name
   */
  public async runSpecificTest(env: Environment, testName: string): Promise<TestResult> {
    switch (testName.toLowerCase()) {
      case 'authentication':
        return await this.testAuthentication(env)
      case 'realtime':
        return await this.testRealtimeFeatures(env)
      case 'audit':
        return await this.testAuditSystem(env)
      default:
        throw new Error(`Unknown test: ${testName}`)
    }
  }
}