/**
 * Validation and Health Checking System
 * 
 * Comprehensive validation, testing, and monitoring system for
 * environment health and functionality validation.
 */

export { ValidationEngine } from './validation-engine'
export type {
  DatabaseConnectivityResult,
  SchemaValidationResult,
  DataIntegrityResult,
  AuditSystemValidationResult,
  ValidationEngineResult
} from './validation-engine'

export { FunctionalityTestSuite } from './functionality-test-suite'
export type {
  TestResult,
  AuthenticationTestResult,
  CRUDTestResult,
  RealtimeTestResult,
  AuditTestResult,
  FunctionalityTestSuiteResult
} from './functionality-test-suite'

export { HealthMonitoringSystem } from './health-monitoring-system'
export type {
  PerformanceMetrics,
  HealthStatus,
  HealthIssue,
  HealthReport,
  HealthTrend,
  HealthAlert,
  MonitoringConfig,
  EscalationRule
} from './health-monitoring-system'

/**
 * Complete Validation and Health System
 * 
 * Combines all validation, testing, and monitoring capabilities
 * into a single comprehensive system.
 */
export class ValidationAndHealthSystem {
  private validationEngine: ValidationEngine
  private functionalityTestSuite: FunctionalityTestSuite
  private healthMonitoringSystem: HealthMonitoringSystem

  constructor(monitoringConfig: MonitoringConfig) {
    this.validationEngine = new ValidationEngine()
    this.functionalityTestSuite = new FunctionalityTestSuite()
    this.healthMonitoringSystem = new HealthMonitoringSystem(monitoringConfig)
  }

  /**
   * Get validation engine
   */
  public getValidationEngine(): ValidationEngine {
    return this.validationEngine
  }

  /**
   * Get functionality test suite
   */
  public getFunctionalityTestSuite(): FunctionalityTestSuite {
    return this.functionalityTestSuite
  }

  /**
   * Get health monitoring system
   */
  public getHealthMonitoringSystem(): HealthMonitoringSystem {
    return this.healthMonitoringSystem
  }

  /**
   * Perform complete environment assessment
   */
  public async performCompleteAssessment(env: Environment): Promise<{
    validation: ValidationEngineResult
    functionality?: FunctionalityTestSuiteResult
    health: HealthReport
  }> {
    // Run validation
    const validation = await this.validationEngine.validateEnvironment(env)

    // Run functionality tests (only for non-production)
    let functionality: FunctionalityTestSuiteResult | undefined
    if (!env.isProduction) {
      functionality = await this.functionalityTestSuite.runFullTestSuite(env)
    }

    // Get health report
    const health = await this.healthMonitoringSystem.performHealthCheck(env)

    return {
      validation,
      functionality,
      health
    }
  }

  /**
   * Start monitoring an environment
   */
  public startMonitoring(env: Environment): void {
    this.healthMonitoringSystem.startMonitoring(env)
  }

  /**
   * Stop monitoring an environment
   */
  public stopMonitoring(environmentId: string): void {
    this.healthMonitoringSystem.stopMonitoring(environmentId)
  }

  /**
   * Cleanup old data
   */
  public cleanup(): void {
    this.healthMonitoringSystem.cleanup()
  }

  /**
   * Stop all monitoring
   */
  public shutdown(): void {
    this.healthMonitoringSystem.stopAllMonitoring()
  }
}

// Import Environment type
import type { Environment } from '../types'
import type { MonitoringConfig } from './health-monitoring-system'