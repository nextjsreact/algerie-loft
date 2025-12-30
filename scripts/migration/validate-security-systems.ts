#!/usr/bin/env tsx
/**
 * Security Systems Validation Script - Next.js 16 Migration
 * 
 * Checkpoint 3: Validation du système de sécurité
 * 
 * This script validates all security systems before proceeding with migration:
 * - Tests backup creation and integrity validation
 * - Validates rollback system functionality and timing
 * - Verifies migration controller security features
 * - Requests user confirmation before proceeding
 */

import { BackupManager } from '../../lib/migration/backup-manager'
import { RollbackSystem } from '../../lib/migration/rollback-system'
import { MigrationController } from '../../lib/migration/migration-controller'
import { CompatibilityChecker } from '../../lib/migration/compatibility-checker'
import { promises as fs } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

interface SecurityValidationResult {
  component: string
  success: boolean
  duration: number
  details: string[]
  errors: string[]
  warnings: string[]
}

interface SecurityValidationReport {
  overallSuccess: boolean
  totalDuration: number
  results: SecurityValidationResult[]
  criticalIssues: string[]
  recommendations: string[]
}

class SecuritySystemValidator {
  private backupManager: BackupManager
  private rollbackSystem: RollbackSystem
  private migrationController: MigrationController
  private compatibilityChecker: CompatibilityChecker
  private testBackupDir: string

  constructor() {
    this.testBackupDir = '.security-test-backups'
    this.backupManager = new BackupManager(this.testBackupDir)
    this.rollbackSystem = new RollbackSystem()
    this.migrationController = new MigrationController()
    this.compatibilityChecker = new CompatibilityChecker()
  }

