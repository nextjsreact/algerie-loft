#!/usr/bin/env tsx

/**
 * Monitoring System Demo
 * 
 * Demonstrates the monitoring system capabilities in a realistic scenario
 */

import { 
  OperationMonitor,
  SecurityIncidentManager,
  HealthMonitor,
  CloneOptions
} from '../lib/environment-management/monitoring'
import { Environment } from '../lib/environment-management'

async function demoMonitoringSystem() {
  console.log('🎬 Monitoring System Demo - Realistic Clone Operation\n')

  // Create realistic environments
  const prodEnv: Environment = {
    id: 'prod-loft-algerie',
    name: 'Loft Algérie Production',
    type: 'production',
    supabaseUrl: 'https://mhngbluefyucoesgcjoy.supabase.co',
    supabaseAnonKey: 'prod-anon-key',
    supabaseServiceKey: 'prod-service-key',
    status: 'read_only',
    isProduction: true,
    allowWrites: false,
    createdAt: new Date(),
    lastUpdated: new Date(),
    description: 'Production environment for Loft Algérie system'
  }

  const testEnv: Environment = {
    id: 'test-loft-algerie',
    name: 'Loft Algérie Test Environment',
    type: 'test',
    supabaseUrl: 'https://test-loft-algerie.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceKey: 'test-service-key',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date(),
    lastUpdated: new Date(),
    description: 'Test environment for safe development and testing'
  }

  // Initialize monitoring system
  console.log('🔧 Initializing monitoring system...')
  const operationMonitor = new OperationMonitor({
    enableDetailedLogging: true,
    logLevel: 'info',
    enablePerformanceMetrics: true,
    enableSecurityMonitoring: true
  })
  
  const securityManager = new SecurityIncidentManager()
  const healthMonitor = new HealthMonitor()

  // Start health monitoring
  console.log('🔍 Starting health monitoring...')
  healthMonitor.startMonitoring(prodEnv)
  healthMonitor.startMonitoring(testEnv)

  // Wait a moment for initial health checks
  await sleep(2000)

  // Simulate a realistic clone operation
  console.log('\n🚀 Starting clone operation: Production → Test')
  
  const cloneOptions: CloneOptions = {
    anonymizeData: true,
    includeAuditLogs: true,
    includeConversations: true,
    includeReservations: true,
    preserveUserRoles: false,
    backupBeforeClone: true
  }

  const operation = operationMonitor.createOperation(
    prodEnv.id,
    testEnv.id,
    prodEnv.type,
    testEnv.type,
    cloneOptions,
    'admin-user-123',
    'admin@loftalgerie.com'
  )

  console.log(`📋 Operation created: ${operation.id}`)
  
  // Start the operation
  operationMonitor.updateOperationStatus(operation.id, 'in_progress')
  
  // Simulate realistic clone phases
  console.log('\n📊 Simulating clone operation phases...')
  
  // Phase 1: Schema Analysis
  console.log('🔍 Phase 1: Analyzing database schema...')
  operationMonitor.logOperation(operation.id, 'info', 'SchemaAnalyzer', 'Starting schema analysis')
  await sleep(1000)
  
  operationMonitor.updateProgress(operation.id, 10, 'Schema analysis in progress')
  operationMonitor.updateStatistics(operation.id, {
    totalTables: 25,
    tablesProcessed: 0
  })
  
  await sleep(1500)
  operationMonitor.updateProgress(operation.id, 15, 'Found 25 tables, 45 functions, 12 triggers')
  operationMonitor.logOperation(operation.id, 'info', 'SchemaAnalyzer', 'Detected audit system, conversations, and reservations schemas')
  
  // Phase 2: Schema Creation
  console.log('🏗️ Phase 2: Creating target schema...')
  await sleep(1000)
  
  operationMonitor.updateProgress(operation.id, 25, 'Creating tables and indexes')
  operationMonitor.updateStatistics(operation.id, {
    tablesProcessed: 25,
    functionsCloned: 45,
    triggersCloned: 12,
    indexesCreated: 67
  })
  
  operationMonitor.logOperation(operation.id, 'info', 'SchemaCreator', 'All tables created successfully')
  operationMonitor.logOperation(operation.id, 'info', 'SchemaCreator', 'Audit system schema replicated')
  
  // Phase 3: Data Cloning
  console.log('📋 Phase 3: Cloning data...')
  await sleep(1000)
  
  operationMonitor.updateProgress(operation.id, 35, 'Cloning core tables (profiles, lofts, transactions)')
  
  // Simulate cloning different table types
  const tables = [
    { name: 'profiles', records: 150 },
    { name: 'lofts', records: 45 },
    { name: 'transactions', records: 2340 },
    { name: 'reservations', records: 890 },
    { name: 'conversations', records: 234 },
    { name: 'messages', records: 1567 },
    { name: 'audit_logs', records: 15670 },
    { name: 'notifications', records: 456 }
  ]
  
  let totalRecords = 0
  let progress = 35
  
  for (const table of tables) {
    await sleep(800)
    totalRecords += table.records
    progress += 5
    
    operationMonitor.updateProgress(operation.id, progress, `Cloning ${table.name} (${table.records} records)`)
    operationMonitor.logOperation(operation.id, 'info', 'DataCloner', `Cloned ${table.records} records from ${table.name}`)
    
    operationMonitor.updateStatistics(operation.id, {
      recordsCloned: totalRecords,
      totalSizeCloned: totalRecords * 1024, // Simulate size
      networkBytesTransferred: totalRecords * 512
    })
  }
  
  // Phase 4: Data Anonymization
  console.log('🎭 Phase 4: Anonymizing sensitive data...')
  await sleep(1000)
  
  operationMonitor.updateProgress(operation.id, 80, 'Anonymizing personal data')
  operationMonitor.logOperation(operation.id, 'info', 'DataAnonymizer', 'Starting data anonymization')
  
  await sleep(1500)
  const anonymizedRecords = Math.floor(totalRecords * 0.6) // 60% of records have sensitive data
  
  operationMonitor.updateProgress(operation.id, 90, `Anonymized ${anonymizedRecords} records`)
  operationMonitor.updateStatistics(operation.id, {
    recordsAnonymized: anonymizedRecords
  })
  
  operationMonitor.logOperation(operation.id, 'info', 'DataAnonymizer', 'Anonymized emails, names, and phone numbers')
  operationMonitor.logOperation(operation.id, 'info', 'DataAnonymizer', 'Preserved data relationships and referential integrity')
  
  // Phase 5: Validation
  console.log('✅ Phase 5: Validating cloned environment...')
  await sleep(1000)
  
  operationMonitor.updateProgress(operation.id, 95, 'Running validation tests')
  operationMonitor.logOperation(operation.id, 'info', 'Validator', 'Testing database connectivity')
  
  await sleep(800)
  operationMonitor.logOperation(operation.id, 'info', 'Validator', 'Testing audit system functionality')
  operationMonitor.logOperation(operation.id, 'info', 'Validator', 'Testing notification system')
  
  // Complete the operation
  operationMonitor.updateProgress(operation.id, 100, 'Clone operation completed successfully')
  operationMonitor.updateOperationStatus(operation.id, 'completed')
  
  console.log('\n🎉 Clone operation completed!')
  
  // Generate and display reports
  console.log('\n📊 Generating reports...')
  
  const operationReport = operationMonitor.generateOperationReport(operation.id)
  console.log('\n' + '='.repeat(60))
  console.log(operationReport)
  console.log('='.repeat(60))
  
  // Show health status
  console.log('\n🏥 Environment Health Status:')
  const prodHealth = healthMonitor.getHealthStatus(prodEnv.id)
  const testHealth = healthMonitor.getHealthStatus(testEnv.id)
  
  if (prodHealth) {
    console.log(`Production: ${prodHealth.overall.toUpperCase()} (${prodHealth.checks.length} checks)`)
  }
  if (testHealth) {
    console.log(`Test: ${testHealth.overall.toUpperCase()} (${testHealth.checks.length} checks)`)
  }
  
  // Show security incidents
  console.log('\n🔒 Security Summary:')
  const recentIncidents = securityManager.getRecentIncidents(1) // Last hour
  console.log(`Recent incidents: ${recentIncidents.length}`)
  
  if (recentIncidents.length > 0) {
    console.log('Recent security events:')
    recentIncidents.forEach(incident => {
      const emoji = incident.severity === 'critical' ? '🔴' : 
                   incident.severity === 'high' ? '🟠' : 
                   incident.severity === 'medium' ? '🟡' : '🔵'
      console.log(`  ${emoji} ${incident.description}`)
    })
  }
  
  // Simulate some additional monitoring scenarios
  console.log('\n🎭 Simulating additional monitoring scenarios...')
  
  // Simulate a failed operation
  console.log('❌ Simulating failed operation...')
  const failedOperation = operationMonitor.createOperation(
    prodEnv.id,
    'invalid-target',
    'production',
    'test',
    cloneOptions,
    'test-user',
    'test@example.com'
  )
  
  operationMonitor.updateOperationStatus(failedOperation.id, 'in_progress')
  operationMonitor.updateProgress(failedOperation.id, 30, 'Database connection error')
  
  operationMonitor.updateOperationStatus(failedOperation.id, 'failed', {
    code: 'DB_CONNECTION_ERROR',
    message: 'Failed to connect to target database',
    component: 'DatabaseConnector',
    timestamp: new Date(),
    recoverable: true,
    suggestedAction: 'Check database credentials and network connectivity'
  })
  
  // Simulate suspicious activity
  console.log('👁️ Simulating suspicious activity detection...')
  securityManager.reportIncident({
    type: 'suspicious_activity',
    severity: 'medium',
    description: 'Multiple rapid clone attempts from same user',
    userId: 'suspicious-user-456',
    userEmail: 'suspicious@example.com',
    component: 'OperationMonitor',
    metadata: {
      attemptCount: 5,
      timeWindow: '5 minutes',
      ipAddress: '192.168.1.100'
    }
  })
  
  // Final summary
  console.log('\n📈 Final Monitoring Summary:')
  console.log(`Total operations: ${operationMonitor.getAllOperations().length}`)
  console.log(`Completed operations: ${operationMonitor.getOperationsByStatus('completed').length}`)
  console.log(`Failed operations: ${operationMonitor.getOperationsByStatus('failed').length}`)
  console.log(`Security incidents: ${securityManager.getAllIncidents().length}`)
  console.log(`Critical incidents: ${securityManager.getCriticalIncidents().length}`)
  console.log(`Unresolved incidents: ${securityManager.getUnresolvedIncidents().length}`)
  
  // Generate comprehensive security report
  const securityReport = securityManager.generateSecurityReport(1)
  console.log('\n🔒 Security Report:')
  console.log(securityReport)
  
  // Cleanup
  console.log('\n🧹 Cleaning up monitoring resources...')
  healthMonitor.stopMonitoring(prodEnv.id)
  healthMonitor.stopMonitoring(testEnv.id)
  
  console.log('\n✨ Demo completed successfully!')
  console.log('\n🎯 Key Features Demonstrated:')
  console.log('  ✅ Real-time operation monitoring')
  console.log('  ✅ Detailed progress tracking')
  console.log('  ✅ Comprehensive logging')
  console.log('  ✅ Security incident detection')
  console.log('  ✅ Health monitoring')
  console.log('  ✅ Automated alerting')
  console.log('  ✅ Report generation')
  console.log('  ✅ Error handling and recovery')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run the demo
demoMonitoringSystem()
  .then(() => {
    console.log('\n🎬 Demo completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  })

export { demoMonitoringSystem }