/**
 * Environment Management Automation Scripts
 * 
 * Centralized exports for all automation scripts and utilities
 */

// Daily and Weekly Refresh Automation
export { 
  DailyEnvironmentRefresh,
  runDailyRefresh,
  startScheduledRefresh,
  type DailyRefreshConfig,
  type DailyRefreshResult
} from './daily-refresh'

export {
  WeeklyEnvironmentRefresh,
  runWeeklyRefresh,
  startScheduledWeeklyRefresh,
  type WeeklyRefreshConfig,
  type WeeklyRefreshResult,
  type CleanupResult,
  type OptimizationResult,
  type ValidationResult
} from './weekly-refresh'

// Environment Setup Automation
export {
  TrainingEnvironmentSetup,
  setupTrainingEnvironment,
  type TrainingSetupConfig,
  type TrainingSetupResult,
  type TrainingUserRole,
  type TrainingScenario,
  type TrainingUser,
  type SampleDataSummary
} from './training-environment-setup'

export {
  DevelopmentEnvironmentSetup,
  setupDevelopmentEnvironment,
  type DevelopmentSetupConfig,
  type DevelopmentSetupResult,
  type DevUser,
  type DevDataSummary
} from './development-environment-setup'

// Workflow Utilities
export { WorkflowAutomation } from './workflow-automation'
export { ScheduleManager } from './schedule-manager'
export { AutomationReporter } from './automation-reporter'

// Automation Scripts and Utilities
export * from './daily-refresh'
export * from './weekly-refresh'
export * from './training-environment-setup'
export * from './development-environment-setup'
export * from './workflow-automation'
export * from './schedule-manager'