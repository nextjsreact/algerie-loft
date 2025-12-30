/**
 * Types for Next.js 16 Migration System
 * Defines all interfaces and types used throughout the migration process
 */

export interface ApplicationAnalysis {
  nextjsVersion: string
  dependencies: DependencyInfo[]
  customConfigurations: ConfigInfo[]
  criticalFeatures: FeatureInfo[]
  testCoverage: CoverageInfo
  performanceBaseline: PerformanceMetrics
  timestamp: Date
}

export interface DependencyInfo {
  name: string
  currentVersion: string
  latestVersion: string
  nextjs16Compatible: boolean
  upgradeRequired: boolean
  riskLevel: 'low' | 'medium' | 'high'
  upgradeNotes?: string
}

export interface ConfigInfo {
  file: string
  type: 'nextjs' | 'webpack' | 'typescript' | 'eslint' | 'other'
  customizations: string[]
  migrationRequired: boolean
  backupRequired: boolean
}

export interface FeatureInfo {
  name: string
  type: 'authentication' | 'i18n' | 'database' | 'payments' | 'reports' | 'ui' | 'other'
  critical: boolean
  testCoverage: number
  dependencies: string[]
  validationRequired: boolean
}

export interface CoverageInfo {
  totalLines: number
  coveredLines: number
  percentage: number
  uncoveredFiles: string[]
}

export interface PerformanceMetrics {
  buildTime: number
  bundleSize: number
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  timestamp: Date
}

export interface BackupInfo {
  id: string
  timestamp: Date
  type: 'full' | 'incremental'
  size: number
  checksum: string
  includedFiles: string[]
  databaseSchema: boolean
  environmentVariables: boolean
  path: string
}

export interface SnapshotInfo {
  id: string
  label: string
  timestamp: Date
  backupId: string
  description: string
}

export interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  details: Record<string, any>
}

export interface RestoreResult {
  success: boolean
  restoredFiles: string[]
  errors: string[]
  duration: number
}

export interface DependencyAnalysis {
  totalPackages: number
  compatiblePackages: PackageInfo[]
  incompatiblePackages: PackageInfo[]
  unknownPackages: PackageInfo[]
  recommendedUpgrades: UpgradeRecommendation[]
}

export interface PackageInfo {
  name: string
  currentVersion: string
  latestVersion: string
  nextjs16Version?: string
  compatible: boolean
  riskLevel: 'low' | 'medium' | 'high'
}

export interface UpgradeRecommendation {
  packageName: string
  fromVersion: string
  toVersion: string
  reason: string
  breakingChanges: string[]
  migrationSteps: string[]
}

export interface CompatibilityReport {
  overallCompatible: boolean
  issues: CompatibilityIssue[]
  recommendations: string[]
  estimatedMigrationTime: number
}

export interface CompatibilityIssue {
  type: 'dependency' | 'configuration' | 'code' | 'breaking-change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedFiles: string[]
  solution: string
}

export interface UpgradePath {
  steps: UpgradeStep[]
  estimatedDuration: number
  riskAssessment: string
}

export interface UpgradeStep {
  id: string
  description: string
  command?: string
  files?: string[]
  validation: string
}

export interface CompatibilityResult {
  compatible: boolean
  version: string
  issues: string[]
  recommendations: string[]
}

export interface MigrationStep {
  id: string
  name: string
  description: string
  type: 'dependency' | 'configuration' | 'code' | 'test' | 'validation'
  dependencies: string[]
  rollbackable: boolean
  estimatedDuration: number
  riskLevel: 'low' | 'medium' | 'high'
  validationCriteria: ValidationCriteria[]
}

export interface ValidationCriteria {
  type: 'test' | 'build' | 'runtime' | 'performance'
  description: string
  command?: string
  expectedResult: string
}

export interface StepResult {
  success: boolean
  duration: number
  output: string
  errors: string[]
  warnings: string[]
  rollbackData?: any
}

export interface RollbackResult {
  success: boolean
  restoredState: string
  duration: number
  errors: string[]
}

export interface MigrationPlan {
  id: string
  createdAt: Date
  estimatedDuration: number
  totalSteps: number
  phases: MigrationPhase[]
  rollbackPlan: RollbackPlan
  validationStrategy: ValidationStrategy
}

export interface MigrationPhase {
  id: string
  name: string
  description: string
  steps: MigrationStep[]
  checkpoints: Checkpoint[]
  rollbackStrategy: PhaseRollbackStrategy
}

export interface Checkpoint {
  id: string
  name: string
  description: string
  validationSteps: string[]
  rollbackPoint: boolean
}

export interface PhaseRollbackStrategy {
  automatic: boolean
  triggers: string[]
  steps: string[]
}

export interface RollbackPlan {
  automaticTriggers: RollbackTrigger[]
  manualTriggers: string[]
  rollbackSteps: RollbackStep[]
  estimatedRollbackTime: number
}

export interface RollbackTrigger {
  condition: string
  threshold: number
  action: 'pause' | 'rollback' | 'notify'
}

export interface RollbackStep {
  id: string
  description: string
  command: string
  validation: string
}

export interface ValidationStrategy {
  runUnitTests: boolean
  runIntegrationTests: boolean
  runE2ETests: boolean
  validateCriticalPaths: boolean
  validatePerformance: boolean
  validateSecurity: boolean
  maxPerformanceDegradation: number
  minTestCoverage: number
  maxErrorRate: number
}

export interface MigrationResult {
  success: boolean
  completedSteps: string[]
  failedSteps: string[]
  duration: number
  finalValidation: ValidationResult
  rollbackAvailable: boolean
}

export interface MigrationStatus {
  phase: string
  currentStep: string
  progress: number
  estimatedTimeRemaining: number
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
}

export interface MigrationProgress {
  totalSteps: number
  completedSteps: number
  currentStep: string
  percentage: number
  elapsedTime: number
  estimatedTimeRemaining: number
}

export interface FeatureValidationResult {
  feature: string
  success: boolean
  tests: TestResult[]
  performance: PerformanceResult
  errors: string[]
  warnings: string[]
}

export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

export interface PerformanceResult {
  metric: string
  current: number
  baseline: number
  degradation: number
  acceptable: boolean
}

export interface ValidationReport {
  overallStatus: 'success' | 'warning' | 'failure'
  featureResults: FeatureValidationResult[]
  regressionResults: RegressionTestResult
  performanceResults: PerformanceValidationResult
  recommendations: string[]
}

export interface RegressionTestResult {
  totalTests: number
  passedTests: number
  failedTests: number
  newFailures: string[]
  fixedTests: string[]
}

export interface PerformanceValidationResult {
  buildTime: PerformanceResult
  bundleSize: PerformanceResult
  pageLoad: PerformanceResult
  overallAcceptable: boolean
}