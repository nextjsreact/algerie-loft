/**
 * Next.js 16 Migration System
 * Main entry point for the migration system
 */

export { MigrationController } from './migration-controller'
export { BackupManager } from './backup-manager'
export { CompatibilityChecker } from './compatibility-checker'
export { PerformanceAnalyzer } from './performance-analyzer'
export { EnvironmentAnalyzer } from './environment-analyzer'
export { RollbackSystem } from './rollback-system'

export type * from './types'

// Re-export main classes for easy access
export {
  type ApplicationAnalysis,
  type MigrationPlan,
  type MigrationResult,
  type MigrationStatus,
  type MigrationProgress,
  type BackupInfo,
  type CompatibilityReport,
  type PerformanceMetrics,
  type ValidationResult,
  type RollbackResult
} from './types'