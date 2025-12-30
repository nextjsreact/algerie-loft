/**
 * Backup Manager for Next.js 16 Migration
 * Handles creation, validation, and restoration of application backups
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { createHash } from 'crypto'
import { glob } from 'glob'
import type { 
  BackupInfo, 
  SnapshotInfo, 
  ValidationResult, 
  RestoreResult 
} from './types'

export class BackupManager {
  private backupDir: string
  private snapshotsFile: string

  constructor(backupDir = '.migration-backups') {
    this.backupDir = backupDir
    this.snapshotsFile = join(backupDir, 'snapshots.json')
  }

  /**
   * Create a full backup of the application
   */
  async createFullBackup(): Promise<BackupInfo> {
    const timestamp = new Date()
    const backupId = `full-${timestamp.getTime()}`
    const backupPath = join(this.backupDir, backupId)

    await this.ensureBackupDir()

    // Files to include in backup
    const filesToBackup = await this.getFilesToBackup()
    
    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true })

    // Copy files
    const copiedFiles: string[] = []
    for (const file of filesToBackup) {
      try {
        const targetPath = join(backupPath, file)
        await fs.mkdir(dirname(targetPath), { recursive: true })
        await fs.copyFile(file, targetPath)
        copiedFiles.push(file)
      } catch (error) {
        console.warn(`Failed to backup file ${file}:`, error)
      }
    }

    // Backup environment variables
    await this.backupEnvironmentVariables(backupPath)

    // Calculate checksum
    const checksum = await this.calculateBackupChecksum(backupPath)

    // Get backup size
    const size = await this.getDirectorySize(backupPath)

    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp,
      type: 'full',
      size,
      checksum,
      includedFiles: copiedFiles,
      databaseSchema: false, // Database backup would be handled separately
      environmentVariables: true,
      path: backupPath
    }

    // Save backup metadata
    await this.saveBackupMetadata(backupInfo)

    return backupInfo
  }

  /**
   * Create an incremental backup (only changed files since last backup)
   */
  async createIncrementalBackup(): Promise<BackupInfo> {
    const timestamp = new Date()
    const backupId = `incremental-${timestamp.getTime()}`
    const backupPath = join(this.backupDir, backupId)

    await this.ensureBackupDir()

    // Get last backup timestamp
    const lastBackup = await this.getLastBackup()
    const lastBackupTime = lastBackup?.timestamp || new Date(0)

    // Find changed files
    const changedFiles = await this.getChangedFilesSince(lastBackupTime)

    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true })

    // Copy changed files
    const copiedFiles: string[] = []
    for (const file of changedFiles) {
      try {
        const targetPath = join(backupPath, file)
        await fs.mkdir(dirname(targetPath), { recursive: true })
        await fs.copyFile(file, targetPath)
        copiedFiles.push(file)
      } catch (error) {
        console.warn(`Failed to backup file ${file}:`, error)
      }
    }

    // Backup environment variables if changed
    await this.backupEnvironmentVariables(backupPath)

    // Calculate checksum
    const checksum = await this.calculateBackupChecksum(backupPath)

    // Get backup size
    const size = await this.getDirectorySize(backupPath)

    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp,
      type: 'incremental',
      size,
      checksum,
      includedFiles: copiedFiles,
      databaseSchema: false,
      environmentVariables: true,
      path: backupPath
    }

    // Save backup metadata
    await this.saveBackupMetadata(backupInfo)

    return backupInfo
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupId: string): Promise<ValidationResult> {
    try {
      const backupInfo = await this.getBackupInfo(backupId)
      if (!backupInfo) {
        return {
          success: false,
          errors: [`Backup ${backupId} not found`],
          warnings: [],
          details: {}
        }
      }

      // Check if backup directory exists
      const backupExists = await fs.access(backupInfo.path).then(() => true).catch(() => false)
      if (!backupExists) {
        return {
          success: false,
          errors: [`Backup directory ${backupInfo.path} does not exist`],
          warnings: [],
          details: {}
        }
      }

      // Verify checksum
      const currentChecksum = await this.calculateBackupChecksum(backupInfo.path)
      if (currentChecksum !== backupInfo.checksum) {
        return {
          success: false,
          errors: ['Backup checksum mismatch - backup may be corrupted'],
          warnings: [],
          details: {
            expectedChecksum: backupInfo.checksum,
            actualChecksum: currentChecksum
          }
        }
      }

      // Verify all files exist
      const missingFiles: string[] = []
      for (const file of backupInfo.includedFiles) {
        const filePath = join(backupInfo.path, file)
        const exists = await fs.access(filePath).then(() => true).catch(() => false)
        if (!exists) {
          missingFiles.push(file)
        }
      }

      if (missingFiles.length > 0) {
        return {
          success: false,
          errors: [`Missing files in backup: ${missingFiles.join(', ')}`],
          warnings: [],
          details: { missingFiles }
        }
      }

      return {
        success: true,
        errors: [],
        warnings: [],
        details: {
          backupSize: backupInfo.size,
          fileCount: backupInfo.includedFiles.length,
          checksum: backupInfo.checksum
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        details: {}
      }
    }
  }

  /**
   * Create a named snapshot
   */
  async createSnapshot(label: string): Promise<SnapshotInfo> {
    const backup = await this.createFullBackup()
    
    const snapshot: SnapshotInfo = {
      id: `snapshot-${Date.now()}`,
      label,
      timestamp: new Date(),
      backupId: backup.id,
      description: `Snapshot created: ${label}`
    }

    await this.saveSnapshot(snapshot)
    return snapshot
  }

  /**
   * List all snapshots
   */
  async listSnapshots(): Promise<SnapshotInfo[]> {
    try {
      const data = await fs.readFile(this.snapshotsFile, 'utf-8')
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    const startTime = Date.now()
    const restoredFiles: string[] = []
    const errors: string[] = []

    try {
      const backupInfo = await this.getBackupInfo(backupId)
      if (!backupInfo) {
        return {
          success: false,
          restoredFiles: [],
          errors: [`Backup ${backupId} not found`],
          duration: Date.now() - startTime
        }
      }

      // Validate backup before restore
      const validation = await this.validateBackup(backupId)
      if (!validation.success) {
        return {
          success: false,
          restoredFiles: [],
          errors: [`Backup validation failed: ${validation.errors.join(', ')}`],
          duration: Date.now() - startTime
        }
      }

      // Restore files
      for (const file of backupInfo.includedFiles) {
        try {
          const sourcePath = join(backupInfo.path, file)
          const targetPath = file

          // Ensure target directory exists
          await fs.mkdir(dirname(targetPath), { recursive: true })
          
          // Copy file
          await fs.copyFile(sourcePath, targetPath)
          restoredFiles.push(file)
        } catch (error) {
          const errorMsg = `Failed to restore ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
        }
      }

      // Restore environment variables
      if (backupInfo.environmentVariables) {
        await this.restoreEnvironmentVariables(backupInfo.path)
      }

      return {
        success: errors.length === 0,
        restoredFiles,
        errors,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        restoredFiles,
        errors: [`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Restore from snapshot
   */
  async restoreFromSnapshot(snapshotId: string): Promise<RestoreResult> {
    const snapshots = await this.listSnapshots()
    const snapshot = snapshots.find(s => s.id === snapshotId)
    
    if (!snapshot) {
      return {
        success: false,
        restoredFiles: [],
        errors: [`Snapshot ${snapshotId} not found`],
        duration: 0
      }
    }

    return this.restoreFromBackup(snapshot.backupId)
  }

  // Private helper methods

  private async ensureBackupDir(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true })
  }

  private async getFilesToBackup(): Promise<string[]> {
    const patterns = [
      'app/**/*',
      'components/**/*',
      'lib/**/*',
      'public/**/*',
      'styles/**/*',
      'types/**/*',
      'utils/**/*',
      'config/**/*',
      'hooks/**/*',
      'contexts/**/*',
      'middleware/**/*',
      'messages/**/*',
      'i18n/**/*',
      'package.json',
      'package-lock.json',
      'next.config.mjs',
      'tailwind.config.ts',
      'tsconfig.json',
      'postcss.config.mjs',
      '.eslintrc.json',
      'playwright.config.ts',
      'jest.config.js',
      'vitest.config.ts',
      'i18n.ts',
      'instrumentation.ts',
      'middleware.ts'
    ]

    const files: string[] = []
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, { 
          ignore: ['node_modules/**', '.next/**', '.git/**', 'coverage/**', 'dist/**']
        })
        files.push(...matches)
      } catch (error) {
        console.warn(`Failed to glob pattern ${pattern}:`, error)
      }
    }

    return Array.from(new Set(files)) // Remove duplicates
  }

  private async getChangedFilesSince(since: Date): Promise<string[]> {
    const allFiles = await this.getFilesToBackup()
    const changedFiles: string[] = []

    for (const file of allFiles) {
      try {
        const stats = await fs.stat(file)
        if (stats.mtime > since) {
          changedFiles.push(file)
        }
      } catch {
        // File might not exist, skip
      }
    }

    return changedFiles
  }

  private async backupEnvironmentVariables(backupPath: string): Promise<void> {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.test']
    
    for (const envFile of envFiles) {
      try {
        const exists = await fs.access(envFile).then(() => true).catch(() => false)
        if (exists) {
          await fs.copyFile(envFile, join(backupPath, envFile))
        }
      } catch (error) {
        console.warn(`Failed to backup ${envFile}:`, error)
      }
    }
  }

  private async restoreEnvironmentVariables(backupPath: string): Promise<void> {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.test']
    
    for (const envFile of envFiles) {
      try {
        const sourcePath = join(backupPath, envFile)
        const exists = await fs.access(sourcePath).then(() => true).catch(() => false)
        if (exists) {
          await fs.copyFile(sourcePath, envFile)
        }
      } catch (error) {
        console.warn(`Failed to restore ${envFile}:`, error)
      }
    }
  }

  private async calculateBackupChecksum(backupPath: string): Promise<string> {
    const hash = createHash('sha256')
    
    const files = await glob('**/*', { 
      cwd: backupPath,
      nodir: true 
    })
    
    files.sort() // Ensure consistent order
    
    for (const file of files) {
      try {
        const content = await fs.readFile(join(backupPath, file))
        hash.update(file) // Include filename in hash
        hash.update(content)
      } catch (error) {
        console.warn(`Failed to hash file ${file}:`, error)
      }
    }
    
    return hash.digest('hex')
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0
    
    try {
      const files = await glob('**/*', { 
        cwd: dirPath,
        nodir: true 
      })
      
      for (const file of files) {
        try {
          const stats = await fs.stat(join(dirPath, file))
          size += stats.size
        } catch {
          // Skip files that can't be accessed
        }
      }
    } catch {
      // Directory might not exist
    }
    
    return size
  }

  private async saveBackupMetadata(backupInfo: BackupInfo): Promise<void> {
    const metadataFile = join(this.backupDir, 'backups.json')
    
    let backups: BackupInfo[] = []
    try {
      const data = await fs.readFile(metadataFile, 'utf-8')
      backups = JSON.parse(data)
    } catch {
      // File doesn't exist yet
    }
    
    backups.push(backupInfo)
    await fs.writeFile(metadataFile, JSON.stringify(backups, null, 2))
  }

  private async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    const metadataFile = join(this.backupDir, 'backups.json')
    
    try {
      const data = await fs.readFile(metadataFile, 'utf-8')
      const backups: BackupInfo[] = JSON.parse(data)
      return backups.find(b => b.id === backupId) || null
    } catch {
      return null
    }
  }

  private async getLastBackup(): Promise<BackupInfo | null> {
    const metadataFile = join(this.backupDir, 'backups.json')
    
    try {
      const data = await fs.readFile(metadataFile, 'utf-8')
      const backups: BackupInfo[] = JSON.parse(data)
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null
    } catch {
      return null
    }
  }

  private async saveSnapshot(snapshot: SnapshotInfo): Promise<void> {
    let snapshots: SnapshotInfo[] = []
    try {
      const data = await fs.readFile(this.snapshotsFile, 'utf-8')
      snapshots = JSON.parse(data)
    } catch {
      // File doesn't exist yet
    }
    
    snapshots.push(snapshot)
    await fs.writeFile(this.snapshotsFile, JSON.stringify(snapshots, null, 2))
  }
}