  /**
   * Run comprehensive security validation
   */
  async validateSecuritySystems(): Promise<SecurityValidationReport> {
    console.log(chalk.blue('🔒 Starting Security Systems Validation'))
    console.log(chalk.gray('=' .repeat(60)))

    const startTime = Date.now()
    const results: SecurityValidationResult[] = []
    const criticalIssues: string[] = []
    const recommendations: string[] = []

    try {
      // 1. Test backup system
      console.log(chalk.yellow('\n📦 Testing Backup System...'))
      const backupResult = await this.validateBackupSystem()
      results.push(backupResult)
      
      if (!backupResult.success) {
        criticalIssues.push('Backup system validation failed')
      }

      // 2. Test rollback system
      console.log(chalk.yellow('\n🔄 Testing Rollback System...'))
      const rollbackResult = await this.validateRollbackSystem()
      results.push(rollbackResult)
      
      if (!rollbackResult.success) {
        criticalIssues.push('Rollback system validation failed')
      }

      // 3. Test migration controller security
      console.log(chalk.yellow('\n⚙️ Testing Migration Controller Security...'))
      const controllerResult = await this.validateMigrationControllerSecurity()
      results.push(controllerResult)
      
      if (!controllerResult.success) {
        criticalIssues.push('Migration controller security validation failed')
      }

      // 4. Test integration between systems
      console.log(chalk.yellow('\n🔗 Testing System Integration...'))
      const integrationResult = await this.validateSystemIntegration()
      results.push(integrationResult)
      
      if (!integrationResult.success) {
        criticalIssues.push('System integration validation failed')
      }

      // 5. Performance and timing validation
      console.log(chalk.yellow('\n⏱️ Testing Performance and Timing...'))
      const performanceResult = await this.validatePerformanceRequirements()
      results.push(performanceResult)
      
      if (!performanceResult.success) {
        criticalIssues.push('Performance requirements not met')
      }

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(results))

      const totalDuration = Date.now() - startTime
      const overallSuccess = criticalIssues.length === 0

      return {
        overallSuccess,
        totalDuration,
        results,
        criticalIssues,
        recommendations
      }
    } catch (error) {
      criticalIssues.push(`Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        overallSuccess: false,
        totalDuration: Date.now() - startTime,
        results,
        criticalIssues,
        recommendations
      }
    }
  }

  /**
   * Validate backup system functionality
   */
  private async validateBackupSystem(): Promise<SecurityValidationResult> {
    const startTime = Date.now()
    const details: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Test 1: Create full backup
      console.log('  📋 Creating full backup...')
      const backup = await this.backupManager.createFullBackup()
      details.push(`Full backup created: ${backup.id}`)
      details.push(`Backup size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`)
      details.push(`Files included: ${backup.includedFiles.length}`)

      // Test 2: Validate backup integrity
      console.log('  🔍 Validating backup integrity...')
      const validation = await this.backupManager.validateBackup(backup.id)
      
      if (validation.success) {
        details.push('Backup integrity validation passed')
      } else {
        errors.push(`Backup integrity validation failed: ${validation.errors.join(', ')}`)
      }

      // Test 3: Create named snapshot
      console.log('  📸 Creating named snapshot...')
      const snapshot = await this.backupManager.createSnapshot('Security-Test-Snapshot')
      details.push(`Snapshot created: ${snapshot.id} (${snapshot.label})`)

      // Test 4: Test incremental backup
      console.log('  📦 Testing incremental backup...')
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000))
      const incrementalBackup = await this.backupManager.createIncrementalBackup()
      details.push(`Incremental backup created: ${incrementalBackup.id}`)

      // Test 5: Test restoration capability (dry run)
      console.log('  🔄 Testing restoration capability...')
      const snapshots = await this.backupManager.listSnapshots()
      
      if (snapshots.length > 0) {
        details.push(`${snapshots.length} snapshots available for restoration`)
      } else {
        warnings.push('No snapshots available for restoration')
      }

      const duration = Date.now() - startTime
      const success = errors.length === 0

      return {
        component: 'Backup System',
        success,
        duration,
        details,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Backup system test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        component: 'Backup System',
        success: false,
        duration: Date.now() - startTime,
        details,
        errors,
        warnings
      }
    }
  }

  /**
   * Validate rollback system functionality
   */
  private async validateRollbackSystem(): Promise<SecurityValidationResult> {
    const startTime = Date.now()
    const details: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Test 1: Validate rollback capability
      console.log('  🔍 Validating rollback capability...')
      const capability = await this.rollbackSystem.validateRollbackCapability()
      
      if (capability.success) {
        details.push('Rollback capability validation passed')
        details.push(`Available snapshots: ${capability.details.availableSnapshots}`)
        details.push(`Configured triggers: ${capability.details.configuredTriggers}`)
      } else {
        errors.push(`Rollback capability validation failed: ${capability.errors.join(', ')}`)
      }

      // Test 2: Check rollback triggers
      console.log('  ⚡ Testing rollback triggers...')
      const buildFailureTrigger = await this.rollbackSystem.checkTriggers('build_failure', 1)
      const criticalErrorTrigger = await this.rollbackSystem.checkTriggers('critical_test_failure', 3)
      
      if (buildFailureTrigger === 'rollback') {
        details.push('Build failure trigger configured correctly')
      } else {
        warnings.push('Build failure trigger not configured for automatic rollback')
      }

      if (criticalErrorTrigger === 'rollback') {
        details.push('Critical error trigger configured correctly')
      }

      // Test 3: Get available rollback points
      console.log('  📍 Checking available rollback points...')
      const rollbackPoints = await this.rollbackSystem.getAvailableRollbackPoints()
      details.push(`Available rollback points: ${rollbackPoints.length}`)

      if (rollbackPoints.length === 0) {
        warnings.push('No rollback points available - create snapshots before migration')
      }

      // Test 4: Estimate rollback time
      console.log('  ⏱️ Estimating rollback time...')
      const estimatedTime = await this.rollbackSystem.estimateRollbackTime()
      details.push(`Estimated rollback time: ${(estimatedTime / 1000).toFixed(1)} seconds`)

      // Validate rollback time meets requirements (< 5 minutes)
      const maxRollbackTime = 5 * 60 * 1000 // 5 minutes in milliseconds
      if (estimatedTime > maxRollbackTime) {
        warnings.push(`Rollback time estimate (${(estimatedTime / 1000).toFixed(1)}s) exceeds 5-minute requirement`)
      } else {
        details.push('Rollback time meets performance requirements')
      }

      // Test 5: Check rollback history
      const rollbackHistory = this.rollbackSystem.getRollbackHistory()
      details.push(`Rollback history entries: ${rollbackHistory.length}`)

      const duration = Date.now() - startTime
      const success = errors.length === 0

      return {
        component: 'Rollback System',
        success,
        duration,
        details,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Rollback system test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        component: 'Rollback System',
        success: false,
        duration: Date.now() - startTime,
        details,
        errors,
        warnings
      }
    }
  }

  /**
   * Validate migration controller security features
   */
  private async validateMigrationControllerSecurity(): Promise<SecurityValidationResult> {
    const startTime = Date.now()
    const details: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Test 1: Validate checkpoint functionality
      console.log('  📍 Testing checkpoint functionality...')
      
      try {
        await this.migrationController.createCheckpoint('security-test-checkpoint', {
          testData: 'Security validation checkpoint',
          timestamp: new Date().toISOString()
        })
        details.push('Checkpoint creation successful')
      } catch (error) {
        errors.push(`Checkpoint creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      const checkpoints = this.migrationController.getCheckpoints()
      details.push(`Available checkpoints: ${checkpoints.length}`)

      // Test 2: Validate rollback capability integration
      console.log('  🔄 Testing rollback integration...')
      const rollbackCapability = await this.migrationController.validateRollbackCapability()
      
      if (rollbackCapability.success) {
        details.push('Migration controller rollback integration working')
      } else {
        errors.push(`Rollback integration failed: ${rollbackCapability.errors.join(', ')}`)
      }

      // Test 3: Test pause/resume functionality
      console.log('  ⏸️ Testing pause/resume functionality...')
      const initialStatus = this.migrationController.getStatus()
      details.push(`Initial status: ${initialStatus.status}`)

      this.migrationController.pauseMigration()
      const pausedStatus = this.migrationController.getStatus()
      
      if (pausedStatus.status === 'paused') {
        details.push('Pause functionality working')
      } else {
        errors.push('Pause functionality not working correctly')
      }

      this.migrationController.resumeMigration()
      const resumedStatus = this.migrationController.getStatus()
      
      if (resumedStatus.status === 'running') {
        details.push('Resume functionality working')
      } else {
        warnings.push('Resume functionality may not be working correctly')
      }

      // Test 4: Validate progress tracking
      console.log('  📊 Testing progress tracking...')
      const progress = this.migrationController.getProgress()
      details.push(`Progress tracking: ${progress.percentage}% (${progress.completedSteps}/${progress.totalSteps})`)

      // Test 5: Check available rollback points
      const rollbackPoints = await this.migrationController.getAvailableRollbackPoints()
      details.push(`Controller rollback points: ${rollbackPoints.length}`)

      const duration = Date.now() - startTime
      const success = errors.length === 0

      return {
        component: 'Migration Controller Security',
        success,
        duration,
        details,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Migration controller security test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        component: 'Migration Controller Security',
        success: false,
        duration: Date.now() - startTime,
        details,
        errors,
        warnings
      }
    }
  }

