#!/usr/bin/env tsx

/**
 * Monitoring System Test Script
 * 
 * Tests the monitoring, logging, and security incident management systems
 */

import { 
  OperationMonitor,
  SecurityIncidentManager,
  HealthMonitor,
  CloneOptions
} from '../lib/environment-management/monitoring'
import { Environment } from '../lib/environment-management'

async function testMonitoringSystem() {
  console.log('📊 Testing Monitoring System...\n')

  let testsPassed = 0
  let testsTotal = 0

  function runTest(testName: string, testFn: () => Promise<boolean>): Promise<void> {
    return new Promise(async (resolve) => {
      testsTotal++
      try {
        const result = await testFn()
        if (result) {
          console.log(`✅ ${testName}`)
          testsPassed++
        } else {
          console.log(`❌ ${testName}`)
        }
      } catch (error) {
        console.log(`❌ ${testName} - Error: ${error.message}`)
      }
      resolve()
    })
  }

  // Create test environments
  const prodEnv: Environment = {
    id: 'test-prod-monitor',
    name: 'Production Environment',
    type: 'production',
    supabaseUrl: 'https://prod-project.supabase.co',
    supabaseAnonKey: 'test-key',
    supabaseServiceKey: 'test-service-key',
    status: 'read_only',
    isProduction: true,
    allowWrites: false,
    createdAt: new Date(),
    lastUpdated: new Date()
  }

  const testEnv: Environment = {
    id: 'test-env-monitor',
    name: 'Test Environment',
    type: 'test',
    supabaseUrl: 'https://test-project.supabase.co',
    supabaseAnonKey: 'test-key',
    supabaseServiceKey: 'test-service-key',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date(),
    lastUpdated: new Date()
  }

  // Initialize monitoring components
  const operationMonitor = new OperationMonitor()
  const securityManager = new SecurityIncidentManager()
  const healthMonitor = new HealthMonitor()

  // Test 1: Operation creation and monitoring
  await runTest('Operation creation and monitoring', async () => {
    const options: CloneOptions = {
      anonymizeData: true,
      includeAuditLogs: true,
      includeConversations: true,
      includeReservations: true,
      preserveUserRoles: false
    }

    const operation = operationMonitor.createOperation(
      prodEnv.id,
      testEnv.id,
      prodEnv.type,
      testEnv.type,
      options,
      'test-user-id',
      'test@example.com'
    )

    return operation.id && operation.status === 'pending' && operation.progress === 0
  })

  // Test 2: Operation progress tracking
  await runTest('Operation progress tracking', async () => {
    const operations = operationMonitor.getAllOperations()
    if (operations.length === 0) return false

    const operation = operations[0]
    
    // Update progress
    operationMonitor.updateProgress(operation.id, 25, 'Schema analysis complete')
    operationMonitor.updateProgress(operation.id, 50, 'Data cloning in progress')
    operationMonitor.updateProgress(operation.id, 75, 'Anonymization complete')
    operationMonitor.updateProgress(operation.id, 100, 'Clone operation complete')

    const updatedOperation = operationMonitor.getOperation(operation.id)
    return updatedOperation?.progress === 100
  })

  // Test 3: Operation logging
  await runTest('Operation logging', async () => {
    const operations = operationMonitor.getAllOperations()
    if (operations.length === 0) return false

    const operation = operations[0]
    
    operationMonitor.logOperation(operation.id, 'info', 'TestComponent', 'Test log message')
    operationMonitor.logOperation(operation.id, 'warning', 'TestComponent', 'Test warning message')
    operationMonitor.logOperation(operation.id, 'error', 'TestComponent', 'Test error message')

    const updatedOperation = operationMonitor.getOperation(operation.id)
    return updatedOperation && updatedOperation.logs.length >= 3
  })

  // Test 4: Operation statistics
  await runTest('Operation statistics tracking', async () => {
    const operations = operationMonitor.getAllOperations()
    if (operations.length === 0) return false

    const operation = operations[0]
    
    operationMonitor.updateStatistics(operation.id, {
      tablesProcessed: 15,
      totalTables: 20,
      recordsCloned: 10000,
      recordsAnonymized: 5000,
      functionsCloned: 25,
      triggersCloned: 10
    })

    const updatedOperation = operationMonitor.getOperation(operation.id)
    return updatedOperation?.statistics.recordsCloned === 10000
  })

  // Test 5: Operation completion
  await runTest('Operation completion', async () => {
    const operations = operationMonitor.getAllOperations()
    if (operations.length === 0) return false

    const operation = operations[0]
    
    operationMonitor.updateOperationStatus(operation.id, 'completed')

    const updatedOperation = operationMonitor.getOperation(operation.id)
    return updatedOperation?.status === 'completed' && updatedOperation.completedAt !== undefined
  })

  // Test 6: Security incident reporting
  await runTest('Security incident reporting', async () => {
    const incident = securityManager.reportIncident({
      type: 'production_access_attempt',
      severity: 'critical',
      description: 'Unauthorized production access attempt',
      environmentId: prodEnv.id,
      userId: 'test-user',
      component: 'TestComponent'
    })

    return incident.id && incident.severity === 'critical' && !incident.resolved
  })

  // Test 7: Security incident resolution
  await runTest('Security incident resolution', async () => {
    const incidents = securityManager.getAllIncidents()
    if (incidents.length === 0) return false

    const incident = incidents[0]
    securityManager.resolveIncident(incident.id, 'False alarm - test incident', 'test-admin')

    const resolvedIncident = securityManager.getIncident(incident.id)
    return resolvedIncident?.resolved === true && resolvedIncident.resolvedBy === 'test-admin'
  })

  // Test 8: Alert rule creation
  await runTest('Alert rule creation', async () => {
    const rule = securityManager.addAlertRule({
      name: 'Test Alert Rule',
      description: 'Test alert for critical incidents',
      enabled: true,
      conditions: [
        { metric: 'severity', operator: 'eq', threshold: 'critical' }
      ],
      actions: [
        { type: 'log', config: {} }
      ],
      cooldownPeriod: 60000
    })

    return rule.id && rule.name === 'Test Alert Rule'
  })

  // Test 9: Health monitoring
  await runTest('Health monitoring', async () => {
    const healthStatus = await healthMonitor.performHealthCheck(testEnv)
    
    return healthStatus.environmentId === testEnv.id && 
           healthStatus.checks.length > 0 &&
           healthStatus.overall !== 'unknown'
  })

  // Test 10: Health monitoring for production
  await runTest('Production health monitoring', async () => {
    const healthStatus = await healthMonitor.performHealthCheck(prodEnv)
    
    return healthStatus.environmentId === prodEnv.id && 
           healthStatus.checks.length > 0
  })

  // Test 11: Operation report generation
  await runTest('Operation report generation', async () => {
    const operations = operationMonitor.getAllOperations()
    if (operations.length === 0) return false

    const operation = operations[0]
    const report = operationMonitor.generateOperationReport(operation.id)
    
    return report.includes('Clone Operation Report') && 
           report.includes(operation.id) &&
           report.includes('Statistics')
  })

  // Test 12: Security report generation
  await runTest('Security report generation', async () => {
    const report = securityManager.generateSecurityReport(1) // Last 1 day
    
    return report.includes('Security Report') && 
           report.includes('Summary') &&
           report.includes('Critical Incidents')
  })

  // Test 13: Health report generation
  await runTest('Health report generation', async () => {
    const report = healthMonitor.generateHealthReport()
    
    return report.includes('Environment Health Report') && 
           report.includes('Summary') &&
           report.includes('Environment Details')
  })

  // Test 14: Multiple incident types
  await runTest('Multiple incident types handling', async () => {
    securityManager.reportIncident({
      type: 'system_error',
      severity: 'high',
      description: 'Database connection failed',
      component: 'DatabaseConnector'
    })

    securityManager.reportIncident({
      type: 'suspicious_activity',
      severity: 'medium',
      description: 'Multiple failed login attempts',
      userId: 'suspicious-user',
      component: 'AuthSystem'
    })

    const incidents = securityManager.getAllIncidents()
    const systemErrors = securityManager.getIncidentsBySeverity('high')
    
    return incidents.length >= 3 && systemErrors.length >= 1
  })

  // Test 15: Monitoring cleanup
  await runTest('Monitoring system cleanup', async () => {
    try {
      operationMonitor.cleanup()
      healthMonitor.cleanup()
      return true
    } catch (error) {
      return false
    }
  })

  // Summary
  console.log('\n📊 Monitoring System Test Results:')
  console.log(`✅ Passed: ${testsPassed}/${testsTotal}`)
  console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`)

  if (testsPassed === testsTotal) {
    console.log('\n🎉 All monitoring system tests passed!')
    console.log('✅ Operation monitoring is working')
    console.log('✅ Security incident management is working')
    console.log('✅ Health monitoring is working')
    console.log('✅ Reporting systems are working')
    console.log('✅ Alert systems are working')
  } else {
    console.log('\n⚠️  Some monitoring system tests failed!')
    console.log('🔍 Review the monitoring configuration')
  }

  // Show some sample data
  console.log('\n📋 Sample Data Generated:')
  
  const operations = operationMonitor.getAllOperations()
  console.log(`Operations: ${operations.length}`)
  
  const incidents = securityManager.getAllIncidents()
  console.log(`Security Incidents: ${incidents.length}`)
  
  const healthStatuses = healthMonitor.getAllHealthStatuses()
  console.log(`Health Statuses: ${healthStatuses.length}`)

  // Show recent security incidents
  const recentIncidents = securityManager.getRecentIncidents(24)
  if (recentIncidents.length > 0) {
    console.log('\n🔔 Recent Security Incidents:')
    recentIncidents.slice(0, 3).forEach(incident => {
      console.log(`  ${incident.severity.toUpperCase()}: ${incident.description}`)
    })
  }

  return testsPassed === testsTotal
}

// Run the tests
testMonitoringSystem()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })

export { testMonitoringSystem }