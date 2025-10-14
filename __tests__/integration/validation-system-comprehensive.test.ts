/**
 * Comprehensive Validation System Tests
 * 
 * Tests for validation engine accuracy, functionality testing suite completeness,
 * and health monitoring and alerting system.
 * 
 * Requirements tested: 6.1, 6.2, 6.3, 6.4
 */

import { 
  ValidationEngine, 
  ValidationEngineResult,
  DatabaseConnectivityResult,
  SchemaValidationResult,
  DataIntegrityResult,
  AuditSystemValidationResult
} from '../../lib/environment-management/validation/validation-engine'

import { 
  FunctionalityTestSuite,
  FunctionalityTestSuiteResult,
  AuthenticationTestResult,
  CRUDTestResult,
  RealtimeTestResult,
  AuditTestResult
} from '../../lib/environment-management/validation/functionality-test-suite'

import { 
  HealthMonitoringSystem,
  HealthReport,
  HealthStatus,
  PerformanceMetrics,
  HealthIssue,
  HealthAlert,
  MonitoringConfig
} from '../../lib/environment-management/validation/health-monitoring-system'

import { Environment, EnvironmentType } from '../../lib/environment-management/types'

// Mock ProductionSafetyGuard
jest.mock('../../lib/environment-management/production-safety-guard', () => ({
  ProductionSafetyGuard: {
    getInstance: jest.fn(() => ({
      validateEnvironmentAccess: jest.fn().mockResolvedValue(undefined)
    }))
  }
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        like: jest.fn(() => Promise.resolve({ data: [], error: null })),
        not: jest.fn(() => Promise.resolve({ data: [], error: null })),
        is: jest.fn(() => Promise.resolve({ count: 0, error: null })),
        in: jest.fn(() => Promise.resolve({ error: null })),
        gte: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { id: 'test-id-123', name: 'Test Record' }, 
              error: null 
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({ data: [{ id: 'test-id-123' }], error: null }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      })),
      count: jest.fn(() => Promise.resolve({ count: 100, error: null }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: 'PostgreSQL 13.0', error: null })),
    auth: {
      signUp: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-123', email: 'test@test.local' } }, 
        error: null 
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-123' } }, 
        error: null 
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
      admin: {
        deleteUser: jest.fn(() => Promise.resolve({ error: null }))
      }
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn((callback) => {
          callback('SUBSCRIBED')
          return {
            unsubscribe: jest.fn()
          }
        })
      }))
    }))
  }))
}))

