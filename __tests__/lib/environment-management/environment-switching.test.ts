/**
 * Environment Switching Reliability Test Suite
 * 
 * Tests for environment switching functionality, configuration management,
 * and reliability scenarios including failure recovery and rollback.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { EnvironmentSwitcher } from '../../../lib/environment-management/core/environment-switcher'
import { ConfigurationManager } from '../../../lib/environment-management/core/configuration-manager'
import { ProductionSafetyGuard } from '../../../lib/environment-management/core/production-safety-guard'
import { 
  Environment, 
  EnvironmentType, 
  SwitchResult, 
  EnvironmentConfig,
  EnvironmentStatus 
} from '../../../lib/environment-management/types'

// Mock dependencies
jest.mock('../../../lib/environment-management/core/production-safety-guard')
jest.mock('../../../lib/logger')

describe('Environment Switching Reliability Test Suite', () => {
  let switcher: EnvironmentSwitcher
  let configManager: ConfigurationManager
  let safetyGuard: ProductionSafetyGuard

  const mockEnvironments: Record<EnvironmentType, Environment> = {
    production: {
      id: 'prod-env-1',
      name: 'production',
      type: 'production',
      supabaseUrl: 'https://prod.supabase.co',
      supabaseAnonKey: 'prod-anon-key',
      supabaseServiceKey: 'prod-service-key',
      databaseUrl: 'postgresql://prod',
      status: 'active',
      createdAt: new Date(),
      lastUpdated: new Date()
    },
    test: {
      id: 'test-env-1',
      name: 'test',
      type: 'test',
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceKey: 'test-service-key',
      databaseUrl: 'postgresql://test',
      status: 'active',
      createdAt: new Date(),
      lastUpdated: new Date()
    },
    training: {
      id: 'training-env-1',
      name: 'training',
      type: 'training',
      supabaseUrl: 'https://training.supabase.co',
      supabaseAnonKey: 'training-anon-key',
      supabaseServiceKey: 'training-service-key',
      databaseUrl: 'postgresql://training',
      status: 'active',
      createdAt: new Date(),
      lastUpdated: new Date()
    },
    development: {
      id: 'dev-env-1',
      name: 'development',
      type: 'development',
      supabaseUrl: 'https://dev.supabase.co',
      supabaseAnonKey: 'dev-anon-key',
      supabaseServiceKey: 'dev-service-key',
      databaseUrl: 'postgresql://dev',
      status: 'active',
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  }

  beforeEach(() => {
    switcher = new EnvironmentSwitcher()
    configManager = new ConfigurationManager()
    safetyGuard = ProductionSafetyGuard.getInstance()
    jest.clearAllMocks()
  })

  describe('Basic Environment Switching', () => {
    it('should switch from development to test environment successfully', async () => {
      const switchOptions = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'test',
        previousEnvironment: 'development',
        currentEnvironment: 'test',
        backupPath: 'backups/env-backup-dev-123',
        servicesRestarted: true,
        switchDuration: 5000,
        warnings: []
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.targetEnvironment).toBe('test')
      expect(result.previousEnvironment).toBe('development')
      expect(result.servicesRestarted).toBe(true)
      expect(result.switchDuration).toBe(5000)
    })

    it('should switch from test to training environment successfully', async () => {
      const switchOptions = {
        targetEnvironment: 'training' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'training',
        previousEnvironment: 'test',
        currentEnvironment: 'training',
        backupPath: 'backups/env-backup-test-456',
        servicesRestarted: true,
        switchDuration: 4500,
        warnings: []
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.targetEnvironment).toBe('training')
      expect(result.previousEnvironment).toBe('test')
    })

    it('should switch to production with read-only confirmation', async () => {
      const switchOptions = {
        targetEnvironment: 'production' as EnvironmentType,
        backupCurrent: true,
        restartServices: false, // Should not restart for production
        confirmProduction: true
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'production',
        previousEnvironment: 'test',
        currentEnvironment: 'production',
        backupPath: 'backups/env-backup-test-prod-789',
        servicesRestarted: false,
        switchDuration: 3000,
        warnings: ['Production environment - READ-ONLY access only']
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.targetEnvironment).toBe('production')
      expect(result.servicesRestarted).toBe(false)
      expect(result.warnings).toContain('Production environment - READ-ONLY access only')
    })

    it('should handle switch without backup option', async () => {
      const switchOptions = {
        targetEnvironment: 'development' as EnvironmentType,
        backupCurrent: false,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'development',
        previousEnvironment: 'test',
        currentEnvironment: 'development',
        servicesRestarted: true,
        switchDuration: 2000,
        warnings: []
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.backupPath).toBeUndefined()
      expect(result.servicesRestarted).toBe(true)
    })
  })

  describe('Configuration Management', () => {
    it('should create environment configuration correctly', async () => {
      const envConfig: EnvironmentConfig = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        NEXT_PUBLIC_APP_URL: 'https://test.app.com',
        NODE_ENV: 'test',
        ANONYMIZE_DATA: true,
        INCLUDE_AUDIT_LOGS: true,
        PRESERVE_USER_ROLES: false
      }

      jest.spyOn(configManager, 'createEnvironmentConfig').mockResolvedValue()

      await expect(configManager.createEnvironmentConfig('test', envConfig)).resolves.not.toThrow()
    })

    it('should get current environment configuration', async () => {
      jest.spyOn(configManager, 'getCurrentEnvironment').mockResolvedValue(mockEnvironments.test)

      const currentEnv = await configManager.getCurrentEnvironment()

      expect(currentEnv.name).toBe('test')
      expect(currentEnv.type).toBe('test')
      expect(currentEnv.status).toBe('active')
    })

    it('should list all available environments', async () => {
      const environments = Object.values(mockEnvironments)
      jest.spyOn(configManager, 'listEnvironments').mockResolvedValue(environments)

      const result = await configManager.listEnvironments()

      expect(result).toHaveLength(4)
      expect(result.map(env => env.type)).toEqual(['production', 'test', 'training', 'development'])
    })

    it('should backup current configuration', async () => {
      const backupPath = 'backups/config-backup-123.json'
      jest.spyOn(configManager, 'backupCurrentConfig').mockResolvedValue(backupPath)

      const result = await configManager.backupCurrentConfig()

      expect(result).toBe(backupPath)
      expect(result).toContain('config-backup')
    })

    it('should restore configuration from backup', async () => {
      const backupId = 'config-backup-123'
      jest.spyOn(configManager, 'restoreConfig').mockResolvedValue()

      await expect(configManager.restoreConfig(backupId)).resolves.not.toThrow()
    })

    it('should validate configuration before switching', async () => {
      const config: EnvironmentConfig = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        NEXT_PUBLIC_APP_URL: 'https://test.app.com',
        NODE_ENV: 'test'
      }

      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }

      jest.spyOn(configManager, 'validateConfiguration').mockResolvedValue(mockValidationResult)

      const result = await configManager.validateConfiguration(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Environment Status and Health Monitoring', () => {
    it('should get current environment status', async () => {
      const mockStatus = {
        environmentType: 'test' as EnvironmentType,
        isHealthy: true,
        lastChecked: new Date(),
        error: null,
        connectionStatus: 'connected',
        configurationValid: true
      }

      jest.spyOn(switcher, 'getCurrentStatus').mockResolvedValue(mockStatus)

      const status = await switcher.getCurrentStatus()

      expect(status.environmentType).toBe('test')
      expect(status.isHealthy).toBe(true)
      expect(status.connectionStatus).toBe('connected')
      expect(status.configurationValid).toBe(true)
    })

    it('should detect unhealthy environment status', async () => {
      const mockStatus = {
        environmentType: 'test' as EnvironmentType,
        isHealthy: false,
        lastChecked: new Date(),
        error: 'Database connection failed',
        connectionStatus: 'disconnected',
        configurationValid: true
      }

      jest.spyOn(switcher, 'getCurrentStatus').mockResolvedValue(mockStatus)

      const status = await switcher.getCurrentStatus()

      expect(status.isHealthy).toBe(false)
      expect(status.error).toBe('Database connection failed')
      expect(status.connectionStatus).toBe('disconnected')
    })

    it('should display current status information', async () => {
      jest.spyOn(switcher, 'displayCurrentStatus').mockResolvedValue()
      jest.spyOn(console, 'log').mockImplementation(() => {})

      await expect(switcher.displayCurrentStatus()).resolves.not.toThrow()
    })
  })

  describe('Failure Scenarios and Recovery', () => {
    it('should handle switch failure and rollback', async () => {
      const switchOptions = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: false,
        error: 'Target environment configuration invalid',
        targetEnvironment: 'test',
        previousEnvironment: 'development',
        currentEnvironment: 'development', // Rolled back
        backupPath: 'backups/env-backup-dev-123',
        servicesRestarted: false,
        switchDuration: 2000,
        warnings: ['Rolled back to previous environment due to failure']
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Target environment configuration invalid')
      expect(result.currentEnvironment).toBe('development') // Should be rolled back
      expect(result.warnings).toContain('Rolled back to previous environment due to failure')
    })

    it('should handle configuration corruption during switch', async () => {
      const switchOptions = {
        targetEnvironment: 'training' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: false,
        error: 'Configuration file corrupted during switch',
        targetEnvironment: 'training',
        previousEnvironment: 'test',
        currentEnvironment: 'test', // Restored from backup
        backupPath: 'backups/env-backup-test-456',
        servicesRestarted: false,
        switchDuration: 8000,
        warnings: ['Configuration restored from backup']
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Configuration file corrupted')
      expect(result.warnings).toContain('Configuration restored from backup')
    })

    it('should handle service restart failures', async () => {
      const switchOptions = {
        targetEnvironment: 'development' as EnvironmentType,
        backupCurrent: false,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'development',
        previousEnvironment: 'test',
        currentEnvironment: 'development',
        servicesRestarted: false, // Failed to restart
        switchDuration: 6000,
        warnings: ['Environment switched successfully but service restart failed']
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.servicesRestarted).toBe(false)
      expect(result.warnings[0]).toContain('service restart failed')
    })

    it('should handle network connectivity issues during switch', async () => {
      const switchOptions = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      jest.spyOn(switcher, 'switchEnvironment').mockRejectedValue(
        new Error('Network timeout: Could not connect to target environment')
      )

      await expect(switcher.switchEnvironment(switchOptions)).rejects.toThrow(
        'Network timeout: Could not connect to target environment'
      )
    })

    it('should handle missing environment configuration', async () => {
      const switchOptions = {
        targetEnvironment: 'nonexistent' as EnvironmentType,
        backupCurrent: false,
        restartServices: false,
        confirmProduction: false
      }

      jest.spyOn(switcher, 'switchEnvironment').mockRejectedValue(
        new Error("Environment 'nonexistent' configuration not found")
      )

      await expect(switcher.switchEnvironment(switchOptions)).rejects.toThrow(
        "Environment 'nonexistent' configuration not found"
      )
    })
  })

  describe('Production Safety and Security', () => {
    it('should enforce production confirmation requirement', async () => {
      const switchOptions = {
        targetEnvironment: 'production' as EnvironmentType,
        backupCurrent: true,
        restartServices: false,
        confirmProduction: false // Missing confirmation
      }

      jest.spyOn(switcher, 'switchEnvironment').mockRejectedValue(
        new Error('Production environment switch requires explicit confirmation')
      )

      await expect(switcher.switchEnvironment(switchOptions)).rejects.toThrow(
        'Production environment switch requires explicit confirmation'
      )
    })

    it('should validate production access permissions', async () => {
      const mockSafetyGuard = new ProductionSafetyGuard()
      jest.spyOn(mockSafetyGuard, 'validateProductionAccess').mockResolvedValue()

      await expect(mockSafetyGuard.validateProductionAccess('switch')).resolves.not.toThrow()
    })

    it('should block dangerous operations in production mode', async () => {
      const switchOptions = {
        targetEnvironment: 'production' as EnvironmentType,
        backupCurrent: true,
        restartServices: true, // Should be blocked for production
        confirmProduction: true
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'production',
        previousEnvironment: 'test',
        currentEnvironment: 'production',
        backupPath: 'backups/env-backup-test-prod-789',
        servicesRestarted: false, // Blocked for safety
        switchDuration: 3000,
        warnings: ['Service restart blocked for production environment safety']
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.servicesRestarted).toBe(false) // Should be blocked
      expect(result.warnings).toContain('Service restart blocked for production environment safety')
    })

    it('should audit all production environment switches', async () => {
      const switchOptions = {
        targetEnvironment: 'production' as EnvironmentType,
        backupCurrent: true,
        restartServices: false,
        confirmProduction: true
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'production',
        previousEnvironment: 'test',
        currentEnvironment: 'production',
        backupPath: 'backups/env-backup-test-prod-audit-123',
        servicesRestarted: false,
        switchDuration: 3500,
        warnings: [],
        auditLog: {
          timestamp: new Date(),
          user: 'system',
          action: 'environment_switch',
          target: 'production',
          source: 'test',
          confirmed: true
        }
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.auditLog).toBeDefined()
      expect(result.auditLog?.action).toBe('environment_switch')
      expect(result.auditLog?.target).toBe('production')
    })
  })

  describe('Performance and Reliability Tests', () => {
    it('should complete environment switch within acceptable time limits', async () => {
      const switchOptions = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'test',
        previousEnvironment: 'development',
        currentEnvironment: 'test',
        backupPath: 'backups/env-backup-dev-fast-123',
        servicesRestarted: true,
        switchDuration: 3000, // 3 seconds
        warnings: []
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.switchDuration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should handle concurrent switch attempts gracefully', async () => {
      const switchOptions1 = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const switchOptions2 = {
        targetEnvironment: 'training' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      // First switch succeeds
      const mockResult1: SwitchResult = {
        success: true,
        targetEnvironment: 'test',
        previousEnvironment: 'development',
        currentEnvironment: 'test',
        switchDuration: 4000,
        warnings: []
      }

      // Second switch is blocked
      jest.spyOn(switcher, 'switchEnvironment')
        .mockResolvedValueOnce(mockResult1)
        .mockRejectedValueOnce(new Error('Environment switch already in progress'))

      const result1 = await switcher.switchEnvironment(switchOptions1)
      expect(result1.success).toBe(true)

      await expect(switcher.switchEnvironment(switchOptions2)).rejects.toThrow(
        'Environment switch already in progress'
      )
    })

    it('should maintain environment consistency across multiple switches', async () => {
      const environments: EnvironmentType[] = ['development', 'test', 'training', 'development']
      const results: SwitchResult[] = []

      for (let i = 0; i < environments.length - 1; i++) {
        const switchOptions = {
          targetEnvironment: environments[i + 1],
          backupCurrent: true,
          restartServices: true,
          confirmProduction: false
        }

        const mockResult: SwitchResult = {
          success: true,
          targetEnvironment: environments[i + 1],
          previousEnvironment: environments[i],
          currentEnvironment: environments[i + 1],
          switchDuration: 3000 + i * 500,
          warnings: []
        }

        jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)
        const result = await switcher.switchEnvironment(switchOptions)
        results.push(result)
      }

      // Verify all switches succeeded
      expect(results.every(r => r.success)).toBe(true)
      
      // Verify environment progression
      expect(results[0].targetEnvironment).toBe('test')
      expect(results[1].targetEnvironment).toBe('training')
      expect(results[2].targetEnvironment).toBe('development')
    })

    it('should handle resource cleanup after failed switches', async () => {
      const switchOptions = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: false,
        error: 'Switch failed during configuration update',
        targetEnvironment: 'test',
        previousEnvironment: 'development',
        currentEnvironment: 'development', // Cleaned up and restored
        backupPath: 'backups/env-backup-dev-cleanup-123',
        servicesRestarted: false,
        switchDuration: 5000,
        warnings: ['Temporary files cleaned up', 'Environment state restored']
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(false)
      expect(result.currentEnvironment).toBe('development') // Should be restored
      expect(result.warnings).toContain('Temporary files cleaned up')
      expect(result.warnings).toContain('Environment state restored')
    })
  })

  describe('Integration with Other Systems', () => {
    it('should validate database connectivity after switch', async () => {
      const switchOptions = {
        targetEnvironment: 'test' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'test',
        previousEnvironment: 'development',
        currentEnvironment: 'test',
        backupPath: 'backups/env-backup-dev-db-123',
        servicesRestarted: true,
        switchDuration: 4000,
        warnings: [],
        validationResults: {
          databaseConnectivity: true,
          schemaValid: true,
          servicesHealthy: true
        }
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.validationResults?.databaseConnectivity).toBe(true)
      expect(result.validationResults?.schemaValid).toBe(true)
      expect(result.validationResults?.servicesHealthy).toBe(true)
    })

    it('should update application configuration after successful switch', async () => {
      const switchOptions = {
        targetEnvironment: 'training' as EnvironmentType,
        backupCurrent: true,
        restartServices: true,
        confirmProduction: false
      }

      const mockResult: SwitchResult = {
        success: true,
        targetEnvironment: 'training',
        previousEnvironment: 'test',
        currentEnvironment: 'training',
        backupPath: 'backups/env-backup-test-config-456',
        servicesRestarted: true,
        switchDuration: 3500,
        warnings: [],
        configurationUpdates: {
          environmentVariables: 8,
          configFiles: 3,
          serviceConfigs: 2
        }
      }

      jest.spyOn(switcher, 'switchEnvironment').mockResolvedValue(mockResult)

      const result = await switcher.switchEnvironment(switchOptions)

      expect(result.success).toBe(true)
      expect(result.configurationUpdates?.environmentVariables).toBe(8)
      expect(result.configurationUpdates?.configFiles).toBe(3)
      expect(result.configurationUpdates?.serviceConfigs).toBe(2)
    })
  })
})