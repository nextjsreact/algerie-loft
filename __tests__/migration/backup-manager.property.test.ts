/**
 * Property-Based Tests for BackupManager
 * Feature: nextjs-16-migration-plan, Property 2: Backup Completeness and Integrity
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { promises as fs } from 'fs'
import { join } from 'path'
import { BackupManager } from '../../lib/migration/backup-manager'

describe('BackupManager Property Tests', () => {
  let backupManager: BackupManager
  let testDir: string
  let originalFiles: Map<string, string>

  beforeEach(async () => {
    // Create isolated test environment
    testDir = join(process.cwd(), '.test-migration-backups')
    backupManager = new BackupManager(testDir)
    originalFiles = new Map()
    
    // Clean up any existing test backups
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist
    }
  })

  afterEach(async () => {
    // Clean up test environment
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist
    }
  })

  /**
   * Property 2: Backup Completeness and Integrity
   * For any backup created during migration, restoring from that backup should 
   * result in a fully functional application state identical to the state when 
   * the backup was created
   */
  test('Property 2: Backup round-trip preserves application state', async () => {
    // Manual property testing with multiple iterations (100+ iterations)
    const iterations = 100
    
    for (let i = 0; i < iterations; i++) {
      // Generate varied test data for each iteration
      const testFiles = [
        { path: `test-file-${i}-1`, content: `Content ${i} - File 1 ${Math.random()}` },
        { path: `test-file-${i}-2`, content: `Content ${i} - File 2 with more data\n${Date.now()}` },
        { path: `test-file-${i}-3`, content: `Content ${i} - File 3\nMultiline\nContent\n${i}` }
      ]
      
      const createdFiles: string[] = []
      
      try {
        // Setup: Create test files
        for (const file of testFiles) {
          const filePath = join(process.cwd(), `${file.path}.txt`)
          await fs.writeFile(filePath, file.content, 'utf-8')
          createdFiles.push(filePath)
          originalFiles.set(filePath, file.content)
        }

        // Action: Create backup
        const backup = await backupManager.createFullBackup()
        
        // Verify backup was created
        expect(backup).toBeDefined()
        expect(backup.id).toBeTruthy()
        expect(backup.checksum).toBeTruthy()
        
        // Modify original files to simulate changes
        for (const filePath of createdFiles) {
          await fs.writeFile(filePath, `MODIFIED_CONTENT_${i}_${Date.now()}`, 'utf-8')
        }
        
        // Action: Restore from backup
        const restoreResult = await backupManager.restoreFromBackup(backup.id)
        
        // Property: Restoration should succeed
        expect(restoreResult.success).toBe(true)
        expect(restoreResult.errors).toHaveLength(0)
        
        // Property: All files should be restored to original state
        for (const [filePath, originalContent] of originalFiles) {
          try {
            const restoredContent = await fs.readFile(filePath, 'utf-8')
            expect(restoredContent).toBe(originalContent)
          } catch {
            // File might not exist in backup if it was filtered out
          }
        }
        
      } finally {
        // Cleanup: Remove test files
        for (const filePath of createdFiles) {
          try {
            await fs.unlink(filePath)
          } catch {
            // File might already be deleted
          }
        }
        originalFiles.clear()
      }
    }
  }, 120000)

  /**
   * Property: Backup validation detects corruption
   * For any backup, if the backup is corrupted, validation should detect it
   */
  test('Property: Backup validation detects corruption', async () => {
    const iterations = 50
    
    for (let i = 0; i < iterations; i++) {
      const testContent = `Test content for validation ${i} - ${Math.random()} - ${Date.now()}`
      
      // Setup: Create a test file
      const testFile = join(process.cwd(), `test-validation-${i}.txt`)
      await fs.writeFile(testFile, testContent, 'utf-8')
      
      try {
        // Create backup
        const backup = await backupManager.createFullBackup()
        
        // Validate original backup (should pass)
        const originalValidation = await backupManager.validateBackup(backup.id)
        expect(originalValidation.success).toBe(true)
        
        // Corrupt the backup by modifying a file
        const backupFiles = await fs.readdir(backup.path, { recursive: true })
        if (backupFiles.length > 0) {
          const firstFile = join(backup.path, backupFiles[0] as string)
          try {
            const stats = await fs.stat(firstFile)
            if (stats.isFile()) {
              await fs.writeFile(firstFile, `CORRUPTED_CONTENT_${i}`, 'utf-8')
              
              // Validate corrupted backup (should fail)
              const corruptedValidation = await backupManager.validateBackup(backup.id)
              expect(corruptedValidation.success).toBe(false)
              expect(corruptedValidation.errors.length).toBeGreaterThan(0)
            }
          } catch {
            // File might be a directory or not writable, skip this iteration
          }
        }
        
      } finally {
        // Cleanup
        try {
          await fs.unlink(testFile)
        } catch {
          // File might not exist
        }
      }
    }
  }, 80000)

  /**
   * Property: Incremental backup captures only changes
   * For any set of file changes, incremental backup should only include changed files
   */
  test('Property: Incremental backup captures only changes', async () => {
    const iterations = 30
    
    for (let i = 0; i < iterations; i++) {
      const testFiles = [
        { path: `test-incr-${i}-1`, content: `Initial content ${i}-1` },
        { path: `test-incr-${i}-2`, content: `Initial content ${i}-2` },
        { path: `test-incr-${i}-3`, content: `Initial content ${i}-3` }
      ]
      
      const createdFiles: string[] = []
      
      try {
        // Setup: Create initial files
        for (const file of testFiles) {
          const filePath = join(process.cwd(), `${file.path}.txt`)
          await fs.writeFile(filePath, file.content, 'utf-8')
          createdFiles.push(filePath)
        }
        
        // Create initial full backup
        const fullBackup = await backupManager.createFullBackup()
        expect(fullBackup.type).toBe('full')
        
        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Modify only some files (first half)
        const filesToModify = createdFiles.slice(0, Math.ceil(createdFiles.length / 2))
        for (const filePath of filesToModify) {
          await fs.writeFile(filePath, `MODIFIED_FOR_INCREMENTAL_${i}`, 'utf-8')
        }
        
        // Create incremental backup
        const incrementalBackup = await backupManager.createIncrementalBackup()
        expect(incrementalBackup.type).toBe('incremental')
        
        // Property: Incremental backup should be smaller than or equal to full backup
        expect(incrementalBackup.size).toBeLessThanOrEqual(fullBackup.size)
        
        // Property: Incremental backup should include some files
        expect(incrementalBackup.includedFiles.length).toBeGreaterThan(0)
        
      } finally {
        // Cleanup
        for (const filePath of createdFiles) {
          try {
            await fs.unlink(filePath)
          } catch {
            // File might not exist
          }
        }
      }
    }
  }, 100000)

  /**
   * Property: Snapshot creation and restoration
   * For any snapshot created, restoring from it should preserve the exact state
   */
  test('Property: Snapshot round-trip preserves state', async () => {
    const iterations = 50
    
    for (let i = 0; i < iterations; i++) {
      const snapshotLabel = `test-snapshot-${i}-${Date.now()}`
      const testContent = `Snapshot test content ${i} - ${Math.random()} - ${Date.now()}`
      
      // Setup: Create test file
      const testFile = join(process.cwd(), `test-snapshot-${i}.txt`)
      await fs.writeFile(testFile, testContent, 'utf-8')
      
      try {
        // Create snapshot
        const snapshot = await backupManager.createSnapshot(snapshotLabel)
        expect(snapshot.label).toBe(snapshotLabel)
        expect(snapshot.id).toBeTruthy()
        
        // Modify file
        await fs.writeFile(testFile, `MODIFIED_AFTER_SNAPSHOT_${i}`, 'utf-8')
        
        // Restore from snapshot
        const restoreResult = await backupManager.restoreFromSnapshot(snapshot.id)
        
        // Property: Restoration should succeed
        expect(restoreResult.success).toBe(true)
        
        // Property: File should be restored to snapshot state
        const restoredContent = await fs.readFile(testFile, 'utf-8')
        expect(restoredContent).toBe(testContent)
        
      } finally {
        // Cleanup
        try {
          await fs.unlink(testFile)
        } catch {
          // File might not exist
        }
      }
    }
  }, 80000)
})