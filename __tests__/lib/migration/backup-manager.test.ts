/**
 * Tests for BackupManager - Next.js 16 Migration System
 * Validates backup creation, integrity validation, and restoration functionality
 */

import { BackupManager } from '@/lib/migration/backup-manager'
import { promises as fs } from 'fs'
import { join } from 'path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import type { BackupInfo, SnapshotInfo, ValidationResult, RestoreResult } from '@/lib/migration/types'

// Mock file system operations for testing
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn()
  }
}))

vi.mock('glob', () => ({
  glob: vi.fn()
}))

describe('BackupManager', () => {
  let backupManager: BackupManager
  const testBackupDir = '.test-migration-backups'

  beforeEach(() => {
    backupManager = new BackupManager(testBackupDir)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up test files if they exist
    try {
      await fs.rmdir(testBackupDir, { recursive: true })
    } catch {
      // Directory might not exist
    }
  })

  describe('Full Backup Creation', () => {
    it('should create a complete backup with all required files', async () => {
      // Mock glob to return test files
      const mockFiles = [
        'app/page.tsx',
        'components/ui/button.tsx',
        'lib/utils.ts',
        'package.json',
        'next.config.mjs',
        'tailwind.config.ts'
      ]
      
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(mockFiles)
      
      // Mock file system operations
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.copyFile).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024,
        mtime: new Date()
      } as any)

      const backup = await backupManager.createFullBackup()

      expect(backup).toBeDefined()
      expect(backup.type).toBe('full')
      expect(backup.id).toMatch(/^full-\d+$/)
      expect(backup.includedFiles).toEqual(mockFiles)
      expect(backup.environmentVariables).toBe(true)
      expect(backup.checksum).toBeDefined()
      expect(backup.size).toBeGreaterThan(0)
    })

    it('should handle file copy errors gracefully', async () => {
      const mockFiles = ['app/page.tsx', 'components/ui/button.tsx']
      
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(mockFiles)
      
      // Mock mkdir to succeed
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      
      // Mock first file copy to fail, second to succeed
      vi.mocked(fs.copyFile)
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(undefined)

      const backup = await backupManager.createFullBackup()

      expect(backup).toBeDefined()
      expect(backup.includedFiles).toEqual(['components/ui/button.tsx'])
      // Should only include successfully copied files
    })
  })

  describe('Incremental Backup Creation', () => {
    it('should create incremental backup with only changed files', async () => {
      const mockFiles = ['app/page.tsx', 'components/ui/button.tsx']
      const lastBackupTime = new Date(Date.now() - 3600000) // 1 hour ago
      
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(mockFiles)
      
      // Mock file stats - first file modified recently, second file old
      vi.mocked(fs.stat)
        .mockResolvedValueOnce({
          size: 1024,
          mtime: new Date() // Recent modification
        } as any)
        .mockResolvedValueOnce({
          size: 512,
          mtime: new Date(Date.now() - 7200000) // 2 hours ago (older than last backup)
        } as any)

      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.copyFile).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue('[]') // Empty backups list

      const backup = await backupManager.createIncrementalBackup()

      expect(backup).toBeDefined()
      expect(backup.type).toBe('incremental')
      expect(backup.includedFiles).toEqual(['app/page.tsx']) // Only the recently modified file
    })
  })

  describe('Backup Validation', () => {
    it('should validate backup integrity successfully', async () => {
      const mockBackupInfo: BackupInfo = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full',
        size: 2048,
        checksum: 'abc123def456',
        includedFiles: ['app/page.tsx', 'package.json'],
        databaseSchema: false,
        environmentVariables: true,
        path: join(testBackupDir, 'test-backup-123')
      }

      // Mock backup metadata file
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([mockBackupInfo]))
      
      // Mock backup directory exists
      vi.mocked(fs.access).mockResolvedValue(undefined)
      
      // Mock files exist in backup
      vi.mocked(fs.access).mockResolvedValue(undefined)

      // Mock checksum calculation (simplified)
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(['app/page.tsx', 'package.json'])
      vi.mocked(fs.readFile).mockResolvedValue('mock file content')

      const result = await backupManager.validateBackup('test-backup-123')

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect corrupted backup with checksum mismatch', async () => {
      const mockBackupInfo: BackupInfo = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full',
        size: 2048,
        checksum: 'original-checksum',
        includedFiles: ['app/page.tsx'],
        databaseSchema: false,
        environmentVariables: true,
        path: join(testBackupDir, 'test-backup-123')
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([mockBackupInfo]))
      vi.mocked(fs.access).mockResolvedValue(undefined)

      // Mock different checksum (corruption detected)
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(['app/page.tsx'])
      vi.mocked(fs.readFile).mockResolvedValue('different content')

      const result = await backupManager.validateBackup('test-backup-123')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Backup checksum mismatch - backup may be corrupted')
    })

    it('should detect missing backup files', async () => {
      const mockBackupInfo: BackupInfo = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full',
        size: 2048,
        checksum: 'abc123def456',
        includedFiles: ['app/page.tsx', 'missing-file.tsx'],
        databaseSchema: false,
        environmentVariables: true,
        path: join(testBackupDir, 'test-backup-123')
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([mockBackupInfo]))
      
      // Mock backup directory exists
      vi.mocked(fs.access)
        .mockResolvedValueOnce(undefined) // Directory exists
        .mockResolvedValueOnce(undefined) // First file exists
        .mockRejectedValueOnce(new Error('File not found')) // Second file missing

      const result = await backupManager.validateBackup('test-backup-123')

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('Missing files in backup: missing-file.tsx')
    })
  })

  describe('Snapshot Management', () => {
    it('should create named snapshot successfully', async () => {
      const mockFiles = ['app/page.tsx', 'package.json']
      
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(mockFiles)
      
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.copyFile).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue('[]') // Empty snapshots list

      const snapshot = await backupManager.createSnapshot('Pre-migration state')

      expect(snapshot).toBeDefined()
      expect(snapshot.label).toBe('Pre-migration state')
      expect(snapshot.id).toMatch(/^snapshot-\d+$/)
      expect(snapshot.backupId).toMatch(/^full-\d+$/)
      expect(snapshot.description).toBe('Snapshot created: Pre-migration state')
    })

    it('should list all snapshots', async () => {
      const mockSnapshots: SnapshotInfo[] = [
        {
          id: 'snapshot-1',
          label: 'Before migration',
          timestamp: new Date(),
          backupId: 'full-123',
          description: 'Snapshot created: Before migration'
        },
        {
          id: 'snapshot-2',
          label: 'After dependency upgrade',
          timestamp: new Date(),
          backupId: 'full-456',
          description: 'Snapshot created: After dependency upgrade'
        }
      ]

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSnapshots))

      const snapshots = await backupManager.listSnapshots()

      expect(snapshots).toHaveLength(2)
      expect(snapshots[0].label).toBe('Before migration')
      expect(snapshots[1].label).toBe('After dependency upgrade')
    })
  })

  describe('Backup Restoration', () => {
    it('should restore from backup successfully', async () => {
      const mockBackupInfo: BackupInfo = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full',
        size: 2048,
        checksum: 'abc123def456',
        includedFiles: ['app/page.tsx', 'package.json'],
        databaseSchema: false,
        environmentVariables: true,
        path: join(testBackupDir, 'test-backup-123')
      }

      // Mock backup exists and is valid
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([mockBackupInfo]))
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.copyFile).mockResolvedValue(undefined)

      // Mock checksum validation
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(['app/page.tsx', 'package.json'])

      const result = await backupManager.restoreFromBackup('test-backup-123')

      expect(result.success).toBe(true)
      expect(result.restoredFiles).toEqual(['app/page.tsx', 'package.json'])
      expect(result.errors).toHaveLength(0)
      expect(result.duration).toBeGreaterThan(0)
    })

    it('should handle restoration errors gracefully', async () => {
      const mockBackupInfo: BackupInfo = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full',
        size: 2048,
        checksum: 'abc123def456',
        includedFiles: ['app/page.tsx', 'package.json'],
        databaseSchema: false,
        environmentVariables: true,
        path: join(testBackupDir, 'test-backup-123')
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([mockBackupInfo]))
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      
      // Mock first file copy to fail, second to succeed
      vi.mocked(fs.copyFile)
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(undefined)

      // Mock checksum validation
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(['app/page.tsx', 'package.json'])

      const result = await backupManager.restoreFromBackup('test-backup-123')

      expect(result.success).toBe(false)
      expect(result.restoredFiles).toEqual(['package.json'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failed to restore app/page.tsx')
    })

    it('should restore from snapshot successfully', async () => {
      const mockSnapshot: SnapshotInfo = {
        id: 'snapshot-123',
        label: 'Test snapshot',
        timestamp: new Date(),
        backupId: 'full-456',
        description: 'Test snapshot'
      }

      const mockBackupInfo: BackupInfo = {
        id: 'full-456',
        timestamp: new Date(),
        type: 'full',
        size: 2048,
        checksum: 'abc123def456',
        includedFiles: ['app/page.tsx'],
        databaseSchema: false,
        environmentVariables: true,
        path: join(testBackupDir, 'full-456')
      }

      // Mock snapshots and backup metadata
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify([mockSnapshot])) // snapshots.json
        .mockResolvedValueOnce(JSON.stringify([mockBackupInfo])) // backups.json

      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.copyFile).mockResolvedValue(undefined)

      // Mock checksum validation
      const { glob } = await import('glob')
      vi.mocked(glob).mockResolvedValue(['app/page.tsx'])

      const result = await backupManager.restoreFromSnapshot('snapshot-123')

      expect(result.success).toBe(true)
      expect(result.restoredFiles).toEqual(['app/page.tsx'])
    })
  })

  describe('Error Handling', () => {
    it('should handle backup not found error', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('[]') // Empty backups list

      const result = await backupManager.validateBackup('non-existent-backup')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Backup non-existent-backup not found')
    })

    it('should handle snapshot not found error', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('[]') // Empty snapshots list

      const result = await backupManager.restoreFromSnapshot('non-existent-snapshot')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Snapshot non-existent-snapshot not found')
    })

    it('should handle file system errors during backup creation', async () => {
      const { glob } = await import('glob')
      vi.mocked(glob).mockRejectedValue(new Error('File system error'))

      const backup = await backupManager.createFullBackup()

      expect(backup).toBeDefined()
      expect(backup.includedFiles).toHaveLength(0) // No files backed up due to error
    })
  })
})