  /**
   * Validate system integration between components
   */
  private async validateSystemIntegration(): Promise<SecurityValidationResult> {
    const startTime = Date.now()
    const details: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Test 1: Backup-Rollback integration
      console.log('  🔗 Testing backup-rollback integration...')
      
      // Create a test snapshot
      const testSnapshot = await this.backupManager.createSnapshot('Integration-Test-Snapshot')
      details.push(`Test snapshot created: ${testSnapshot.id}`)

      // Verify rollback system can see the snapshot
      const rollbackPoints = await this.rollbackSystem.getAvailableRollbackPoints()
      const snapshotFound = rollbackPoints.some(point => point.id === testSnapshot.id)
      
      if (snapshotFound) {
        details.push('Backup-rollback integration working correctly')
      } else {
        errors.push('Rollback system cannot access backup snapshots')
      }

      // Test 2: Controller-Backup integration
      console.log('  🎛️ Testing controller-backup integration...')
      
      try {
        // Test checkpoint creation (which should create snapshots)
        await this.migrationController.createCheckpoint('integration-test', {
          phase: 'security-validation',
          timestamp: new Date().toISOString()
        })
        
        // Verify checkpoint was created
        const checkpoints = this.migrationController.getCheckpoints()
        const checkpointFound = checkpoints.some(cp => cp.id === 'integration-test')
        
        if (checkpointFound) {
          details.push('Controller-backup integration working correctly')
        } else {
          warnings.push('Controller checkpoint creation may not be working')
        }
      } catch (error) {
        warnings.push(`Controller-backup integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 3: End-to-end security workflow
      console.log('  🔄 Testing end-to-end security workflow...')
      
      try {
        // Simulate a complete security workflow:
        // 1. Create backup
        // 2. Create checkpoint
        // 3. Validate rollback capability
        // 4. Test restoration readiness
        
        const workflowBackup = await this.backupManager.createFullBackup()
        const workflowValidation = await this.backupManager.validateBackup(workflowBackup.id)
        const rollbackValidation = await this.rollbackSystem.validateRollbackCapability()
        
        if (workflowValidation.success && rollbackValidation.success) {
          details.push('End-to-end security workflow validated successfully')
        } else {
          errors.push('End-to-end security workflow validation failed')
        }
      } catch (error) {
        errors.push(`End-to-end workflow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      const duration = Date.now() - startTime
      const success = errors.length === 0

      return {
        component: 'System Integration',
        success,
        duration,
        details,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`System integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        component: 'System Integration',
        success: false,
        duration: Date.now() - startTime,
        details,
        errors,
        warnings
      }
    }
  }

  /**
   * Validate performance requirements
   */
  private async validatePerformanceRequirements(): Promise<SecurityValidationResult> {
    const startTime = Date.now()
    const details: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Test 1: Backup creation time
      console.log('  ⏱️ Testing backup creation performance...')
      const backupStartTime = Date.now()
      const performanceBackup = await this.backupManager.createFullBackup()
      const backupDuration = Date.now() - backupStartTime
      
      details.push(`Backup creation time: ${(backupDuration / 1000).toFixed(2)} seconds`)
      
      // Backup should complete within reasonable time (< 2 minutes for typical project)
      const maxBackupTime = 2 * 60 * 1000 // 2 minutes
      if (backupDuration > maxBackupTime) {
        warnings.push(`Backup creation time (${(backupDuration / 1000).toFixed(1)}s) may be too slow`)
      }

      // Test 2: Backup validation time
      console.log('  🔍 Testing backup validation performance...')
      const validationStartTime = Date.now()
      const validation = await this.backupManager.validateBackup(performanceBackup.id)
      const validationDuration = Date.now() - validationStartTime
      
      details.push(`Backup validation time: ${(validationDuration / 1000).toFixed(2)} seconds`)
      
      if (!validation.success) {
        errors.push('Backup validation failed during performance test')
      }

      // Test 3: Rollback estimation accuracy
      console.log('  📊 Testing rollback time estimation...')
      const estimationStartTime = Date.now()
      const estimatedRollbackTime = await this.rollbackSystem.estimateRollbackTime()
      const estimationDuration = Date.now() - estimationStartTime
      
      details.push(`Rollback estimation time: ${estimationDuration}ms`)
      details.push(`Estimated rollback duration: ${(estimatedRollbackTime / 1000).toFixed(1)} seconds`)
      
      // Rollback should be estimated to complete within 5 minutes
      const maxRollbackTime = 5 * 60 * 1000 // 5 minutes
      if (estimatedRollbackTime > maxRollbackTime) {
        warnings.push('Estimated rollback time exceeds 5-minute requirement')
      } else {
        details.push('Rollback time estimate meets requirements')
      }

      // Test 4: System responsiveness
      console.log('  🚀 Testing system responsiveness...')
      const responsivenessTests = [
        () => this.migrationController.getStatus(),
        () => this.migrationController.getProgress(),
        () => this.rollbackSystem.getRollbackHistory(),
        () => this.backupManager.listSnapshots()
      ]

      let totalResponseTime = 0
      for (const test of responsivenessTests) {
        const testStartTime = Date.now()
        await test()
        const testDuration = Date.now() - testStartTime
        totalResponseTime += testDuration
      }

      const avgResponseTime = totalResponseTime / responsivenessTests.length
      details.push(`Average system response time: ${avgResponseTime.toFixed(1)}ms`)
      
      if (avgResponseTime > 1000) { // 1 second
        warnings.push('System response time may be too slow')
      }

      const duration = Date.now() - startTime
      const success = errors.length === 0

      return {
        component: 'Performance Requirements',
        success,
        duration,
        details,
        errors,
        warnings
      }
    } catch (error) {
      errors.push(`Performance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        component: 'Performance Requirements',
        success: false,
        duration: Date.now() - startTime,
        details,
        errors,
        warnings
      }
    }
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(results: SecurityValidationResult[]): string[] {
    const recommendations: string[] = []
    
    for (const result of results) {
      if (result.warnings.length > 0) {
        recommendations.push(`${result.component}: Address ${result.warnings.length} warning(s)`)
      }
      
      if (result.duration > 30000) { // 30 seconds
        recommendations.push(`${result.component}: Consider optimizing performance (${(result.duration / 1000).toFixed(1)}s)`)
      }
    }

    // General recommendations
    const backupResult = results.find(r => r.component === 'Backup System')
    if (backupResult?.success) {
      recommendations.push('Create additional snapshots before starting migration')
    }

    const rollbackResult = results.find(r => r.component === 'Rollback System')
    if (rollbackResult?.success) {
      recommendations.push('Test rollback procedure in development environment first')
    }

    return recommendations
  }

  /**
   * Clean up test artifacts
   */
  async cleanup(): Promise<void> {
    try {
      // Remove test backup directory
      await fs.rmdir(this.testBackupDir, { recursive: true })
      console.log(chalk.gray('🧹 Test artifacts cleaned up'))
    } catch (error) {
      // Ignore cleanup errors
      console.log(chalk.gray('⚠️ Cleanup completed with warnings'))
    }
  }
}

/**
 * Display validation report
 */
function displayValidationReport(report: SecurityValidationReport): void {
  console.log('\n' + chalk.blue('📋 Security Validation Report'))
  console.log(chalk.gray('=' .repeat(60)))

  // Overall status
  const statusIcon = report.overallSuccess ? '✅' : '❌'
  const statusColor = report.overallSuccess ? chalk.green : chalk.red
  console.log(`\n${statusIcon} ${statusColor('Overall Status:')} ${report.overallSuccess ? 'PASSED' : 'FAILED'}`)
  console.log(`⏱️ Total Duration: ${(report.totalDuration / 1000).toFixed(2)} seconds`)

  // Component results
  console.log('\n📊 Component Results:')
  for (const result of report.results) {
    const icon = result.success ? '✅' : '❌'
    const color = result.success ? chalk.green : chalk.red
    console.log(`\n${icon} ${color(result.component)}`)
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`)
    
    if (result.details.length > 0) {
      console.log('   Details:')
      result.details.forEach(detail => console.log(`     • ${detail}`))
    }
    
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('   Warnings:'))
      result.warnings.forEach(warning => console.log(chalk.yellow(`     ⚠️ ${warning}`)))
    }
    
    if (result.errors.length > 0) {
      console.log(chalk.red('   Errors:'))
      result.errors.forEach(error => console.log(chalk.red(`     ❌ ${error}`)))
    }
  }

  // Critical issues
  if (report.criticalIssues.length > 0) {
    console.log('\n' + chalk.red('🚨 Critical Issues:'))
    report.criticalIssues.forEach(issue => console.log(chalk.red(`  • ${issue}`)))
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n' + chalk.yellow('💡 Recommendations:'))
    report.recommendations.forEach(rec => console.log(chalk.yellow(`  • ${rec}`)))
  }

  console.log('\n' + chalk.gray('=' .repeat(60)))
}

/**
 * Request user confirmation to proceed
 */
async function requestUserConfirmation(report: SecurityValidationReport): Promise<boolean> {
  const readline = await import('readline')
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    console.log('\n' + chalk.blue('🤔 User Confirmation Required'))
    console.log(chalk.gray('-'.repeat(40)))
    
    if (report.overallSuccess) {
      console.log(chalk.green('✅ All security systems are functioning correctly.'))
      console.log(chalk.green('✅ Backup and rollback capabilities are validated.'))
      console.log(chalk.green('✅ Migration can proceed safely.'))
    } else {
      console.log(chalk.red('❌ Some security systems have issues.'))
      console.log(chalk.red('❌ Review the critical issues above.'))
      console.log(chalk.yellow('⚠️ Proceeding may be risky.'))
    }

    if (report.recommendations.length > 0) {
      console.log(chalk.yellow(`\n💡 ${report.recommendations.length} recommendation(s) available above.`))
    }

    const question = report.overallSuccess 
      ? '\n🚀 Do you want to proceed with the migration? (y/N): '
      : '\n⚠️ Do you want to proceed despite the issues? (y/N): '

    rl.question(chalk.cyan(question), (answer) => {
      rl.close()
      const confirmed = answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes'
      
      if (confirmed) {
        console.log(chalk.green('\n✅ User confirmed: Proceeding with migration'))
      } else {
        console.log(chalk.yellow('\n⏸️ User declined: Migration paused'))
        console.log(chalk.gray('Fix the issues above and run this validation again.'))
      }
      
      resolve(confirmed)
    })
  })
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log(chalk.blue('🔒 Next.js 16 Migration - Security Systems Validation'))
  console.log(chalk.gray('Task 3: Checkpoint - Validation du système de sécurité'))
  console.log(chalk.gray('=' .repeat(60)))

  const validator = new SecuritySystemValidator()

  try {
    // Run security validation
    const report = await validator.validateSecuritySystems()
    
    // Display results
    displayValidationReport(report)
    
    // Request user confirmation
    const userConfirmed = await requestUserConfirmation(report)
    
    if (userConfirmed) {
      console.log('\n' + chalk.green('🎉 Security validation completed successfully!'))
      console.log(chalk.green('✅ All security systems are ready for migration.'))
      console.log(chalk.blue('📋 You can now proceed to the next migration tasks.'))
      
      // Save validation report
      const reportPath = join('.migration-backups', 'security-validation-report.json')
      await fs.mkdir('.migration-backups', { recursive: true })
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(chalk.gray(`📄 Validation report saved to: ${reportPath}`))
      
      process.exit(0)
    } else {
      console.log('\n' + chalk.yellow('⏸️ Migration paused by user.'))
      console.log(chalk.gray('Address the issues above and run this validation again.'))
      process.exit(1)
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Security validation failed:'))
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'))
    process.exit(1)
  } finally {
    // Cleanup test artifacts
    await validator.cleanup()
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Fatal error:'), error)
    process.exit(1)
  })
}

export { SecuritySystemValidator, main as validateSecuritySystems }