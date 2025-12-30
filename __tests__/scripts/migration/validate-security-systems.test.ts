/**
 * Tests for Security Systems Validation Script
 * Validates the security validation functionality for Task 3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SecuritySystemValidator } from '../../../scripts/migration/validate-security-systems'
import { promises as fs } from 'fs'

// Mock the migration components
vi.mock('../../../lib/migration/backup-manager')
vi.mock('../../../lib/migration/rollback-system')
vi.mock('../../../lib/migration/migration-controller')
vi.mock('../../../lib/migration/compatibility-checker')

describe('SecuritySystemValidator', () => {
  let validator: SecuritySystemValidator

  beforeEach(() => {
    validator = new SecuritySystemValidator()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Cleanup test artifacts
    try {
      await validator.cleanup()
    } catch {
      // Ignore cleanup errors in tests
    }
  })

  describe('Security Validation', () => {
    it('should validate all security systems successfully', async () => {
      // Mock successful responses from all systems
      const mockBackupManager = {
        createFullBackup: vi.fn().mockResolvedValue({
          id: 'test-backup-123',
          size: 1024 * 1024, // 1MB
          includedFiles: ['app/page.tsx', 'package.json'],
          checksum: 'abc123'
        }),
        validateBackup: vi.fn().mockResolvedValue({
          success: true,
          errors: [],
          warnings: [],
          details: {}
        }),
        createSnapshot: vi.fn().mockResolvedValue({
          id: 'test-snapshot-123',
          label: 'Security-Test-Snapshot',
          backupId: 'test-backup-123'
        }),
        createIncrementalBackup: vi.fn().mockResolvedValue({
          id: 'test-incremental-123',
          includedFiles: ['app/page.tsx']
        }),
        listSnapshots: vi.fn().mockResolvedValue([
          {
            id: 'test-snapshot-123',
            label: 'Security-Test-Snapshot',
            backupId: 'test-backup-123'
          }
        ])
      }

      const mockRollbackSystem = {
        validateRollbackCapability: vi.fn().mockResolvedValue({
          success: true,
          errors: [],
          warnings: [],
          details: {
            availableSnapshots: 1,
            configuredTriggers: 4
          }
        }),
        checkTriggers: vi.fn().mockResolvedValue('rollback'),
        getAvailableRollbackPoints: vi.fn().mockResolvedValue([
          {
            id: 'test-snapshot-123',
            label: 'Security-Test-Snapshot',
            timestamp: new Date(),
            description: 'Test snapshot'
          }
        ]),
        estimateRollbackTime: vi.fn().mockResolvedValue(30000), // 30 seconds
        getRollbackHistory: vi.fn().mockReturnValue([])
      }

      const mockMigrationController = {
        createCheckpoint: vi.fn().mockResolvedValue(undefined),
        getCheckpoints: vi.fn().mockReturnValue([
          {
            id: 'security-test-checkpoint',
            timestamp: new Date(),
            description: 'Security validation checkpoint'
          }
        ]),
        validateRollbackCapability: vi.fn().mockResolvedValue({
          success: true,
          errors: [],
          warnings: [],
          details: {}
        }),
        getStatus: vi.fn().mockReturnValue({
          phase: 'idle',
          currentStep: 'none',
          progress: 0,
          status: 'idle'
        }),
        pauseMigration: vi.fn(),
        resumeMigration: vi.fn(),
        getProgress: vi.fn().mockReturnValue({
          totalSteps: 0,
          completedSteps: 0,
          percentage: 0,
          currentStep: 'none',
          elapsedTime: 0,
          estimatedTimeRemaining: 0
        }),
        getAvailableRollbackPoints: vi.fn().mockResolvedValue([])
      }

      // Replace the validator's components with mocks
      ;(validator as any).backupManager = mockBackupManager
      ;(validator as any).rollbackSystem = mockRollbackSystem
      ;(validator as any).migrationController = mockMigrationController

      const report = await validator.validateSecuritySystems()

      expect(report).toBeDefined()
      expect(report.overallSuccess).toBe(true)
      expect(report.results).toHaveLength(5) // 5 validation components
      expect(report.criticalIssues).toHaveLength(0)
      expect(report.totalDuration).toBeGreaterThan(0)

      // Verify all components were tested
      const componentNames = report.results.map(r => r.component)
      expect(componentNames).toContain('Backup System')
      expect(componentNames).toContain('Rollback System')
      expect(componentNames).toContain('Migration Controller Security')
      expect(componentNames).toContain('System Integration')
      expect(componentNames).toContain('Performance Requirements')
    })

    it('should detect backup system failures', async () => {
      const mockBackupManager = {
        createFullBackup: vi.fn().mockRejectedValue(new Error('Backup creation failed')),
        validateBackup: vi.fn().mockResolvedValue({
          success: false,
          errors: ['Backup validation failed'],
          warnings: [],
          details: {}
        }),
        createSnapshot: vi.fn().mockRejectedValue(new Error('Snapshot creation failed')),
        createIncrementalBackup: vi.fn().mockRejectedValue(new Error('Incremental backup failed')),
        listSnapshots: vi.fn().mockResolvedValue([])
      }

      ;(validator as any).backupManager = mockBackupManager
      ;(validator as any).rollbackSystem = {
        validateRollbackCapability: vi.fn().mockResolvedValue({ success: true, errors: [], warnings: [], details: {} }),
        checkTriggers: vi.fn().mockResolvedValue(null),
        getAvailableRollbackPoints: vi.fn().mockResolvedValue([]),
        estimateRollbackTime: vi.fn().mockResolvedValue(30000),
        getRollbackHistory: vi.fn().mockReturnValue([])
      }
      ;(validator as any).migrationController = {
        createCheckpoint: vi.fn().mockResolvedValue(undefined),
        getCheckpoints: vi.fn().mockReturnValue([]),
        validateRollbackCapability: vi.fn().mockResolvedValue({ success: true, errors: [], warnings: [], details: {} }),
        getStatus: vi.fn().mockReturnValue({ phase: 'idle', currentStep: 'none', progress: 0, status: 'idle' }),
        pauseMigration: vi.fn(),
        resumeMigration: vi.fn(),
        getProgress: vi.fn().mockReturnValue({ totalSteps: 0, completedSteps: 0, percentage: 0, currentStep: 'none', elapsedTime: 0, estimatedTimeRemaining: 0 }),
        getAvailableRollbackPoints: vi.fn().mockResolvedValue([])
      }

      const report = await validator.validateSecuritySystems()

      expect(report.overallSuccess).toBe(false)
      expect(report.criticalIssues).toContain('Backup system validation failed')
      
      const backupResult = report.results.find(r => r.component === 'Backup System')
      expect(backupResult?.success).toBe(false)
      expect(backupResult?.errors.length).toBeGreaterThan(0)
    })

    it('should detect rollback system issues', async () => {
      const mockRollbackSystem = {
        validateRollbackCapability: vi.fn().mockResolvedValue({
          success: false,
          errors: ['No snapshots available'],
          warnings: [],
          details: { availableSnapshots: 0 }
        }),
        checkTriggers: vi.fn().mockResolvedValue(null),
        getAvailableRollbackPoints: vi.fn().mockResolvedValue([]),
        estimateRollbackTime: vi.fn().mockResolvedValue(600000), // 10 minutes (too long)
        getRollbackHistory: vi.fn().mockReturnValue([])
      }

      ;(validator as any).backupManager = {
        createFullBackup: vi.fn().mockResolvedValue({ id: 'test', size: 1024, includedFiles: [], checksum: 'abc' }),
        validateBackup: vi.fn().mockResolvedValue({ success: true, errors: [], warnings: [], details: {} }),
        createSnapshot: vi.fn().mockResolvedValue({ id: 'test', label: 'test', backupId: 'test' }),
        createIncrementalBackup: vi.fn().mockResolvedValue({ id: 'test', includedFiles: [] }),
        listSnapshots: vi.fn().mockResolvedValue([])
      }
      ;(validator as any).rollbackSystem = mockRollbackSystem
      ;(validator as any).migrationController = {
        createCheckpoint: vi.fn().mockResolvedValue(undefined),
        getCheckpoints: vi.fn().mockReturnValue([]),
        validateRollbackCapability: vi.fn().mockResolvedValue({ success: true, errors: [], warnings: [], details: {} }),
        getStatus: vi.fn().mockReturnValue({ phase: 'idle', currentStep: 'none', progress: 0, status: 'idle' }),
        pauseMigration: vi.fn(),
        resumeMigration: vi.fn(),
        getProgress: vi.fn().mockReturnValue({ totalSteps: 0, completedSteps: 0, percentage: 0, currentStep: 'none', elapsedTime: 0, estimatedTimeRemaining: 0 }),
        getAvailableRollbackPoints: vi.fn().mockResolvedValue([])
      }

      const report = await validator.validateSecuritySystems()

      expect(report.overallSuccess).toBe(false)
      expect(report.criticalIssues).toContain('Rollback system validation failed')
      
      const rollbackResult = report.results.find(r => r.component === 'Rollback System')
      expect(rollbackResult?.success).toBe(false)
      expect(rollbackResult?.errors.length).toBeGreaterThan(0)
    })

    it('should generate appropriate recommendations', async () => {
      const mockResults = [
        {
          component: 'Backup System',
          success: true,
          duration: 35000, // 35 seconds (slow)
          details: [],
          errors: [],
          warnings: ['Backup creation may be slow']
        },
        {
          component: 'Rollback System',
          success: true,
          duration: 5000,
          details: [],
          errors: [],
          warnings: []
        }
      ]

      const recommendations = (validator as any).generateRecommendations(mockResults)

      expect(recommendations).toContain('Backup System: Address 1 warning(s)')
      expect(recommendations).toContain('Backup System: Consider optimizing performance (35.0s)')
      expect(recommendations.some(r => r.includes('Create additional snapshots'))).toBe(true)
    })
  })

  describe('Performance Validation', () => {
    it('should validate backup creation performance', async () => {
      const mockBackupManager = {
        createFullBackup: vi.fn().mockImplementation(async () => {
          // Simulate slow backup creation
          await new Promise(resolve => setTimeout(resolve, 100))
          return {
            id: 'perf-test-backup',
            size: 1024 * 1024,
            includedFiles: ['app/page.tsx'],
            checksum: 'abc123'
          }
        }),
        validateBackup: vi.fn().mockResolvedValue({
          success: true,
          errors: [],
          warnings: [],
          details: {}
        })
      }

      ;(validator as any).backupManager = mockBackupManager
      ;(validator as any).rollbackSystem = {
        estimateRollbackTime: vi.fn().mockResolvedValue(30000),
        getRollbackHistory: vi.fn().mockReturnValue([])
      }
      ;(validator as any).migrationController = {
        getStatus: vi.fn().mockReturnValue({ status: 'idle' }),
        getProgress: vi.fn().mockReturnValue({ percentage: 0 }),
        getRollbackHistory: vi.fn().mockReturnValue([])
      }

      const result = await (validator as any).validatePerformanceRequirements()

      expect(result.component).toBe('Performance Requirements')
      expect(result.success).toBe(true)
      expect(result.details.some((d: string) => d.includes('Backup creation time:'))).toBe(true)
      expect(result.details.some((d: string) => d.includes('Backup validation time:'))).toBe(true)
    })

    it('should detect performance issues', async () => {
      const mockRollbackSystem = {
        estimateRollbackTime: vi.fn().mockResolvedValue(400000), // 6.67 minutes (too long)
        getRollbackHistory: vi.fn().mockReturnValue([])
      }

      ;(validator as any).backupManager = {
        createFullBackup: vi.fn().mockResolvedValue({ id: 'test', size: 1024, includedFiles: [], checksum: 'abc' }),
        validateBackup: vi.fn().mockResolvedValue({ success: true, errors: [], warnings: [], details: {} })
      }
      ;(validator as any).rollbackSystem = mockRollbackSystem
      ;(validator as any).migrationController = {
        getStatus: vi.fn().mockReturnValue({ status: 'idle' }),
        getProgress: vi.fn().mockReturnValue({ percentage: 0 }),
        getRollbackHistory: vi.fn().mockReturnValue([])
      }

      const result = await (validator as any).validatePerformanceRequirements()

      expect(result.warnings.some((w: string) => w.includes('Estimated rollback time exceeds'))).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should clean up test artifacts', async () => {
      // Mock fs.rmdir to verify it's called
      const mockRmdir = vi.spyOn(fs, 'rmdir').mockResolvedValue(undefined)

      await validator.cleanup()

      expect(mockRmdir).toHaveBeenCalledWith('.security-test-backups', { recursive: true })
    })

    it('should handle cleanup errors gracefully', async () => {
      // Mock fs.rmdir to throw an error
      vi.spyOn(fs, 'rmdir').mockRejectedValue(new Error('Permission denied'))

      // Should not throw
      await expect(validator.cleanup()).resolves.toBeUndefined()
    })
  })
})