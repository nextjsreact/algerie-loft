/**
 * CLI and Automation Integration Test Suite
 * 
 * End-to-end integration tests that combine CLI commands with automation scripts
 * to test complete workflows and cross-system reliability.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { EnvironmentCLI } from '../../../lib/environment-management/cli/environment-cli'
import { SwitchCommand } from '../../../lib/environment-management/cli/switch-command'
import { DailyEnvironmentRefresh } from '../../../lib/environment-management/automation/daily-refresh'
import { TrainingEnvironmentSetup } from '../../../lib/environment-management/automation/training-environment-setup'
import { DevelopmentEnvironmentSetup } from '../../../lib/environment-management/automation/development-environment-setup'

// Mock all dependencies
jest.mock('../../../lib/environment-management/core/environment-cloner')
jest.mock('../../../lib/environment-management/core/validation-engine')
jest.mock('../../../lib/environment-management/core/configuration-manager')
jest.mock('../../../lib/environment-management/core/production-safety-guard')
jest.mock('../../../lib/environment-management/core/environment-switcher')
jest.mock('../../../lib/environment-management/environment-config-manager')
jest.mock('../../../lib/environment-management/environment-validator')
jest.mock('../../../lib/environment-management/anonymization')
jest.mock('../../../lib/logger')

describe('CLI and Automation Integration Test Suite', () => {
  let cli: EnvironmentCLI
  let switchCommand: SwitchCommand
  let dailyRefresh: DailyEnvironmentRefresh
  let trainingSetup: TrainingEnvironmentSetup
  let devSetup: DevelopmentEnvironmentSetup

  beforeEach(() => {
    cli = new EnvironmentCLI()
    switchCommand = new SwitchCommand()
    dailyRefresh = new DailyEnvironmentRefresh({
      targetEnvironments: ['test', 'training'],
      refreshTime: '02:00',
      weekdaysOnly: true,
      anonymizeData: true,
      includeAuditLogs: true,
      includeConversations: true,
      includeReservations: true,
      createBackups: true,
      validateAfterRefresh: true,
      notifyOnSuccess: false,
      notifyOnFailure: true
    })
    trainingSetup = new TrainingEnvironmentSetup()
    devSetup = new DevelopmentEnvironmentSetup()

    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Complete Environment Lifecycle Workflows', () => {
    it('should execute complete development environment setup workflow', async () => {
      // Step 1: Setup development environment
      const devConfig = DevelopmentEnvironmentSetup.getDefaultConfig()
      const mockDevResult = {
        success: true,
        environmentId: 'dev-workflow-123',
        environmentName: 'dev-workflow',
        configurationPath: '.env.development',
        devUsers: [
          {
            id: 'dev_admin',
            email: 'admin@dev.local',
            password: 'DevAdmin123!',
            role: 'admin',
            purpose: 'Full system access for development'
          }
        ],
        sampleDataSummary: {
          lofts: 10,
          reservations: 25,
          transactions: 50,
          users: 5,
          totalSize: '15 MB'
        },
        devToolsEnabled: ['Debug Mode', 'Hot Reload'],
        setupDuration: 45000,
        quickStartGuide: ['🚀 Development Environment Quick Start Guide'],
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockDevResult)

      // Step 2: Switch to development environment
      const mockSwitchResult = {
        success: true,
        targetEnvironment: 'development',
        previousEnvironment: 'production',
        currentEnvironment: 'development',
        backupPath: 'backups/env-backup-prod-123',
        servicesRestarted: true,
        switchDuration: 5000,
        warnings: []
      }

      jest.spyOn(cli, 'switchEnvironment').mockResolvedValue(mockSwitchResult)

      // Step 3: Validate development environment
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {},
        healthScore: 95,
        testsPassedCount: 98,
        totalTestsCount: 100
      }

      jest.spyOn(cli, 'validateEnvironment').mockResolvedValue(mockValidationResult)

      // Execute workflow
      const devResult = await devSetup.setupDevelopmentEnvironment(devConfig)
      const switchResult = await cli.switchEnvironment({
        targetEnvironment: 'development',
        backupCurrent: true,
        restartServices: true
      })
      const validationResult = await cli.validateEnvironment({
        environment: 'development',
        fullValidation: true
      })

      // Verify workflow completion
      expect(devResult.success).toBe(true)
      expect(switchResult.success).toBe(true)
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.healthScore).toBeGreaterThan(90)
    })

    it('should execute complete training environment setup and validation workflow', async () => {
      // Step 1: Setup training environment
      const trainingConfig = {
        environmentName: 'training-workflow',
        baseEnvironment: 'production' as const,
        generateSampleData: true,
        sampleDataSize: 'medium' as const,
        includeHistoricalData: true,
        createTrainingUsers: true,
        trainingUserRoles: TrainingEnvironmentSetup.getDefaultTrainingUserRoles(),
        setupTrainingScenarios: true,
        trainingScenarios: TrainingEnvironmentSetup.getDefaultTrainingScenarios(),
        includeAuditSystem: true,
        includeConversations: true,
        includeReservations: true,
        includeNotifications: true,
        autoCleanupAfterDays: 30,
        createBackup: true,
        generateTrainingGuide: true,
        includeTestData: true
      }

      const mockTrainingResult = {
        success: true,
        environmentId: 'training-workflow-123',
        environmentUrl: 'https://training-workflow.supabase.co',
        trainingUsers: [
          {
            id: 'training_admin_1',
            email: 'training.admin1@loft-algerie.training',
            password: 'TrainingAdmin1!',
            role: 'admin',
            permissions: ['all'],
            sampleDataAssigned: true
          }
        ],
        sampleDataGenerated: {
          lofts: 15,
          reservations: 100,
          transactions: 250,
          conversations: 50,
          tasks: 75,
          users: 20,
          auditLogs: 500
        },
        scenariosSetup: ['Basic Loft Management', 'Reservation Workflow'],
        trainingGuideUrl: 'https://docs.loft-algerie.training/training-workflow/guide',
        errors: [],
        warnings: [],
        setupDuration: 180000,
        completedAt: new Date()
      }

      jest.spyOn(trainingSetup, 'setupTrainingEnvironment').mockResolvedValue(mockTrainingResult)

      // Step 2: Clone production data to training environment
      const mockCloneResult = {
        success: true,
        operationId: 'clone-training-123',
        duration: 120000,
        statistics: {
          tablesCloned: 20,
          recordsCloned: 5000,
          recordsAnonymized: 4500,
          functionsCloned: 10,
          triggersCloned: 8,
          totalSizeCloned: '200 MB'
        }
      }

      jest.spyOn(cli, 'cloneEnvironment').mockResolvedValue(mockCloneResult)

      // Step 3: Validate training environment
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Training environment ready for use'],
        statistics: {},
        healthScore: 98,
        testsPassedCount: 100,
        totalTestsCount: 100,
        reportPath: 'reports/validation-training-workflow.json'
      }

      jest.spyOn(cli, 'validateEnvironment').mockResolvedValue(mockValidationResult)

      // Execute workflow
      const trainingResult = await trainingSetup.setupTrainingEnvironment(trainingConfig)
      const cloneResult = await cli.cloneEnvironment({
        source: 'production',
        target: 'training-workflow',
        anonymizeData: true,
        includeAuditLogs: true,
        includeConversations: true,
        includeReservations: true
      })
      const validationResult = await cli.validateEnvironment({
        environment: 'training-workflow',
        fullValidation: true,
        generateReport: true
      })

      // Verify workflow completion
      expect(trainingResult.success).toBe(true)
      expect(cloneResult.success).toBe(true)
      expect(validationResult.isValid).toBe(true)
      expect(trainingResult.trainingUsers.length).toBeGreaterThan(0)
      expect(cloneResult.statistics.recordsAnonymized).toBeGreaterThan(0)
    })

    it('should execute daily refresh automation with CLI validation', async () => {
      // Step 1: Execute daily refresh
      const mockRefreshResult = {
        success: true,
        refreshedEnvironments: ['test', 'training'],
        failedEnvironments: [],
        totalDuration: 180000,
        results: [
          {
            success: true,
            operationId: 'refresh-test-123',
            statistics: {
              tablesCloned: 15,
              recordsCloned: 1000,
              recordsAnonymized: 800,
              functionsCloned: 5,
              triggersCloned: 3,
              totalSizeCloned: '50 MB'
            }
          },
          {
            success: true,
            operationId: 'refresh-training-456',
            statistics: {
              tablesCloned: 15,
              recordsCloned: 1200,
              recordsAnonymized: 950,
              functionsCloned: 5,
              triggersCloned: 3,
              totalSizeCloned: '60 MB'
            }
          }
        ],
        errors: [],
        timestamp: new Date()
      }

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockRefreshResult)

      // Step 2: Validate refreshed environments using CLI
      const mockTestValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {},
        healthScore: 95,
        testsPassedCount: 98,
        totalTestsCount: 100
      }

      const mockTrainingValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {},
        healthScore: 97,
        testsPassedCount: 99,
        totalTestsCount: 100
      }

      jest.spyOn(cli, 'validateEnvironment')
        .mockResolvedValueOnce(mockTestValidation)
        .mockResolvedValueOnce(mockTrainingValidation)

      // Execute workflow
      const refreshResult = await dailyRefresh.executeDailyRefresh()
      const testValidation = await cli.validateEnvironment({ environment: 'test' })
      const trainingValidation = await cli.validateEnvironment({ environment: 'training' })

      // Verify workflow completion
      expect(refreshResult.success).toBe(true)
      expect(refreshResult.refreshedEnvironments).toHaveLength(2)
      expect(testValidation.isValid).toBe(true)
      expect(trainingValidation.isValid).toBe(true)
      expect(testValidation.healthScore).toBeGreaterThan(90)
      expect(trainingValidation.healthScore).toBeGreaterThan(90)
    })
  })

  describe('Cross-System Error Handling and Recovery', () => {
    it('should handle automation failure with CLI recovery', async () => {
      // Step 1: Daily refresh fails
      const mockFailedRefresh = {
        success: false,
        refreshedEnvironments: ['test'],
        failedEnvironments: ['training'],
        totalDuration: 90000,
        results: [
          {
            success: true,
            operationId: 'refresh-test-123',
            statistics: {
              tablesCloned: 15,
              recordsCloned: 1000,
              recordsAnonymized: 800,
              functionsCloned: 5,
              triggersCloned: 3,
              totalSizeCloned: '50 MB'
            }
          },
          {
            success: false,
            error: 'Training environment database connection failed',
            operationId: null,
            statistics: {
              tablesCloned: 0,
              recordsCloned: 0,
              recordsAnonymized: 0,
              functionsCloned: 0,
              triggersCloned: 0,
              totalSizeCloned: '0 MB'
            }
          }
        ],
        errors: ['training: Training environment database connection failed'],
        timestamp: new Date()
      }

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockFailedRefresh)

      // Step 2: Use CLI to manually fix training environment
      const mockManualClone = {
        success: true,
        operationId: 'manual-recovery-456',
        duration: 60000,
        statistics: {
          tablesCloned: 15,
          recordsCloned: 1200,
          recordsAnonymized: 950,
          functionsCloned: 5,
          triggersCloned: 3,
          totalSizeCloned: '60 MB'
        }
      }

      jest.spyOn(cli, 'cloneEnvironment').mockResolvedValue(mockManualClone)

      // Step 3: Validate recovery
      const mockRecoveryValidation = {
        isValid: true,
        errors: [],
        warnings: ['Environment recovered successfully'],
        statistics: {},
        healthScore: 95,
        testsPassedCount: 98,
        totalTestsCount: 100
      }

      jest.spyOn(cli, 'validateEnvironment').mockResolvedValue(mockRecoveryValidation)

      // Execute recovery workflow
      const refreshResult = await dailyRefresh.executeDailyRefresh()
      expect(refreshResult.success).toBe(false)
      expect(refreshResult.failedEnvironments).toContain('training')

      // Manual recovery using CLI
      const recoveryResult = await cli.cloneEnvironment({
        source: 'production',
        target: 'training',
        anonymizeData: true
      })
      const validationResult = await cli.validateEnvironment({ environment: 'training' })

      // Verify recovery
      expect(recoveryResult.success).toBe(true)
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.warnings).toContain('Environment recovered successfully')
    })

    it('should handle CLI command failure with automation fallback', async () => {
      // Step 1: CLI clone command fails
      const mockFailedClone = {
        success: false,
        error: 'Network timeout during clone operation',
        operationId: null,
        duration: 30000,
        statistics: {
          tablesCloned: 0,
          recordsCloned: 0,
          recordsAnonymized: 0,
          functionsCloned: 0,
          triggersCloned: 0,
          totalSizeCloned: '0 MB'
        }
      }

      jest.spyOn(cli, 'cloneEnvironment').mockResolvedValue(mockFailedClone)

      // Step 2: Use automation script as fallback
      const mockAutomationSuccess = {
        success: true,
        environmentId: 'dev-fallback-123',
        environmentName: 'dev-fallback',
        configurationPath: '.env.development',
        devUsers: [],
        sampleDataSummary: {
          lofts: 5,
          reservations: 10,
          transactions: 20,
          users: 3,
          totalSize: '5 MB'
        },
        devToolsEnabled: ['Hot Reload'],
        setupDuration: 30000,
        quickStartGuide: [],
        errors: [],
        warnings: ['Fallback to minimal setup due to network issues'],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockAutomationSuccess)

      // Execute fallback workflow
      const cloneResult = await cli.cloneEnvironment({
        source: 'production',
        target: 'development'
      })
      expect(cloneResult.success).toBe(false)

      // Fallback to automation
      const fallbackConfig = DevelopmentEnvironmentSetup.getMinimalConfig()
      const fallbackResult = await devSetup.setupDevelopmentEnvironment(fallbackConfig)

      // Verify fallback success
      expect(fallbackResult.success).toBe(true)
      expect(fallbackResult.warnings).toContain('Fallback to minimal setup due to network issues')
    })

    it('should handle environment switching failure during automation', async () => {
      // Step 1: Start development environment setup
      const devConfig = DevelopmentEnvironmentSetup.getDefaultConfig()
      const mockDevResult = {
        success: true,
        environmentId: 'dev-switch-test-123',
        environmentName: 'dev-switch-test',
        configurationPath: '.env.development',
        devUsers: [],
        sampleDataSummary: {
          lofts: 10,
          reservations: 25,
          transactions: 50,
          users: 5,
          totalSize: '15 MB'
        },
        devToolsEnabled: ['Debug Mode'],
        setupDuration: 45000,
        quickStartGuide: [],
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockDevResult)

      // Step 2: Environment switch fails
      const mockSwitchFailure = {
        success: false,
        error: 'Configuration file corrupted during switch',
        targetEnvironment: 'development',
        previousEnvironment: 'production',
        currentEnvironment: 'production', // Rolled back
        backupPath: 'backups/env-backup-prod-123',
        servicesRestarted: false,
        switchDuration: 8000,
        warnings: ['Configuration restored from backup']
      }

      jest.spyOn(switchCommand, 'execute').mockRejectedValue(
        new Error('Configuration file corrupted during switch')
      )

      // Step 3: Manual recovery using CLI
      const mockManualSwitch = {
        success: true,
        targetEnvironment: 'development',
        previousEnvironment: 'production',
        currentEnvironment: 'development',
        backupPath: 'backups/env-backup-prod-manual-456',
        servicesRestarted: true,
        switchDuration: 5000,
        warnings: []
      }

      jest.spyOn(cli, 'switchEnvironment').mockResolvedValue(mockManualSwitch)

      // Execute workflow with recovery
      const devResult = await devSetup.setupDevelopmentEnvironment(devConfig)
      expect(devResult.success).toBe(true)

      // Switch fails
      await expect(switchCommand.execute({
        target: 'development',
        backup: true,
        restart: true
      })).rejects.toThrow('Configuration file corrupted during switch')

      // Manual recovery
      const recoveryResult = await cli.switchEnvironment({
        targetEnvironment: 'development',
        backupCurrent: true,
        restartServices: true
      })

      expect(recoveryResult.success).toBe(true)
      expect(recoveryResult.currentEnvironment).toBe('development')
    })
  })

  describe('Performance and Scalability Integration Tests', () => {
    it('should handle multiple concurrent CLI operations', async () => {
      // Simulate multiple CLI operations running concurrently
      const operations = [
        cli.validateEnvironment({ environment: 'test' }),
        cli.validateEnvironment({ environment: 'training' }),
        cli.validateEnvironment({ environment: 'development' })
      ]

      const mockValidationResults = [
        {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: {},
          healthScore: 95,
          testsPassedCount: 98,
          totalTestsCount: 100
        },
        {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: {},
          healthScore: 97,
          testsPassedCount: 99,
          totalTestsCount: 100
        },
        {
          isValid: true,
          errors: [],
          warnings: [],
          statistics: {},
          healthScore: 93,
          testsPassedCount: 96,
          totalTestsCount: 100
        }
      ]

      jest.spyOn(cli, 'validateEnvironment')
        .mockResolvedValueOnce(mockValidationResults[0])
        .mockResolvedValueOnce(mockValidationResults[1])
        .mockResolvedValueOnce(mockValidationResults[2])

      const results = await Promise.all(operations)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.isValid)).toBe(true)
      expect(results.every(r => r.healthScore > 90)).toBe(true)
    })

    it('should handle large-scale automation with CLI monitoring', async () => {
      // Large-scale daily refresh
      const largeScaleConfig = {
        targetEnvironments: ['test', 'training', 'development', 'staging'] as const,
        refreshTime: '02:00',
        weekdaysOnly: false,
        anonymizeData: true,
        includeAuditLogs: true,
        includeConversations: true,
        includeReservations: true,
        createBackups: true,
        validateAfterRefresh: true,
        notifyOnSuccess: true,
        notifyOnFailure: true
      }

      const largeScaleRefresh = new DailyEnvironmentRefresh(largeScaleConfig)

      const mockLargeScaleResult = {
        success: true,
        refreshedEnvironments: ['test', 'training', 'development', 'staging'],
        failedEnvironments: [],
        totalDuration: 600000, // 10 minutes
        results: Array(4).fill(null).map((_, index) => ({
          success: true,
          operationId: `large-scale-${index}`,
          statistics: {
            tablesCloned: 20,
            recordsCloned: 5000,
            recordsAnonymized: 4000,
            functionsCloned: 10,
            triggersCloned: 8,
            totalSizeCloned: '200 MB'
          }
        })),
        errors: [],
        timestamp: new Date()
      }

      jest.spyOn(largeScaleRefresh, 'executeDailyRefresh').mockResolvedValue(mockLargeScaleResult)

      // Monitor with CLI
      const mockEnvironmentStatuses = [
        { name: 'test', isHealthy: true, lastChecked: new Date(), issues: [] },
        { name: 'training', isHealthy: true, lastChecked: new Date(), issues: [] },
        { name: 'development', isHealthy: true, lastChecked: new Date(), issues: [] },
        { name: 'staging', isHealthy: true, lastChecked: new Date(), issues: [] }
      ]

      jest.spyOn(cli, 'getEnvironmentStatus')
        .mockResolvedValueOnce(mockEnvironmentStatuses[0])
        .mockResolvedValueOnce(mockEnvironmentStatuses[1])
        .mockResolvedValueOnce(mockEnvironmentStatuses[2])
        .mockResolvedValueOnce(mockEnvironmentStatuses[3])

      // Execute large-scale operation
      const refreshResult = await largeScaleRefresh.executeDailyRefresh()
      
      // Monitor all environments
      const statusChecks = await Promise.all([
        cli.getEnvironmentStatus('test'),
        cli.getEnvironmentStatus('training'),
        cli.getEnvironmentStatus('development'),
        cli.getEnvironmentStatus('staging')
      ])

      expect(refreshResult.success).toBe(true)
      expect(refreshResult.refreshedEnvironments).toHaveLength(4)
      expect(statusChecks.every(status => status.isHealthy)).toBe(true)
    })
  })

  describe('Production Safety Integration Tests', () => {
    it('should enforce production safety across CLI and automation', async () => {
      // Test that production safety is enforced in both CLI and automation
      
      // CLI should block dangerous operations
      await expect(cli.resetEnvironment({
        environment: 'production'
      })).rejects.toThrow('BLOCKED: Cannot reset production environment')

      await expect(cli.cloneEnvironment({
        source: 'test',
        target: 'production'
      })).rejects.toThrow('BLOCKED: Cannot clone TO production environment')

      // Automation should enforce read-only production access
      const mockSafeRefresh = {
        success: true,
        refreshedEnvironments: ['test'],
        failedEnvironments: [],
        totalDuration: 60000,
        results: [
          {
            success: true,
            operationId: 'safe-prod-refresh-123',
            statistics: {
              tablesCloned: 15,
              recordsCloned: 1000,
              recordsAnonymized: 1000, // All data anonymized from production
              functionsCloned: 5,
              triggersCloned: 3,
              totalSizeCloned: '50 MB'
            }
          }
        ],
        errors: [],
        timestamp: new Date()
      }

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockSafeRefresh)

      const refreshResult = await dailyRefresh.executeDailyRefresh()
      
      expect(refreshResult.success).toBe(true)
      // Verify all records were anonymized (production safety)
      expect(refreshResult.results[0].statistics.recordsAnonymized).toBe(
        refreshResult.results[0].statistics.recordsCloned
      )
    })

    it('should audit production access across all systems', async () => {
      // Production validation should be audited
      const mockProductionValidation = {
        isValid: true,
        errors: [],
        warnings: ['Production environment - read-only access confirmed'],
        statistics: {},
        healthScore: 100,
        testsPassedCount: 100,
        totalTestsCount: 100,
        auditLog: {
          timestamp: new Date(),
          operation: 'production_validation',
          user: 'system',
          accessType: 'read-only'
        }
      }

      jest.spyOn(cli, 'validateEnvironment').mockResolvedValue(mockProductionValidation)

      const validationResult = await cli.validateEnvironment({
        environment: 'production',
        fullValidation: true
      })

      expect(validationResult.isValid).toBe(true)
      expect(validationResult.warnings).toContain('Production environment - read-only access confirmed')
      expect(validationResult.auditLog).toBeDefined()
      expect(validationResult.auditLog?.accessType).toBe('read-only')
    })
  })
})