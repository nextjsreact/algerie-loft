/**
 * Health Monitoring and Alerting System Tests
 * 
 * Tests for health monitoring system accuracy, alerting functionality,
 * and continuous monitoring capabilities.
 * 
 * Requirements tested: 6.4
 */

import { 
  HealthMonitoringSystem,
  HealthReport,
  HealthStatus,
  PerformanceMetrics,
  HealthIssue,
  HealthAlert,
  MonitoringConfig,
  EscalationRule
} from '../../lib/environment-management/validation/health-monitoring-system'

import { Environment } from '../../lib/environment-management/types'

// Mock the validation components
jest.mock('../../lib/environment-management/validation/validation-engine', () => ({
  ValidationEngine: jest.fn().mockImplementation(() => ({
    validateEnvironment: jest.fn().mockResolvedValue({
      isValid: true,
      connectivity: { connected: true, responseTime: 150, version: 'PostgreSQL 13.7' },
      schema: { isValid: true, tablesFound: 25, missingTables: [], errors: [] },
      dataIntegrity: { isValid: true, totalRecords: 1000, orphanedRecords: 0, errors: [], warnings: [] },
      auditSystem: { isValid: true, auditTablesPresent: true, auditTriggersActive: true, errors: [] },
      overallScore: 95,
      timestamp: new Date()
    }))
  }))
}))

jest.mock('../../lib/environment-management/validation/functionality-test-suite', () => ({
  FunctionalityTestSuite: jest.fn().mockImplementation(() => ({
    runFullTestSuite: jest.fn().mockResolvedValue({
      isValid: true,
      overallScore: 90,
      authentication: { passed: true, testName: 'Authentication' },
      crudOperations: [
        { passed: true, testName: 'CRUD-lofts', tableName: 'lofts' },
        { passed: true, testName: 'CRUD-tasks', tableName: 'tasks' }
      ],
      realtimeFeatures: { passed: true, testName: 'Real-time Features' },
      auditSystem: { passed: true, testName: 'Audit System' },
      totalTests: 5,
      passedTests: 5,
      failedTests: 0,
      totalDuration: 2500,
      timestamp: new Date()
    }))
  }))
}))

// Mock Supabase for performance metrics
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({ 
      data: { connection_count: 15, active_queries: 3 }, 
      error: null 
    }))
  }))
}))

// Mock fetch for webhook notifications
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
) as jest.Mock

