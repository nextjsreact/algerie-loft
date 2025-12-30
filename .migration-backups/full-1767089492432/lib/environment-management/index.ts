/**
 * Environment Management System
 * 
 * Main entry point for environment management with production safety
 */

export * from './types'
export * from './production-safety-guard'
export * from './environment-validator'
export * from './environment-config-manager'
export * from './environment-cloner'
export * from './clone-progress-tracker'
export * from './clone-backup-manager'
export * from './granular-rollback-manager'
export * from './backup-verification-system'
export * from './clone-reporting-system'
export * from './real-time-monitor'
export * from './monitoring'
export * from './validation'
export * from './specialized-cloning'

// Core environment switching components
export * from './core/configuration-manager'
export * from './core/environment-switcher'
export * from './core/service-manager'
export * from './core/environment-status-display'

// CLI components
export * from './cli/switch-command'

// Re-export main classes for easy access
export { ProductionSafetyGuard } from './production-safety-guard'
export { EnvironmentValidator } from './environment-validator'
export { EnvironmentConfigManager } from './environment-config-manager'
export { EnvironmentCloner } from './environment-cloner'
export { CloneProgressTracker } from './clone-progress-tracker'
export { CloneBackupManager } from './clone-backup-manager'
export { GranularRollbackManager } from './granular-rollback-manager'
export { BackupVerificationSystem } from './backup-verification-system'
export { CloneReportingSystem } from './clone-reporting-system'
export { RealTimeMonitor } from './real-time-monitor'
export { OperationMonitor, SecurityIncidentManager, HealthMonitor } from './monitoring'
export { ValidationEngine, FunctionalityTestSuite, HealthMonitoringSystem, ValidationAndHealthSystem } from './validation'
export { 
  SpecializedSystemsCloner,
  AuditSystemCloner,
  ConversationsSystemCloner,
  ReservationsSystemCloner
} from './specialized-cloning'

// Core environment switching exports
export { ConfigurationManager } from './core/configuration-manager'
export { EnvironmentSwitcher } from './core/environment-switcher'
export { ServiceManager } from './core/service-manager'
export { EnvironmentStatusDisplay } from './core/environment-status-display'
export { SwitchCommand } from './cli/switch-command'

/**
 * Utility function to get production safety guard instance
 */
export function getProductionSafetyGuard() {
  return ProductionSafetyGuard.getInstance()
}

/**
 * Utility function to validate production safety
 */
export async function ensureProductionSafety(): Promise<boolean> {
  const guard = ProductionSafetyGuard.getInstance()
  return guard.validateSafetyConfig()
}