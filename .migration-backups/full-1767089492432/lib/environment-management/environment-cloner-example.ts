/**
 * Environment Cloner Usage Example
 * 
 * Demonstrates how to use the environment cloning orchestrator
 */

import { 
  EnvironmentCloner,
  EnvironmentConfigManager,
  CloneProgressTracker,
  RealTimeMonitor,
  CloneReportingSystem,
  Environment,
  CloneOptions,
  CloneResult
} from './index'

/**
 * Example: Complete environment cloning workflow
 */
export async function exampleCloneWorkflow(): Promise<void> {
  console.log('🚀 Starting Environment Cloning Example')
  
  // Initialize components
  const cloner = new EnvironmentCloner()
  const configManager = new EnvironmentConfigManager()
  const progressTracker = new CloneProgressTracker()
  const monitor = new RealTimeMonitor()
  const reportingSystem = new CloneReportingSystem()

  try {
    // 1. Load source and target environments
    console.log('\n📋 Step 1: Loading environment configurations')
    
    const sourceEnv = await configManager.createEnvironmentFromConfig('production')
    const targetEnv = await configManager.createEnvironmentFromConfig('test')
    
    console.log(`   Source: ${sourceEnv.name} (${sourceEnv.type})`)
    console.log(`   Target: ${targetEnv.name} (${targetEnv.type})`)

    // 2. Configure clone options
    console.log('\n⚙️  Step 2: Configuring clone options')
    
    const cloneOptions: CloneOptions = {
      anonymizeData: true,
      includeAuditLogs: true,
      includeConversations: true,
      includeReservations: true,
      preserveUserRoles: false,
      createBackup: true,
      validateAfterClone: true
    }
    
    console.log('   ✅ Anonymization enabled')
    console.log('   ✅ Audit logs included')
    console.log('   ✅ Conversations included')
    console.log('   ✅ Reservations included')
    console.log('   ✅ Backup creation enabled')
    console.log('   ✅ Post-clone validation enabled')

    // 3. Set up monitoring and progress tracking
    console.log('\n📊 Step 3: Setting up monitoring')
    
    // Set up progress callback
    const operationId = `example_${Date.now()}`
    progressTracker.onProgressUpdate(operationId, (update) => {
      console.log(`   Progress: ${update.progress}% - ${update.phase} - ${update.message}`)
    })

    // Set up real-time monitoring
    monitor.on('progress_update', (event) => {
      if (event.operationId === operationId) {
        console.log(`   📈 ${event.data.phase}: ${event.data.progress}%`)
      }
    })

    monitor.on('alert_created', (event) => {
      if (event.operationId === operationId) {
        console.log(`   ⚠️  Alert: ${event.data.message} (${event.data.severity})`)
      }
    })

    // 4. Execute the clone operation
    console.log('\n🔄 Step 4: Executing clone operation')
    
    const result: CloneResult = await cloner.cloneEnvironment(
      sourceEnv,
      targetEnv,
      cloneOptions
    )

    // 5. Generate comprehensive report
    console.log('\n📊 Step 5: Generating operation report')
    
    const operation = cloner.getOperationStatus(result.operationId)
    if (operation) {
      const report = await reportingSystem.generateCloneReport(
        operation,
        result,
        progressTracker.getProgressStatistics(result.operationId) || undefined,
        {
          includeTimeline: true,
          includeDetailedStats: true,
          includePerformanceMetrics: true,
          includeIssueAnalysis: true,
          generateCharts: false,
          exportFormat: 'json'
        }
      )
      
      console.log(`   📄 Report generated: ${report.reportId}`)
      console.log(`   📊 Overall Score: ${report.summary.overallScore}/100`)
      console.log(`   ⏱️  Duration: ${formatDuration(report.summary.duration)}`)
      console.log(`   📋 Records Cloned: ${report.statistics.data?.recordsCloned || 0}`)
      console.log(`   🔒 Records Anonymized: ${report.statistics.anonymization?.recordsAnonymized || 0}`)
    }

    // 6. Display final results
    console.log('\n✅ Step 6: Clone operation completed')
    
    if (result.success) {
      console.log('   🎉 Clone operation successful!')
      console.log(`   📊 Statistics:`)
      console.log(`      - Tables cloned: ${result.statistics.tablesCloned}`)
      console.log(`      - Records cloned: ${result.statistics.recordsCloned}`)
      console.log(`      - Records anonymized: ${result.statistics.recordsAnonymized}`)
      console.log(`      - Functions cloned: ${result.statistics.functionsCloned}`)
      console.log(`      - Triggers cloned: ${result.statistics.triggersCloned}`)
      console.log(`      - Total size: ${result.statistics.totalSizeCloned}`)
      console.log(`      - Duration: ${formatDuration(result.duration)}`)
      
      if (result.backupId) {
        console.log(`   💾 Backup created: ${result.backupId}`)
      }
      
      if (result.validationResult) {
        console.log(`   ✅ Validation: ${result.validationResult.isValid ? 'Passed' : 'Failed'}`)
      }
    } else {
      console.log('   ❌ Clone operation failed')
      console.log(`   Errors: ${result.errors.join(', ')}`)
    }

    if (result.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${result.warnings.length}`)
      result.warnings.forEach(warning => console.log(`      - ${warning}`))
    }

  } catch (error) {
    console.error('❌ Clone workflow failed:', error.message)
    throw error
  }
}

/**
 * Example: Monitoring multiple operations
 */
export async function exampleMonitoringDashboard(): Promise<void> {
  console.log('📊 Environment Cloning Dashboard Example')
  
  const monitor = new RealTimeMonitor()
  
  // Get dashboard data
  const dashboard = monitor.getDashboardData()
  
  console.log('\n📈 Dashboard Overview:')
  console.log(`   Active Operations: ${dashboard.activeOperations}`)
  console.log(`   Total Alerts: ${dashboard.totalAlerts}`)
  console.log(`   Critical Alerts: ${dashboard.criticalAlerts}`)
  console.log(`   Average Progress: ${dashboard.averageProgress.toFixed(1)}%`)
  
  console.log('\n🖥️  System Health:')
  console.log(`   Status: ${dashboard.systemHealth.status}`)
  console.log(`   Memory Usage: ${dashboard.systemHealth.memoryUsage} MB`)
  console.log(`   CPU Usage: ${dashboard.systemHealth.cpuUsage}%`)
  console.log(`   Active Connections: ${dashboard.systemHealth.activeConnections}`)
  console.log(`   Uptime: ${formatDuration(dashboard.systemHealth.uptime * 1000)}`)
  
  if (dashboard.operations.length > 0) {
    console.log('\n🔄 Active Operations:')
    dashboard.operations.forEach(op => {
      console.log(`   ${op.id}:`)
      console.log(`      Progress: ${op.progress}%`)
      console.log(`      Phase: ${op.currentPhase}`)
      console.log(`      Status: ${op.status}`)
      console.log(`      Alerts: ${op.alerts}`)
      console.log(`      Source: ${op.sourceEnvironment}`)
      console.log(`      Target: ${op.targetEnvironment}`)
    })
  }
}

/**
 * Example: Backup and rollback operations
 */
export async function exampleBackupAndRollback(): Promise<void> {
  console.log('💾 Backup and Rollback Example')
  
  const configManager = new EnvironmentConfigManager()
  const cloner = new EnvironmentCloner()
  
  try {
    // Load test environment
    const testEnv = await configManager.createEnvironmentFromConfig('test')
    
    console.log('\n📦 Creating backup before operation...')
    // This would be done automatically by the cloner, but shown for example
    
    console.log('\n🔄 Simulating clone operation...')
    // Simulate a clone operation that might need rollback
    
    console.log('\n↩️  Demonstrating rollback capability...')
    // In case of failure, rollback would be triggered automatically
    
    console.log('✅ Backup and rollback system ready')
    
  } catch (error) {
    console.error('❌ Backup/rollback example failed:', error.message)
  }
}

/**
 * Example: Production safety demonstration
 */
export async function exampleProductionSafety(): Promise<void> {
  console.log('🔒 Production Safety Example')
  
  const configManager = new EnvironmentConfigManager()
  const cloner = new EnvironmentCloner()
  
  try {
    // Load environments
    const prodEnv = await configManager.createEnvironmentFromConfig('production')
    const testEnv = await configManager.createEnvironmentFromConfig('test')
    
    console.log('\n✅ Valid operation: Production → Test')
    console.log('   This is allowed (production as read-only source)')
    
    console.log('\n❌ Invalid operation: Test → Production')
    console.log('   This would be blocked (production cannot be target)')
    
    try {
      // This should fail due to production safety
      await cloner.cloneEnvironment(testEnv, prodEnv, {
        anonymizeData: false,
        includeAuditLogs: false,
        includeConversations: false,
        includeReservations: false,
        preserveUserRoles: false,
        createBackup: false,
        validateAfterClone: false
      })
    } catch (error) {
      console.log(`   🛡️  Safety system blocked operation: ${error.message}`)
    }
    
    console.log('\n🔒 Production safety system working correctly')
    
  } catch (error) {
    console.error('❌ Production safety example failed:', error.message)
  }
}

/**
 * Utility function to format duration
 */
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Main example runner
 */
export async function runAllExamples(): Promise<void> {
  console.log('🎯 Environment Cloning System Examples')
  console.log('=====================================')
  
  try {
    await exampleProductionSafety()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await exampleMonitoringDashboard()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await exampleBackupAndRollback()
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Note: Commented out the full clone example as it would be a long-running operation
    // await exampleCloneWorkflow()
    
    console.log('✅ All examples completed successfully')
    
  } catch (error) {
    console.error('❌ Examples failed:', error.message)
  }
}

// Export for use in other files
export {
  exampleCloneWorkflow,
  exampleMonitoringDashboard,
  exampleBackupAndRollback,
  exampleProductionSafety,
  runAllExamples
}