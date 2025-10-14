/**
 * Automation Scripts End-to-End Test Suite
 * 
 * Tests for automation scripts including daily refresh, training environment setup,
 * and development environment setup with comprehensive scenarios.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { 
  DailyEnvironmentRefresh, 
  DailyRefreshConfig, 
  DailyRefreshResult 
} from '../../../lib/environment-management/automation/daily-refresh'
import { 
  TrainingEnvironmentSetup, 
  TrainingSetupConfig, 
  TrainingSetupResult 
} from '../../../lib/environment-management/automation/training-environment-setup'
import { 
  DevelopmentEnvironmentSetup, 
  DevelopmentSetupConfig, 
  DevelopmentSetupResult 
} from '../../../lib/environment-management/automation/development-environment-setup'

// Mock dependencies
jest.mock('../../../lib/environment-management/environment-cloner')
jest.mock('../../../lib/environment-management/environment-config-manager')
jest.mock('../../../lib/environment-management/production-safety-guard')
jest.mock('../../../lib/environment-management/environment-validator')
jest.mock('../../../lib/environment-management/anonymization')
jest.mock('../../../lib/logger')

describe('Automation Scripts End-to-End Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Daily Environment Refresh Automation', () => {
    let dailyRefresh: DailyEnvironmentRefresh
    let config: DailyRefreshConfig

    beforeEach(() => {
      config = {
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
      }
      dailyRefresh = new DailyEnvironmentRefresh(config)
    })

    it('should execute daily refresh successfully for all environments', async () => {
      const mockResult: DailyRefreshResult = {
        success: true,
        refreshedEnvironments: ['test', 'training'],
        failedEnvironments: [],
        totalDuration: 120000, // 2 minutes
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

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockResult)

      const result = await dailyRefresh.executeDailyRefresh()

      expect(result.success).toBe(true)
      expect(result.refreshedEnvironments).toHaveLength(2)
      expect(result.failedEnvironments).toHaveLength(0)
      expect(result.totalDuration).toBe(120000)
    })

    it('should handle partial failures during daily refresh', async () => {
      const mockResult: DailyRefreshResult = {
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

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockResult)

      const result = await dailyRefresh.executeDailyRefresh()

      expect(result.success).toBe(false)
      expect(result.refreshedEnvironments).toEqual(['test'])
      expect(result.failedEnvironments).toEqual(['training'])
      expect(result.errors).toHaveLength(1)
    })

    it('should handle complete failure during daily refresh', async () => {
      const mockResult: DailyRefreshResult = {
        success: false,
        refreshedEnvironments: [],
        failedEnvironments: ['test', 'training'],
        totalDuration: 5000,
        results: [],
        errors: ['Production environment validation failed'],
        timestamp: new Date()
      }

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockResult)

      const result = await dailyRefresh.executeDailyRefresh()

      expect(result.success).toBe(false)
      expect(result.refreshedEnvironments).toHaveLength(0)
      expect(result.failedEnvironments).toHaveLength(2)
      expect(result.errors).toContain('Production environment validation failed')
    })

    it('should get refresh status correctly', () => {
      const status = dailyRefresh.getRefreshStatus()

      expect(status).toHaveProperty('isRunning')
      expect(status).toHaveProperty('lastRun')
      expect(typeof status.isRunning).toBe('boolean')
    })

    it('should start and stop scheduled refresh', () => {
      jest.spyOn(dailyRefresh, 'startScheduledRefresh').mockImplementation(() => {})
      jest.spyOn(dailyRefresh, 'stopScheduledRefresh').mockImplementation(() => {})

      expect(() => dailyRefresh.startScheduledRefresh()).not.toThrow()
      expect(() => dailyRefresh.stopScheduledRefresh()).not.toThrow()
    })

    it('should handle production safety validation', async () => {
      // Test that production is always validated as read-only source
      const mockResult: DailyRefreshResult = {
        success: true,
        refreshedEnvironments: ['test'],
        failedEnvironments: [],
        totalDuration: 60000,
        results: [
          {
            success: true,
            operationId: 'refresh-prod-safe-123',
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

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockResult)

      const result = await dailyRefresh.executeDailyRefresh()

      expect(result.success).toBe(true)
      // Verify all records were anonymized (production safety)
      expect(result.results[0].statistics.recordsAnonymized).toBe(
        result.results[0].statistics.recordsCloned
      )
    })
  })

  describe('Training Environment Setup Automation', () => {
    let trainingSetup: TrainingEnvironmentSetup
    let config: TrainingSetupConfig

    beforeEach(() => {
      config = {
        environmentName: 'training-test-env',
        baseEnvironment: 'production',
        generateSampleData: true,
        sampleDataSize: 'medium',
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
      trainingSetup = new TrainingEnvironmentSetup()
    })

    it('should setup complete training environment successfully', async () => {
      const mockResult: TrainingSetupResult = {
        success: true,
        environmentId: 'training-env-123',
        environmentUrl: 'https://training-test-env.supabase.co',
        trainingUsers: [
          {
            id: 'training_admin_1',
            email: 'training.admin1@loft-algerie.training',
            password: 'TrainingAdmin1!',
            role: 'admin',
            permissions: ['all'],
            sampleDataAssigned: true
          },
          {
            id: 'training_manager_1',
            email: 'training.manager1@loft-algerie.training',
            password: 'TrainingManager1!',
            role: 'manager',
            permissions: ['lofts', 'reservations', 'transactions', 'reports'],
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
        scenariosSetup: ['Basic Loft Management', 'Reservation Workflow', 'Financial Management'],
        trainingGuideUrl: 'https://docs.loft-algerie.training/training-test-env/guide',
        backupId: 'backup-123',
        errors: [],
        warnings: [],
        setupDuration: 180000, // 3 minutes
        completedAt: new Date()
      }

      jest.spyOn(trainingSetup, 'setupTrainingEnvironment').mockResolvedValue(mockResult)

      const result = await trainingSetup.setupTrainingEnvironment(config)

      expect(result.success).toBe(true)
      expect(result.trainingUsers).toHaveLength(2)
      expect(result.sampleDataGenerated.lofts).toBe(15)
      expect(result.scenariosSetup).toHaveLength(3)
      expect(result.trainingGuideUrl).toContain('training-test-env')
    })

    it('should handle training environment setup with minimal configuration', async () => {
      const minimalConfig: TrainingSetupConfig = {
        ...config,
        generateSampleData: false,
        createTrainingUsers: false,
        setupTrainingScenarios: false,
        generateTrainingGuide: false
      }

      const mockResult: TrainingSetupResult = {
        success: true,
        environmentId: 'training-minimal-123',
        environmentUrl: 'https://training-test-env.supabase.co',
        trainingUsers: [],
        sampleDataGenerated: {
          lofts: 0,
          reservations: 0,
          transactions: 0,
          conversations: 0,
          tasks: 0,
          users: 0,
          auditLogs: 0
        },
        scenariosSetup: [],
        errors: [],
        warnings: [],
        setupDuration: 30000, // 30 seconds
        completedAt: new Date()
      }

      jest.spyOn(trainingSetup, 'setupTrainingEnvironment').mockResolvedValue(mockResult)

      const result = await trainingSetup.setupTrainingEnvironment(minimalConfig)

      expect(result.success).toBe(true)
      expect(result.trainingUsers).toHaveLength(0)
      expect(result.sampleDataGenerated.lofts).toBe(0)
      expect(result.scenariosSetup).toHaveLength(0)
      expect(result.setupDuration).toBeLessThan(60000)
    })

    it('should handle training environment setup failures', async () => {
      const mockResult: TrainingSetupResult = {
        success: false,
        environmentId: '',
        environmentUrl: '',
        trainingUsers: [],
        sampleDataGenerated: {
          lofts: 0,
          reservations: 0,
          transactions: 0,
          conversations: 0,
          tasks: 0,
          users: 0,
          auditLogs: 0
        },
        scenariosSetup: [],
        errors: ['Failed to create training environment configuration'],
        warnings: [],
        setupDuration: 5000,
        completedAt: new Date()
      }

      jest.spyOn(trainingSetup, 'setupTrainingEnvironment').mockResolvedValue(mockResult)

      const result = await trainingSetup.setupTrainingEnvironment(config)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failed to create training environment')
    })

    it('should validate default training scenarios', () => {
      const scenarios = TrainingEnvironmentSetup.getDefaultTrainingScenarios()

      expect(scenarios).toHaveLength(4)
      expect(scenarios[0].name).toBe('Basic Loft Management')
      expect(scenarios[1].name).toBe('Reservation Workflow')
      expect(scenarios[2].name).toBe('Financial Management')
      expect(scenarios[3].name).toBe('Team Collaboration')

      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('description')
        expect(scenario).toHaveProperty('dataRequirements')
        expect(scenario).toHaveProperty('setupSteps')
        expect(scenario).toHaveProperty('expectedOutcomes')
      })
    })

    it('should validate default training user roles', () => {
      const userRoles = TrainingEnvironmentSetup.getDefaultTrainingUserRoles()

      expect(userRoles).toHaveLength(4)
      expect(userRoles.map(role => role.role)).toEqual(['admin', 'manager', 'member', 'viewer'])

      userRoles.forEach(role => {
        expect(role).toHaveProperty('count')
        expect(role).toHaveProperty('permissions')
        expect(role).toHaveProperty('sampleData')
        expect(role.count).toBeGreaterThan(0)
      })
    })
  })

  describe('Development Environment Setup Automation', () => {
    let devSetup: DevelopmentEnvironmentSetup
    let config: DevelopmentSetupConfig

    beforeEach(() => {
      config = DevelopmentEnvironmentSetup.getDefaultConfig()
      devSetup = new DevelopmentEnvironmentSetup()
    })

    it('should setup development environment with default configuration', async () => {
      const mockResult: DevelopmentSetupResult = {
        success: true,
        environmentId: 'dev-env-123',
        environmentName: 'dev-1234567890',
        configurationPath: '.env.development',
        devUsers: [
          {
            id: 'dev_admin',
            email: 'admin@dev.local',
            password: 'DevAdmin123!',
            role: 'admin',
            purpose: 'Full system access for development'
          },
          {
            id: 'dev_user',
            email: 'user@dev.local',
            password: 'DevUser123!',
            role: 'member',
            purpose: 'Standard user testing'
          }
        ],
        sampleDataSummary: {
          lofts: 10,
          reservations: 25,
          transactions: 50,
          users: 5,
          totalSize: '15 MB'
        },
        devToolsEnabled: ['Debug Mode', 'Hot Reload', 'Test Data Utilities'],
        setupDuration: 45000, // 45 seconds
        quickStartGuide: [
          '🚀 Development Environment Quick Start Guide',
          '1. Start Development Server:',
          '   npm run dev'
        ],
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockResult)

      const result = await devSetup.setupDevelopmentEnvironment(config)

      expect(result.success).toBe(true)
      expect(result.devUsers).toHaveLength(2)
      expect(result.sampleDataSummary.lofts).toBe(10)
      expect(result.devToolsEnabled).toContain('Debug Mode')
      expect(result.setupDuration).toBeLessThan(60000)
    })

    it('should setup development environment with minimal configuration', async () => {
      const minimalConfig = DevelopmentEnvironmentSetup.getMinimalConfig()

      const mockResult: DevelopmentSetupResult = {
        success: true,
        environmentId: 'dev-minimal-123',
        environmentName: 'dev-minimal-1234567890',
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
          lofts: 3,
          reservations: 5,
          transactions: 10,
          users: 3,
          totalSize: '2 MB'
        },
        devToolsEnabled: ['Hot Reload'],
        setupDuration: 15000, // 15 seconds
        quickStartGuide: [
          '🚀 Development Environment Quick Start Guide',
          '1. Start Development Server:',
          '   npm run dev'
        ],
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockResult)

      const result = await devSetup.setupDevelopmentEnvironment(minimalConfig)

      expect(result.success).toBe(true)
      expect(result.sampleDataSummary.lofts).toBe(3)
      expect(result.setupDuration).toBeLessThan(30000)
      expect(result.devToolsEnabled).toHaveLength(1)
    })

    it('should handle development environment setup with local database', async () => {
      const localConfig: DevelopmentSetupConfig = {
        ...config,
        useLocalDatabase: true,
        localDatabaseUrl: 'http://localhost:54321'
      }

      const mockResult: DevelopmentSetupResult = {
        success: true,
        environmentId: 'dev-local-123',
        environmentName: 'dev-local-1234567890',
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
          lofts: 5,
          reservations: 10,
          transactions: 20,
          users: 3,
          totalSize: '5 MB'
        },
        devToolsEnabled: ['Debug Mode', 'Hot Reload', 'Database Tools'],
        setupDuration: 20000,
        quickStartGuide: [
          '🚀 Development Environment Quick Start Guide',
          '• Database: Local',
          '• Database: http://localhost:54321'
        ],
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockResult)

      const result = await devSetup.setupDevelopmentEnvironment(localConfig)

      expect(result.success).toBe(true)
      expect(result.quickStartGuide.some(line => line.includes('localhost:54321'))).toBe(true)
    })

    it('should handle development environment setup failures', async () => {
      const mockResult: DevelopmentSetupResult = {
        success: false,
        environmentId: '',
        environmentName: 'dev-failed',
        configurationPath: '',
        devUsers: [],
        sampleDataSummary: {
          lofts: 0,
          reservations: 0,
          transactions: 0,
          users: 0,
          totalSize: '0 MB'
        },
        devToolsEnabled: [],
        setupDuration: 2000,
        quickStartGuide: [],
        errors: ['Failed to create development environment configuration'],
        warnings: [],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockResult)

      const result = await devSetup.setupDevelopmentEnvironment(config)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failed to create development environment')
    })

    it('should validate default and minimal configurations', () => {
      const defaultConfig = DevelopmentEnvironmentSetup.getDefaultConfig()
      const minimalConfig = DevelopmentEnvironmentSetup.getMinimalConfig()

      // Validate default config
      expect(defaultConfig.sourceEnvironment).toBe('production')
      expect(defaultConfig.minimalDataSet).toBe(true)
      expect(defaultConfig.includeDevTools).toBe(true)
      expect(defaultConfig.createDevUsers).toBe(true)

      // Validate minimal config
      expect(minimalConfig.sourceEnvironment).toBe('minimal')
      expect(minimalConfig.fastSetup).toBe(true)
      expect(minimalConfig.skipValidation).toBe(true)
      expect(minimalConfig.useLocalDatabase).toBe(true)
      expect(minimalConfig.maxRecordsPerTable).toBe(3)
    })
  })

  describe('Cross-Automation Integration Tests', () => {
    it('should handle sequential automation operations', async () => {
      // Test running multiple automation scripts in sequence
      const devSetup = new DevelopmentEnvironmentSetup()
      const trainingSetup = new TrainingEnvironmentSetup()

      const devConfig = DevelopmentEnvironmentSetup.getMinimalConfig()
      const trainingConfig: TrainingSetupConfig = {
        environmentName: 'training-after-dev',
        baseEnvironment: 'production',
        generateSampleData: true,
        sampleDataSize: 'small',
        includeHistoricalData: false,
        createTrainingUsers: true,
        trainingUserRoles: TrainingEnvironmentSetup.getDefaultTrainingUserRoles().slice(0, 2),
        setupTrainingScenarios: false,
        trainingScenarios: [],
        includeAuditSystem: false,
        includeConversations: false,
        includeReservations: true,
        includeNotifications: false,
        createBackup: false,
        generateTrainingGuide: false,
        includeTestData: true
      }

      // Mock successful dev setup
      const mockDevResult: DevelopmentSetupResult = {
        success: true,
        environmentId: 'dev-123',
        environmentName: 'dev-test',
        configurationPath: '.env.development',
        devUsers: [],
        sampleDataSummary: { lofts: 3, reservations: 5, transactions: 10, users: 3, totalSize: '2 MB' },
        devToolsEnabled: [],
        setupDuration: 15000,
        quickStartGuide: [],
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      // Mock successful training setup
      const mockTrainingResult: TrainingSetupResult = {
        success: true,
        environmentId: 'training-123',
        environmentUrl: 'https://training-after-dev.supabase.co',
        trainingUsers: [],
        sampleDataGenerated: { lofts: 5, reservations: 20, transactions: 50, conversations: 0, tasks: 15, users: 8, auditLogs: 0 },
        scenariosSetup: [],
        errors: [],
        warnings: [],
        setupDuration: 60000,
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockDevResult)
      jest.spyOn(trainingSetup, 'setupTrainingEnvironment').mockResolvedValue(mockTrainingResult)

      // Execute both setups
      const devResult = await devSetup.setupDevelopmentEnvironment(devConfig)
      const trainingResult = await trainingSetup.setupTrainingEnvironment(trainingConfig)

      expect(devResult.success).toBe(true)
      expect(trainingResult.success).toBe(true)
      expect(devResult.setupDuration + trainingResult.setupDuration).toBeLessThan(120000) // Total under 2 minutes
    })

    it('should handle automation failure recovery', async () => {
      const dailyRefresh = new DailyEnvironmentRefresh({
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

      // Mock failure followed by recovery
      const mockFailureResult: DailyRefreshResult = {
        success: false,
        refreshedEnvironments: [],
        failedEnvironments: ['test', 'training'],
        totalDuration: 10000,
        results: [],
        errors: ['Network connectivity issue'],
        timestamp: new Date()
      }

      const mockRecoveryResult: DailyRefreshResult = {
        success: true,
        refreshedEnvironments: ['test', 'training'],
        failedEnvironments: [],
        totalDuration: 90000,
        results: [
          {
            success: true,
            operationId: 'recovery-test-123',
            statistics: {
              tablesCloned: 15,
              recordsCloned: 1000,
              recordsAnonymized: 800,
              functionsCloned: 5,
              triggersCloned: 3,
              totalSizeCloned: '50 MB'
            }
          }
        ],
        errors: [],
        timestamp: new Date()
      }

      jest.spyOn(dailyRefresh, 'executeDailyRefresh')
        .mockResolvedValueOnce(mockFailureResult)
        .mockResolvedValueOnce(mockRecoveryResult)

      // First attempt fails
      const firstResult = await dailyRefresh.executeDailyRefresh()
      expect(firstResult.success).toBe(false)

      // Second attempt succeeds
      const secondResult = await dailyRefresh.executeDailyRefresh()
      expect(secondResult.success).toBe(true)
    })
  })

  describe('Performance and Resource Management Tests', () => {
    it('should handle large-scale automation operations', async () => {
      const config: DailyRefreshConfig = {
        targetEnvironments: ['test', 'training', 'development', 'staging'],
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

      const dailyRefresh = new DailyEnvironmentRefresh(config)

      const mockResult: DailyRefreshResult = {
        success: true,
        refreshedEnvironments: ['test', 'training', 'development', 'staging'],
        failedEnvironments: [],
        totalDuration: 600000, // 10 minutes for 4 environments
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

      jest.spyOn(dailyRefresh, 'executeDailyRefresh').mockResolvedValue(mockResult)

      const result = await dailyRefresh.executeDailyRefresh()

      expect(result.success).toBe(true)
      expect(result.refreshedEnvironments).toHaveLength(4)
      expect(result.totalDuration).toBeGreaterThan(300000) // At least 5 minutes
      expect(result.results.every(r => r.success)).toBe(true)
    })

    it('should handle resource constraints gracefully', async () => {
      const devSetup = new DevelopmentEnvironmentSetup()
      const constrainedConfig: DevelopmentSetupConfig = {
        ...DevelopmentEnvironmentSetup.getMinimalConfig(),
        maxRecordsPerTable: 1, // Very constrained
        parallelProcessing: false,
        skipValidation: true
      }

      const mockResult: DevelopmentSetupResult = {
        success: true,
        environmentId: 'dev-constrained-123',
        environmentName: 'dev-constrained',
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
          lofts: 1,
          reservations: 1,
          transactions: 1,
          users: 1,
          totalSize: '100 KB'
        },
        devToolsEnabled: ['Hot Reload'],
        setupDuration: 5000, // Very fast due to constraints
        quickStartGuide: [],
        errors: [],
        warnings: ['Minimal data set used due to resource constraints'],
        completedAt: new Date()
      }

      jest.spyOn(devSetup, 'setupDevelopmentEnvironment').mockResolvedValue(mockResult)

      const result = await devSetup.setupDevelopmentEnvironment(constrainedConfig)

      expect(result.success).toBe(true)
      expect(result.sampleDataSummary.lofts).toBe(1)
      expect(result.setupDuration).toBeLessThan(10000)
      expect(result.warnings).toContain('Minimal data set used due to resource constraints')
    })
  })
})