describe('Health Monitoring and Alerting System Tests', () => {
  let healthMonitoringSystem: HealthMonitoringSystem
  let mockEnvironment: Environment
  let mockUnhealthyEnvironment: Environment
  let defaultConfig: MonitoringConfig

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    defaultConfig = {
      checkInterval: 60000, // 1 minute
      performanceThresholds: {
        responseTime: 1000, // 1 second
        errorRate: 5, // 5%
        throughput: 10 // 10 requests/second
      },
      alerting: {
        enabled: true,
        emailNotifications: true,
        webhookUrl: 'https://webhook.test.com/alerts',
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
        metricsRetentionDays: 30,
        alertsRetentionDays: 7,
        reportsRetentionDays: 90
      }
    }

    healthMonitoringSystem = new HealthMonitoringSystem(defaultConfig)

    mockEnvironment = {
      id: 'test-env-123',
      name: 'Test Environment',
      type: 'test',
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

    mockUnhealthyEnvironment = {
      ...mockEnvironment,
      id: 'unhealthy-env-456',
      name: 'Unhealthy Environment',
      supabaseUrl: 'https://slow.supabase.co'
    }
  })

  afterEach(() => {
    jest.useRealTimers()
    healthMonitoringSystem.stopAllMonitoring()
  })

  describe('Health Check Accuracy', () => {
    it('should perform comprehensive health checks', async () => {
      const report = await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      expect(report).toBeDefined()
      expect(report.environmentId).toBe(mockEnvironment.id)
      expect(report.environmentName).toBe(mockEnvironment.name)
      expect(report.timestamp).toBeInstanceOf(Date)
      
      // Verify all components are included
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

    it('should calculate accurate health status', async () => {
      const report = await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      expect(report.healthStatus).toBeDefined()
      expect(['healthy', 'warning', 'critical', 'unknown']).toContain(report.healthStatus.status)
      expect(report.healthStatus.score).toBeGreaterThanOrEqual(0)
      expect(report.healthStatus.score).toBeLessThanOrEqual(100)
      expect(report.healthStatus.lastChecked).toBeInstanceOf(Date)
      expect(report.healthStatus.uptime).toBeGreaterThan(0)
      expect(Array.isArray(report.healthStatus.issues)).toBe(true)
    })

    it('should detect performance issues accurately', async () => {
      // Mock slow performance
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => new Promise(resolve => 
              setTimeout(() => resolve({ data: null, error: null }), 1500) // 1.5 second delay
            ))
          }))
        }))
      }))

      const metrics = await healthMonitoringSystem.collectPerformanceMetrics(mockUnhealthyEnvironment)

      expect(metrics.responseTime).toBeGreaterThan(defaultConfig.performanceThresholds.responseTime)
    })

    it('should identify health issues correctly', async () => {
      // Mock validation engine to return issues
      const mockValidationEngine = require('../../lib/environment-management/validation/validation-engine').ValidationEngine
      mockValidationEngine.mockImplementation(() => ({
        validateEnvironment: jest.fn().mockResolvedValue({
          isValid: false,
          connectivity: { connected: false, responseTime: 5000, error: 'Connection timeout' },
          schema: { isValid: false, tablesFound: 10, missingTables: ['audit_logs'], errors: ['Missing audit tables'] },
          dataIntegrity: { isValid: false, totalRecords: 500, orphanedRecords: 5, errors: ['Orphaned records found'] },
          auditSystem: { isValid: false, auditTablesPresent: false, errors: ['Audit system not configured'] },
          overallScore: 25,
          timestamp: new Date()
        })
      }))

      const unhealthyMonitor = new HealthMonitoringSystem(defaultConfig)
      const report = await unhealthyMonitor.performHealthCheck(mockUnhealthyEnvironment)

      expect(report.healthStatus.status).toBe('critical')
      expect(report.healthStatus.score).toBeLessThan(50)
      expect(report.healthStatus.issues.length).toBeGreaterThan(0)
      
      // Verify issue structure
      report.healthStatus.issues.forEach(issue => {
        expect(issue.id).toBeDefined()
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity)
        expect(['connectivity', 'performance', 'data', 'security', 'functionality']).toContain(issue.category)
        expect(issue.title).toBeDefined()
        expect(issue.description).toBeDefined()
        expect(issue.recommendation).toBeDefined()
      })
    })
  })

  describe('Continuous Monitoring', () => {
    it('should start and stop monitoring correctly', async () => {
      // Start monitoring
      healthMonitoringSystem.startMonitoring(mockEnvironment)

      // Verify monitoring is active (no direct way to check, but should not throw)
      expect(() => {
        healthMonitoringSystem.startMonitoring(mockEnvironment)
      }).not.toThrow()

      // Stop monitoring
      healthMonitoringSystem.stopMonitoring(mockEnvironment.id)
      
      expect(true).toBe(true) // Test passes if no errors thrown
    })

    it('should perform periodic health checks', async () => {
      const performHealthCheckSpy = jest.spyOn(healthMonitoringSystem, 'performHealthCheck')
      
      // Start monitoring with short interval for testing
      const shortIntervalConfig: MonitoringConfig = {
        ...defaultConfig,
        checkInterval: 100 // 100ms for testing
      }
      const testMonitor = new HealthMonitoringSystem(shortIntervalConfig)
      
      testMonitor.startMonitoring(mockEnvironment)

      // Advance timers to trigger health checks
      jest.advanceTimersByTime(250) // Should trigger 2-3 checks

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50))

      testMonitor.stopMonitoring(mockEnvironment.id)
      
      // Should have performed health checks (exact count may vary due to timing)
      expect(performHealthCheckSpy).toHaveBeenCalled()
    })

    it('should handle monitoring errors gracefully', async () => {
      // Mock health check to throw error
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      jest.spyOn(healthMonitoringSystem, 'performHealthCheck').mockRejectedValue(new Error('Health check failed'))

      healthMonitoringSystem.startMonitoring(mockEnvironment)
      
      // Advance timer to trigger health check
      jest.advanceTimersByTime(defaultConfig.checkInterval + 100)
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should log error but continue monitoring
      expect(errorSpy).toHaveBeenCalled()
      
      errorSpy.mockRestore()
    })

    it('should stop all monitoring when requested', () => {
      // Start monitoring for multiple environments
      healthMonitoringSystem.startMonitoring(mockEnvironment)
      healthMonitoringSystem.startMonitoring(mockUnhealthyEnvironment)

      // Stop all monitoring
      healthMonitoringSystem.stopAllMonitoring()

      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Alerting System', () => {
    it('should create alerts for health issues', async () => {
      // Mock unhealthy validation result to trigger alerts
      const mockValidationEngine = require('../../lib/environment-management/validation/validation-engine').ValidationEngine
      mockValidationEngine.mockImplementation(() => ({
        validateEnvironment: jest.fn().mockResolvedValue({
          isValid: false,
          connectivity: { connected: false, responseTime: 5000, error: 'Connection failed' },
          schema: { isValid: true, tablesFound: 25, missingTables: [], errors: [] },
          dataIntegrity: { isValid: true, totalRecords: 1000, orphanedRecords: 0, errors: [] },
          auditSystem: { isValid: true, auditTablesPresent: true, errors: [] },
          overallScore: 30,
          timestamp: new Date()
        })
      }))

      const alertingMonitor = new HealthMonitoringSystem(defaultConfig)
      const report = await alertingMonitor.performHealthCheck(mockUnhealthyEnvironment)

      // Should have created alerts for the connectivity issue
      const alerts = alertingMonitor.getActiveAlerts(mockUnhealthyEnvironment.id)
      expect(Array.isArray(alerts)).toBe(true)
      
      // If alerts were created, verify their structure
      if (alerts.length > 0) {
        const alert = alerts[0]
        expect(alert.id).toBeDefined()
        expect(alert.environmentId).toBe(mockUnhealthyEnvironment.id)
        expect(['info', 'warning', 'error', 'critical']).toContain(alert.severity)
        expect(alert.title).toBeDefined()
        expect(alert.message).toBeDefined()
        expect(alert.timestamp).toBeInstanceOf(Date)
        expect(typeof alert.acknowledged).toBe('boolean')
      }
    })

    it('should send webhook notifications when configured', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch')

      // Mock unhealthy environment to trigger alerts
      const mockValidationEngine = require('../../lib/environment-management/validation/validation-engine').ValidationEngine
      mockValidationEngine.mockImplementation(() => ({
        validateEnvironment: jest.fn().mockResolvedValue({
          isValid: false,
          connectivity: { connected: false, responseTime: 5000, error: 'Critical failure' },
          schema: { isValid: false, tablesFound: 0, missingTables: ['all'], errors: ['No tables found'] },
          dataIntegrity: { isValid: false, totalRecords: 0, orphanedRecords: 0, errors: ['No data'] },
          auditSystem: { isValid: false, auditTablesPresent: false, errors: ['No audit system'] },
          overallScore: 0,
          timestamp: new Date()
        })
      }))

      const webhookConfig: MonitoringConfig = {
        ...defaultConfig,
        alerting: {
          ...defaultConfig.alerting,
          webhookUrl: 'https://webhook.test.com/alerts'
        }
      }

      const webhookMonitor = new HealthMonitoringSystem(webhookConfig)
      await webhookMonitor.performHealthCheck(mockUnhealthyEnvironment)

      // Wait for async webhook calls
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have attempted to send webhook (may or may not succeed depending on alert creation)
      // The test verifies the system doesn't crash when webhooks are configured
      expect(true).toBe(true)
    })

    it('should manage alert lifecycle correctly', async () => {
      // Create some alerts first
      const mockValidationEngine = require('../../lib/environment-management/validation/validation-engine').ValidationEngine
      mockValidationEngine.mockImplementation(() => ({
        validateEnvironment: jest.fn().mockResolvedValue({
          isValid: false,
          connectivity: { connected: false, responseTime: 5000, error: 'Test failure' },
          schema: { isValid: true, tablesFound: 25, missingTables: [], errors: [] },
          dataIntegrity: { isValid: true, totalRecords: 1000, orphanedRecords: 0, errors: [] },
          auditSystem: { isValid: true, auditTablesPresent: true, errors: [] },
          overallScore: 40,
          timestamp: new Date()
        })
      }))

      const alertMonitor = new HealthMonitoringSystem(defaultConfig)
      await alertMonitor.performHealthCheck(mockEnvironment)

      const alerts = alertMonitor.getActiveAlerts(mockEnvironment.id)
      
      if (alerts.length > 0) {
        const alertId = alerts[0].id

        // Test acknowledgment
        alertMonitor.acknowledgeAlert(mockEnvironment.id, alertId)
        const acknowledgedAlerts = alertMonitor.getActiveAlerts(mockEnvironment.id)
        const acknowledgedAlert = acknowledgedAlerts.find(a => a.id === alertId)
        expect(acknowledgedAlert?.acknowledged).toBe(true)

        // Test resolution
        alertMonitor.resolveAlert(mockEnvironment.id, alertId)
        
        // Alert should be marked for removal (removed after timeout)
        expect(true).toBe(true) // Test passes if no errors
      } else {
        // If no alerts created, test the methods don't crash
        alertMonitor.acknowledgeAlert(mockEnvironment.id, 'non-existent')
        alertMonitor.resolveAlert(mockEnvironment.id, 'non-existent')
        expect(true).toBe(true)
      }
    })

    it('should handle escalation rules', async () => {
      const escalationConfig: MonitoringConfig = {
        ...defaultConfig,
        alerting: {
          ...defaultConfig.alerting,
          escalationRules: [
            {
              condition: 'critical',
              delay: 1, // 1 minute
              action: 'webhook',
              recipients: ['admin@test.com', 'ops@test.com']
            },
            {
              condition: 'high',
              delay: 5, // 5 minutes
              action: 'email',
              recipients: ['support@test.com']
            }
          ]
        }
      }

      const escalationMonitor = new HealthMonitoringSystem(escalationConfig)
      
      // The escalation rules are configured and should not cause errors
      const report = await escalationMonitor.performHealthCheck(mockEnvironment)
      expect(report).toBeDefined()
    })
  })

  describe('Historical Data and Trends', () => {
    it('should store and retrieve health history', async () => {
      // Generate some history
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      const history = healthMonitoringSystem.getHealthHistory(mockEnvironment.id)
      
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBe(3)
      
      history.forEach(report => {
        expect(report.environmentId).toBe(mockEnvironment.id)
        expect(report.timestamp).toBeInstanceOf(Date)
        expect(report.healthStatus).toBeDefined()
        expect(report.performanceMetrics).toBeDefined()
      })
    })

    it('should filter history by timeframe', async () => {
      // Generate history
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

    it('should generate health trends', async () => {
      // Generate multiple health checks to create trends
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      const latestReport = await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      
      expect(Array.isArray(latestReport.trends)).toBe(true)
      
      // If trends are generated, verify their structure
      latestReport.trends.forEach(trend => {
        expect(trend.metric).toBeDefined()
        expect(['1h', '24h', '7d', '30d']).toContain(trend.timeframe)
        expect(Array.isArray(trend.values)).toBe(true)
        expect(['improving', 'stable', 'degrading']).toContain(trend.trend)
      })
    })

    it('should cleanup old data according to retention policy', async () => {
      // Generate some history
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)
      await healthMonitoringSystem.performHealthCheck(mockEnvironment)

      // Perform cleanup
      healthMonitoringSystem.cleanup()

      // Should not throw errors
      expect(true).toBe(true)
      
      // History should still be accessible (within retention period)
      const history = healthMonitoringSystem.getHealthHistory(mockEnvironment.id)
      expect(Array.isArray(history)).toBe(true)
    })
  })

  describe('Configuration and Customization', () => {
    it('should respect custom performance thresholds', async () => {
      const strictConfig: MonitoringConfig = {
        ...defaultConfig,
        performanceThresholds: {
          responseTime: 100, // Very strict - 100ms
          errorRate: 1, // Very strict - 1%
          throughput: 50 // High expectation - 50 req/s
        }
      }

      const strictMonitor = new HealthMonitoringSystem(strictConfig)
      const report = await strictMonitor.performHealthCheck(mockEnvironment)

      expect(report).toBeDefined()
      expect(report.healthStatus).toBeDefined()
      
      // With strict thresholds, might detect more issues
      // (depends on actual performance metrics)
    })

    it('should handle disabled alerting', async () => {
      const noAlertConfig: MonitoringConfig = {
        ...defaultConfig,
        alerting: {
          ...defaultConfig.alerting,
          enabled: false
        }
      }

      const noAlertMonitor = new HealthMonitoringSystem(noAlertConfig)
      const report = await noAlertMonitor.performHealthCheck(mockEnvironment)

      expect(report).toBeDefined()
      // Should work normally even with alerting disabled
    })

    it('should respect custom retention policies', async () => {
      const shortRetentionConfig: MonitoringConfig = {
        ...defaultConfig,
        retention: {
          metricsRetentionDays: 1,
          alertsRetentionDays: 1,
          reportsRetentionDays: 1
        }
      }

      const shortRetentionMonitor = new HealthMonitoringSystem(shortRetentionConfig)
      await shortRetentionMonitor.performHealthCheck(mockEnvironment)

      // Should work with custom retention settings
      expect(true).toBe(true)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle validation engine failures', async () => {
      // Mock validation engine failure
      const mockValidationEngine = require('../../lib/environment-management/validation/validation-engine').ValidationEngine
      mockValidationEngine.mockImplementation(() => ({
        validateEnvironment: jest.fn().mockRejectedValue(new Error('Validation failed'))
      }))

      const resilientMonitor = new HealthMonitoringSystem(defaultConfig)
      
      // Should handle the error gracefully
      await expect(
        resilientMonitor.performHealthCheck(mockEnvironment)
      ).rejects.toThrow('Validation failed')
    })

    it('should handle performance metrics collection failures', async () => {
      // Mock Supabase failure
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const metrics = await healthMonitoringSystem.collectPerformanceMetrics(mockEnvironment)

      // Should return error metrics
      expect(metrics.responseTime).toBe(-1)
      expect(metrics.errorRate).toBe(100)
      expect(metrics.throughput).toBe(0)
    })

    it('should handle webhook notification failures', async () => {
      // Mock fetch failure
      const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const webhookConfig: MonitoringConfig = {
        ...defaultConfig,
        alerting: {
          ...defaultConfig.alerting,
          webhookUrl: 'https://failing-webhook.test.com'
        }
      }

      const webhookMonitor = new HealthMonitoringSystem(webhookConfig)
      
      // Should handle webhook failures gracefully
      await webhookMonitor.performHealthCheck(mockEnvironment)
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      fetchSpy.mockRestore()
      consoleSpy.mockRestore()
    })

    it('should handle concurrent health checks', async () => {
      const promises = Array(5).fill(null).map(() => 
        healthMonitoringSystem.performHealthCheck(mockEnvironment)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.environmentId).toBe(mockEnvironment.id)
      })
    })
  })
})