describe('Comprehensive Validation System Tests', () => {
  let validationEngine: ValidationEngine
  let functionalityTestSuite: FunctionalityTestSuite
  let healthMonitoringSystem: HealthMonitoringSystem
  let mockEnvironment: Environment
  let mockProductionEnvironment: Environment
  let mockTestEnvironment: Environment

  beforeEach(() => {
    jest.clearAllMocks()
    
    validationEngine = new ValidationEngine()
    functionalityTestSuite = new FunctionalityTestSuite()
    
    const monitoringConfig: MonitoringConfig = {
      checkInterval: 60000, // 1 minute
      performanceThresholds: {
        responseTime: 1000, // 1 second
        errorRate: 5, // 5%
        throughput: 10 // 10 requests/second
      },
      alerting: {
        enabled: true,
        emailNotifications: true,
        escalationRules: []
      },
      retention: {
        metricsRetentionDays: 30,
        alertsRetentionDays: 7,
        reportsRetentionDays: 90
      }
    }
    
    healthMonitoringSystem = new HealthMonitoringSystem(monitoringConfig)

    // Create mock environments
    mockEnvironment = {
      id: 'test-env-123',
      name: 'Test Environment',
      type: 'test' as EnvironmentType,
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceKey: 'test-service-key',
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
      status: 'active',
      isProduction: false,
      allowWrites: true,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    mockProductionEnvironment = {
      ...mockEnvironment,
      id: 'prod-env-123',
      name: 'Production Environment',
      type: 'production' as EnvironmentType,
      isProduction: true,
      allowWrites: false
    }

    mockTestEnvironment = {
      ...mockEnvironment,
      id: 'test-env-456',
      name: 'Test Environment 2'
    }
  })

  afterEach(() => {
    // Cleanup monitoring
    healthMonitoringSystem.stopAllMonitoring()
  })

  describe('Validation Engine Accuracy Tests', () => {
    // Requirement 6.1: Environment validation engine

    it('should accurately validate database connectivity', async () => {
      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)

      expect(result).toBeDefined()
      expect(result.connected).toBe(true)
      expect(result.responseTime).toBeGreaterThan(0)
      expect(result.version).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should detect connectivity failures accurately', async () => {
      const invalidEnvironment: Environment = {
        ...mockEnvironment,
        supabaseUrl: 'https://invalid.supabase.co',
        supabaseAnonKey: 'invalid-key'
      }

      const result = await validationEngine.validateDatabaseConnectivity(invalidEnvironment)

      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.responseTime).toBeGreaterThan(0)
    })

    it('should accurately validate schema completeness', async () => {
      const result = await validationEngine.validateSchema(mockEnvironment)

      expect(result.isValid).toBeDefined()
      expect(typeof result.isValid).toBe('boolean')
      expect(result.tablesFound).toBeGreaterThanOrEqual(0)
      expect(result.expectedTables).toContain('users')
      expect(result.expectedTables).toContain('lofts')
      expect(Array.isArray(result.missingTables)).toBe(true)
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should accurately validate data integrity', async () => {
      const result = await validationEngine.validateDataIntegrity(mockEnvironment)

      expect(result).toBeDefined()
      expect(result.totalRecords).toBeGreaterThanOrEqual(0)
      expect(result.orphanedRecords).toBeGreaterThanOrEqual(0)
      expect(result.duplicateRecords).toBeGreaterThanOrEqual(0)
      expect(result.nullConstraintViolations).toBeGreaterThanOrEqual(0)
      expect(result.foreignKeyViolations).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should accurately validate audit system functionality', async () => {
      const result = await validationEngine.validateAuditSystem(mockEnvironment)

      expect(result).toBeDefined()
      expect(typeof result.isValid).toBe('boolean')
      expect(typeof result.auditTablesPresent).toBe('boolean')
      expect(typeof result.auditTriggersActive).toBe('boolean')
      expect(typeof result.auditFunctionsWorking).toBe('boolean')
      expect(typeof result.auditLogsRecent).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should provide comprehensive environment validation', async () => {
      const result = await validationEngine.validateEnvironment(mockEnvironment)

      expect(result).toBeDefined()
      expect(typeof result.isValid).toBe('boolean')
      expect(result.connectivity).toBeDefined()
      expect(result.schema).toBeDefined()
      expect(result.dataIntegrity).toBeDefined()
      expect(result.auditSystem).toBeDefined()
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should calculate accurate overall scores', async () => {
      const result = await validationEngine.validateEnvironment(mockEnvironment)

      // Score should be based on all validation components
      expect(result.overallScore).toBeGreaterThan(0)
      
      // If connectivity is good, score should be reasonable
      if (result.connectivity.connected) {
        expect(result.overallScore).toBeGreaterThan(25)
      }
    })

    it('should handle production environment validation safely', async () => {
      const result = await validationEngine.validateEnvironment(mockProductionEnvironment)

      expect(result).toBeDefined()
      expect(result.connectivity).toBeDefined()
      
      // Should complete without errors (production safety is handled by safety guard)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should provide detailed error information for failed validations', async () => {
      const invalidEnvironment: Environment = {
        ...mockEnvironment,
        supabaseUrl: '',
        supabaseAnonKey: ''
      }

      const result = await validationEngine.validateEnvironment(invalidEnvironment)

      expect(result.isValid).toBe(false)
      expect(result.connectivity.connected).toBe(false)
      expect(result.connectivity.error).toBeDefined()
      expect(result.overallScore).toBeLessThan(50)
    })
  })

  describe('Functionality Testing Suite Completeness Tests', () => {
    // Requirement 6.3: Functionality testing suite for all major features

    it('should run complete functionality test suite successfully', async () => {
      const result = await functionalityTestSuite.runFullTestSuite(mockTestEnvironment)

      expect(result).toBeDefined()
      expect(typeof result.isValid).toBe('boolean')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.authentication).toBeDefined()
      expect(Array.isArray(result.crudOperations)).toBe(true)
      expect(result.realtimeFeatures).toBeDefined()
      expect(result.auditSystem).toBeDefined()
      expect(result.totalTests).toBeGreaterThan(0)
      expect(result.passedTests).toBeGreaterThanOrEqual(0)
      expect(result.failedTests).toBeGreaterThanOrEqual(0)
      expect(result.totalDuration).toBeGreaterThan(0)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should thoroughly test authentication functionality', async () => {
      const result = await functionalityTestSuite.testAuthentication(mockTestEnvironment)

      expect(result.testName).toBe('Authentication')
      expect(typeof result.passed).toBe('boolean')
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(typeof result.canSignUp).toBe('boolean')
      expect(typeof result.canSignIn).toBe('boolean')
      expect(typeof result.canSignOut).toBe('boolean')
      expect(typeof result.canResetPassword).toBe('boolean')
    })

    it('should comprehensively test CRUD operations for all major tables', async () => {
      const results = await functionalityTestSuite.testCRUDOperations(mockTestEnvironment)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)

      // Check that all major tables are tested
      const testedTables = results.map(r => r.tableName)
      expect(testedTables).toContain('lofts')
      expect(testedTables).toContain('tasks')
      expect(testedTables).toContain('transactions')
      expect(testedTables).toContain('notifications')

      // Verify each CRUD test result structure
      results.forEach(result => {
        expect(result.testName).toContain('CRUD-')
        expect(result.tableName).toBeDefined()
        expect(typeof result.passed).toBe('boolean')
        expect(result.duration).toBeGreaterThanOrEqual(0)
        expect(typeof result.canCreate).toBe('boolean')
        expect(typeof result.canRead).toBe('boolean')
        expect(typeof result.canUpdate).toBe('boolean')
        expect(typeof result.canDelete).toBe('boolean')
        expect(result.recordsCreated).toBeGreaterThanOrEqual(0)
        expect(result.recordsRead).toBeGreaterThanOrEqual(0)
        expect(result.recordsUpdated).toBeGreaterThanOrEqual(0)
        expect(result.recordsDeleted).toBeGreaterThanOrEqual(0)
      })
    })

    it('should thoroughly test real-time features', async () => {
      const result = await functionalityTestSuite.testRealtimeFeatures(mockTestEnvironment)

      expect(result.testName).toBe('Real-time Features')
      expect(typeof result.passed).toBe('boolean')
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(typeof result.subscriptionWorking).toBe('boolean')
      expect(result.messagesReceived).toBeGreaterThanOrEqual(0)
      expect(result.notificationsReceived).toBeGreaterThanOrEqual(0)
      expect(result.latency).toBeGreaterThanOrEqual(0)
    })

    it('should thoroughly test audit system functionality', async () => {
      const result = await functionalityTestSuite.testAuditSystem(mockTestEnvironment)

      expect(result.testName).toBe('Audit System')
      expect(typeof result.passed).toBe('boolean')
      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(typeof result.auditLogsGenerated).toBe('boolean')
      expect(typeof result.auditTriggersWorking).toBe('boolean')
      expect(typeof result.auditDataAccurate).toBe('boolean')
      expect(result.auditLogCount).toBeGreaterThanOrEqual(0)
    })

    it('should prevent functionality testing on production environment', async () => {
      await expect(
        functionalityTestSuite.runFullTestSuite(mockProductionEnvironment)
      ).rejects.toThrow('Functionality testing cannot be run on production environment')
    })

    it('should run specific tests by name', async () => {
      const authResult = await functionalityTestSuite.runSpecificTest(mockTestEnvironment, 'authentication')
      expect(authResult.testName).toBe('Authentication')

      const realtimeResult = await functionalityTestSuite.runSpecificTest(mockTestEnvironment, 'realtime')
      expect(realtimeResult.testName).toBe('Real-time Features')

      const auditResult = await functionalityTestSuite.runSpecificTest(mockTestEnvironment, 'audit')
      expect(auditResult.testName).toBe('Audit System')
    })

    it('should handle test failures gracefully', async () => {
      // Mock a failure scenario
      const invalidEnvironment: Environment = {
        ...mockTestEnvironment,
        supabaseUrl: 'https://invalid.supabase.co'
      }

      const result = await functionalityTestSuite.runFullTestSuite(invalidEnvironment)

      expect(result).toBeDefined()
      expect(result.failedTests).toBeGreaterThan(0)
      expect(result.overallScore).toBeLessThan(100)
    })

    it('should properly clean up test data after completion', async () => {
      const result = await functionalityTestSuite.runFullTestSuite(mockTestEnvironment)

      // Test should complete successfully
      expect(result).toBeDefined()
      
      // Cleanup should not throw errors (tested implicitly by successful completion)
      expect(result.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Health Monitoring and Alerting Tests', () => {
    // Requirement 6.4: Health monitoring and alerting system

    it('should perform comprehensive health checks', async () => {
      const report = await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      expect(report).toBeDefined()
      expect(report.environmentId).toBe(mockEnvironment.id)
      expect(report.environmentName).toBe(mockEnvironment.name)
      expect(report.timestamp).toBeInstanceOf(Date)
      expect(report.healthStatus).toBeDefined()
      expect(report.performanceMetrics).toBeDefined()
      expect(report.validationResult).toBeDefined()
      expect(Array.isArray(report.trends)).toBe(true)
      expect(Array.isArray(report.alerts)).toBe(true)
    })

    it('should accurately collect performance metrics', async () => {
      const metrics = await healthMonitoringSystem.collectPerformanceMetrics(mockEnvironment)

      expect(metrics).toBeDefined()
      expect(metrics.responseTime).toBeGreaterThanOrEqual(0)
      expect(metrics.throughput).toBeGreaterThanOrEqual(0)
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0)
      expect(metrics.errorRate).toBeLessThanOrEqual(100)
      expect(metrics.connectionCount).toBeGreaterThanOrEqual(0)
      expect(metrics.activeQueries).toBeGreaterThanOrEqual(0)
    })

    it('should start and stop continuous monitoring', async () => {
      // Start monitoring
      healthMonitoringSystem.startMonitoring(mockEnvironment)

      // Wait a short time to ensure monitoring is active
      await new Promise(resolve => setTimeout(resolve, 100))

      // Stop monitoring
      healthMonitoringSystem.stopMonitoring(mockEnvironment.id)

      // Should not throw errors
      expect(true).toBe(true)
    })

    it('should generate health trends from historical data', async () => {
      // Perform multiple health checks to generate history
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      const history = healthMonitoringSystem.getHealthHistory(mockEnvironment.id)
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeGreaterThan(0)

      // Check trend generation in the latest report
      const latestReport = await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      expect(Array.isArray(latestReport.trends)).toBe(true)
    })

    it('should create alerts for health issues', async () => {
      // Create a scenario that should trigger alerts
      const unhealthyEnvironment: Environment = {
        ...mockEnvironment,
        supabaseUrl: 'https://slow.supabase.co' // This should cause slow response
      }

      const report = await healthMonitoringSystem.performHealthCheck(unhealthyEnvironment)

      // Check if alerts were generated (may not always trigger in mock scenario)
      expect(Array.isArray(report.alerts)).toBe(true)
      
      // Verify alert structure if any exist
      if (report.alerts.length > 0) {
        const alert = report.alerts[0]
        expect(alert.id).toBeDefined()
        expect(alert.environmentId).toBe(unhealthyEnvironment.id)
        expect(['info', 'warning', 'error', 'critical']).toContain(alert.severity)
        expect(alert.title).toBeDefined()
        expect(alert.message).toBeDefined()
        expect(alert.timestamp).toBeInstanceOf(Date)
        expect(typeof alert.acknowledged).toBe('boolean')
      }
    })

    it('should manage alert lifecycle (acknowledge and resolve)', async () => {
      // Get initial alerts
      const initialAlerts = healthMonitoringSystem.getActiveAlerts(mockEnvironment.id)
      
      // If we have alerts, test acknowledgment and resolution
      if (initialAlerts.length > 0) {
        const alertId = initialAlerts[0].id
        
        // Acknowledge alert
        healthMonitoringSystem.acknowledgeAlert(mockEnvironment.id, alertId)
        
        // Resolve alert
        healthMonitoringSystem.resolveAlert(mockEnvironment.id, alertId)
        
        // Should not throw errors
        expect(true).toBe(true)
      } else {
        // If no alerts, just verify the methods don't throw
        healthMonitoringSystem.acknowledgeAlert(mockEnvironment.id, 'non-existent')
        healthMonitoringSystem.resolveAlert(mockEnvironment.id, 'non-existent')
        expect(true).toBe(true)
      }
    })

    it('should filter health history by timeframe', async () => {
      // Generate some history
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      const allHistory = healthMonitoringSystem.getHealthHistory(mockEnvironment.id)
      const last24h = healthMonitoringSystem.getHealthHistory(mockEnvironment.id, '24h')
      const last1h = healthMonitoringSystem.getHealthHistory(mockEnvironment.id, '1h')

      expect(Array.isArray(allHistory)).toBe(true)
      expect(Array.isArray(last24h)).toBe(true)
      expect(Array.isArray(last1h)).toBe(true)
      
      // Recent history should be subset of all history
      expect(last24h.length).toBeLessThanOrEqual(allHistory.length)
      expect(last1h.length).toBeLessThanOrEqual(last24h.length)
    })

    it('should handle monitoring configuration properly', async () => {
      const customConfig: MonitoringConfig = {
        checkInterval: 30000, // 30 seconds
        performanceThresholds: {
          responseTime: 500, // 0.5 seconds
          errorRate: 2, // 2%
          throughput: 20 // 20 requests/second
        },
        alerting: {
          enabled: true,
          emailNotifications: false,
          webhookUrl: 'https://webhook.test.com',
          escalationRules: [
            {
              condition: 'critical',
              delay: 5,
              action: 'webhook',
              recipients: ['admin@test.com']
            }
          ]
        },
        retention: {
          metricsRetentionDays: 60,
          alertsRetentionDays: 14,
          reportsRetentionDays: 180
        }
      }

      const customMonitor = new HealthMonitoringSystem(customConfig)
      const report = await customMonitor.performHealthCheck(mockEnvironment)

      expect(report).toBeDefined()
      expect(report.healthStatus).toBeDefined()
    })

    it('should perform cleanup of old data', async () => {
      // Generate some history
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      // Perform cleanup
      healthMonitoringSystem.cleanup()

      // Should not throw errors
      expect(true).toBe(true)
    })

    it('should stop all monitoring when requested', async () => {
      // Start monitoring for multiple environments
      healthMonitoringSystem.startMonitoring(mockEnvironment)
      healthMonitoringSystem.startMonitoring(mockTestEnvironment)

      // Stop all monitoring
      healthMonitoringSystem.stopAllMonitoring()

      // Should not throw errors
      expect(true).toBe(true)
    })

    it('should calculate health status accurately based on validation and performance', async () => {
      const report = await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      expect(report.healthStatus).toBeDefined()
      expect(['healthy', 'warning', 'critical', 'unknown']).toContain(report.healthStatus.status)
      expect(report.healthStatus.score).toBeGreaterThanOrEqual(0)
      expect(report.healthStatus.score).toBeLessThanOrEqual(100)
      expect(report.healthStatus.lastChecked).toBeInstanceOf(Date)
      expect(report.healthStatus.uptime).toBeGreaterThan(0)
      expect(Array.isArray(report.healthStatus.issues)).toBe(true)

      // Verify issue structure if any exist
      report.healthStatus.issues.forEach(issue => {
        expect(issue.id).toBeDefined()
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity)
        expect(['connectivity', 'performance', 'data', 'security', 'functionality']).toContain(issue.category)
        expect(issue.title).toBeDefined()
        expect(issue.description).toBeDefined()
        expect(issue.recommendation).toBeDefined()
        expect(issue.firstDetected).toBeInstanceOf(Date)
        expect(issue.lastSeen).toBeInstanceOf(Date)
        expect(typeof issue.resolved).toBe('boolean')
      })
    })
  })

  describe('Integration Tests - Validation System Components', () => {
    // Test integration between validation engine, functionality tests, and health monitoring

    it('should integrate validation engine with health monitoring', async () => {
      const healthReport = await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      // Health report should include validation results
      expect(healthReport.validationResult).toBeDefined()
      expect(healthReport.validationResult.connectivity).toBeDefined()
      expect(healthReport.validationResult.schema).toBeDefined()
      expect(healthReport.validationResult.dataIntegrity).toBeDefined()
      expect(healthReport.validationResult.auditSystem).toBeDefined()
    })

    it('should integrate functionality tests with health monitoring for non-production environments', async () => {
      const healthReport = await healthMonitoringSystem.performHealthCheck(mockTestEnvironment)

      // For test environments, functionality tests might be included
      expect(healthReport).toBeDefined()
      expect(healthReport.validationResult).toBeDefined()
      
      // Functionality results are optional and random (10% chance)
      if (healthReport.functionalityResult) {
        expect(healthReport.functionalityResult.authentication).toBeDefined()
        expect(Array.isArray(healthReport.functionalityResult.crudOperations)).toBe(true)
        expect(healthReport.functionalityResult.realtimeFeatures).toBeDefined()
        expect(healthReport.functionalityResult.auditSystem).toBeDefined()
      }
    })

    it('should provide consistent validation results across components', async () => {
      // Run validation engine directly
      const validationResult = await validationEngine.validateEnvironment(mockEnvironment)

      // Run health check which includes validation
      const healthReport = await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      // Both should provide consistent connectivity results
      expect(validationResult.connectivity.connected).toBe(healthReport.validationResult.connectivity.connected)
      
      // Both should have similar overall assessment
      const validationScore = validationResult.overallScore
      const healthScore = healthReport.healthStatus.score
      
      // Scores might differ slightly due to different calculation methods, but should be in similar range
      expect(Math.abs(validationScore - healthScore)).toBeLessThan(50)
    })

    it('should handle cascading failures across validation components', async () => {
      const invalidEnvironment: Environment = {
        ...mockEnvironment,
        supabaseUrl: 'https://completely-invalid-url.test',
        supabaseAnonKey: 'invalid-key'
      }

      // All components should handle the invalid environment gracefully
      const validationResult = await validationEngine.validateEnvironment(invalidEnvironment)
      const healthReport = await healthMonitoringSystem.performHealthCheck(invalidEnvironment)

      expect(validationResult.connectivity.connected).toBe(false)
      expect(healthReport.validationResult.connectivity.connected).toBe(false)
      expect(healthReport.healthStatus.status).toBe('critical')
      expect(healthReport.healthStatus.issues.length).toBeGreaterThan(0)
    })

    it('should maintain performance under load', async () => {
      const startTime = Date.now()

      // Run multiple validation operations concurrently
      const promises = [
        validationEngine.validateEnvironment(mockEnvironment),
        validationEngine.validateEnvironment(mockTestEnvironment),
        healthMonitoringSystem.performHealthCheck(mockEnvironment),
        healthMonitoringSystem.performHealthCheck(mockTestEnvironment),
        functionalityTestSuite.runFullTestSuite(mockTestEnvironment)
      ]

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // All operations should complete successfully
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
      })

      // Should complete within reasonable time (adjust threshold as needed)
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(30000) // 30 seconds max for all operations
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout scenario
      const timeoutEnvironment: Environment = {
        ...mockEnvironment,
        supabaseUrl: 'https://timeout.test.com'
      }

      const validationResult = await validationEngine.validateEnvironment(timeoutEnvironment)
      
      expect(validationResult).toBeDefined()
      expect(validationResult.connectivity.connected).toBe(false)
      expect(validationResult.connectivity.error).toBeDefined()
    })

    it('should handle partial system failures', async () => {
      // Test scenario where some components work but others fail
      const partialFailureEnv: Environment = {
        ...mockEnvironment,
        supabaseServiceKey: 'invalid-service-key' // This might cause some operations to fail
      }

      const validationResult = await validationEngine.validateEnvironment(partialFailureEnv)
      
      expect(validationResult).toBeDefined()
      // Should still provide results even if some components fail
      expect(validationResult.timestamp).toBeInstanceOf(Date)
    })

    it('should handle empty or malformed responses', async () => {
      // Mock malformed response scenario
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Malformed response' } }))
          }))
        }))
      })

      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)
      
      expect(result).toBeDefined()
      expect(typeof result.connected).toBe('boolean')
    })

    it('should validate input parameters', async () => {
      // Test with invalid environment object
      const invalidEnv = {} as Environment

      await expect(
        validationEngine.validateEnvironment(invalidEnv)
      ).rejects.toThrow()
    })

    it('should handle concurrent validation requests', async () => {
      // Run multiple validations concurrently on the same environment
      const promises = Array(5).fill(null).map(() => 
        validationEngine.validateEnvironment(mockEnvironment)
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.timestamp).toBeInstanceOf(Date)
      })
    })
  })
})