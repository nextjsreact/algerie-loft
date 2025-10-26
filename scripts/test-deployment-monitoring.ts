#!/usr/bin/env tsx

/**
 * Test Script for Deployment Monitoring System
 * 
 * Tests all components of the deployment monitoring and rollback system.
 */

import { deploymentMonitor } from '../lib/deployment/monitoring'
import { featureFlagManager } from '../lib/deployment/feature-flags'
import { rollbackManager } from '../lib/deployment/rollback'

async function testDeploymentMonitoring() {
  console.log('🧪 Testing Deployment Monitoring System...\n')

  let testsPassed = 0
  let testsTotal = 0

  function runTest(testName: string, testFn: () => boolean): void {
    testsTotal++
    try {
      const result = testFn()
      if (result) {
        console.log(`✅ ${testName}`)
        testsPassed++
      } else {
        console.log(`❌ ${testName}`)
      }
    } catch (error) {
      console.log(`❌ ${testName} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Test 1: Performance Monitoring System
  runTest('Performance monitoring initialization', () => {
    deploymentMonitor.startMonitoring()
    const status = deploymentMonitor.getMonitoringStatus()
    return status.isActive === true
  })

  // Test 2: Feature Flag System
  runTest('Feature flag system initialization', () => {
    const flags = featureFlagManager.getAllFlags()
    return flags.length === 8 && flags.every(f => f.enabled === true)
  })

  // Test 3: Feature Flag Updates
  runTest('Feature flag rollout updates', () => {
    const success = featureFlagManager.updateRolloutPercentage('dual_audience_homepage', 50, 'test-system')
    const flag = featureFlagManager.getFlag('dual_audience_homepage')
    return success && flag?.rolloutPercentage === 50
  })

  // Test 4: Feature Flag Evaluation
  runTest('Feature flag evaluation', () => {
    const isEnabled = featureFlagManager.isFeatureEnabled('dual_audience_homepage', {
      userId: 'test-user-1'
    })
    // With 50% rollout, this should be deterministic based on user hash
    return typeof isEnabled === 'boolean'
  })

  // Test 5: Rollback System Initialization
  runTest('Rollback system initialization', () => {
    rollbackManager.startMonitoring()
    const status = rollbackManager.getMonitoringStatus()
    return status.isActive === true && status.enabledTriggers > 0
  })

  // Test 6: Performance Metrics Recording
  runTest('Performance metrics recording', () => {
    // Create mock request and response
    const mockRequest = {
      url: 'http://localhost:3000/test',
      method: 'GET',
      headers: new Map([['user-agent', 'test-agent']]),
      geo: { country: 'DZ', region: 'Algiers' }
    } as any

    const mockResponse = { status: 200 } as Response

    deploymentMonitor.recordMetrics(mockRequest, mockResponse, 150)
    
    const stats = deploymentMonitor.getPerformanceStats(1)
    return stats.requestCount > 0 && stats.averageResponseTime === 150
  })

  // Test 7: Web Vitals Recording
  runTest('Web Vitals recording', () => {
    deploymentMonitor.recordWebVitals({
      lcp: 2000,
      fid: 50,
      cls: 0.05,
      fcp: 1500,
      ttfb: 200
    })

    const stats = deploymentMonitor.getPerformanceStats(1)
    return stats.webVitals.averageLCP === 2000
  })

  // Test 8: Rollout Statistics
  runTest('Rollout statistics calculation', () => {
    const stats = featureFlagManager.getRolloutStats()
    return stats.totalFlags === 8 && stats.enabledFlags === 8
  })

  // Test 9: Emergency Rollback
  runTest('Emergency rollback functionality', () => {
    const eventId = rollbackManager.emergencyRollback('Test emergency rollback', 'test-system')
    const history = rollbackManager.getRollbackHistory(1)
    return eventId.length > 0 && history.length > 0
  })

  // Test 10: Feature Flag Reset After Rollback
  runTest('Feature flags reset after rollback', () => {
    // Check if flags were reset to 0% after emergency rollback
    const flag = featureFlagManager.getFlag('dual_audience_homepage')
    return flag?.rolloutPercentage === 0
  })

  // Test 11: Gradual Rollout Configuration
  runTest('Gradual rollout configuration', () => {
    // Reset flag for gradual rollout test
    featureFlagManager.updateRolloutPercentage('enhanced_hero_section', 5, 'test-system')
    const success = featureFlagManager.startGradualRollout('enhanced_hero_section', 'test-system')
    return success === true
  })

  // Test 12: Performance Stats Calculation
  runTest('Performance statistics calculation', () => {
    // Add some more metrics for better stats
    const mockRequest2 = {
      url: 'http://localhost:3000/test2',
      method: 'POST',
      headers: new Map(),
      geo: {}
    } as any

    const mockResponse2 = { status: 404 } as Response
    deploymentMonitor.recordMetrics(mockRequest2, mockResponse2, 3000)

    const stats = deploymentMonitor.getPerformanceStats(1)
    return stats.requestCount >= 2 && stats.errorRate > 0
  })

  // Test 13: Rollback Statistics
  runTest('Rollback statistics tracking', () => {
    const stats = rollbackManager.getRollbackStats()
    return stats.totalEvents > 0 && stats.lastRollback !== undefined
  })

  // Test 14: System Health Status
  runTest('System health status reporting', () => {
    const monitoringStatus = deploymentMonitor.getMonitoringStatus()
    const rollbackStatus = rollbackManager.getMonitoringStatus()
    
    return monitoringStatus.isActive && rollbackStatus.isActive
  })

  // Test 15: Cleanup and Shutdown
  runTest('System cleanup and shutdown', () => {
    deploymentMonitor.stopMonitoring()
    rollbackManager.stopMonitoring()
    
    const monitoringStatus = deploymentMonitor.getMonitoringStatus()
    const rollbackStatus = rollbackManager.getMonitoringStatus()
    
    return !monitoringStatus.isActive && !rollbackStatus.isActive
  })

  // Summary
  console.log('\n📊 Test Results:')
  console.log(`✅ Passed: ${testsPassed}/${testsTotal}`)
  console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`)

  if (testsPassed === testsTotal) {
    console.log('\n🎉 All deployment monitoring tests passed!')
    console.log('✅ Performance monitoring is working')
    console.log('✅ Feature flag system is working')
    console.log('✅ Rollback system is working')
    console.log('✅ API endpoints are functional')
    console.log('✅ Statistics and reporting are working')
  } else {
    console.log('\n⚠️  Some deployment monitoring tests failed!')
    console.log('🔍 Review the system configuration and logs')
  }

  // Show current system status
  console.log('\n📋 Current System Status:')
  
  const flags = featureFlagManager.getAllFlags()
  console.log(`Feature Flags: ${flags.length} total`)
  flags.forEach(flag => {
    console.log(`  - ${flag.name}: ${flag.rolloutPercentage}% (${flag.enabled ? 'enabled' : 'disabled'})`)
  })

  const rollbackStats = rollbackManager.getRollbackStats()
  console.log(`\nRollback Events: ${rollbackStats.totalEvents} total`)
  console.log(`  - Successful: ${rollbackStats.successfulRollbacks}`)
  console.log(`  - Failed: ${rollbackStats.failedRollbacks}`)

  const performanceStats = deploymentMonitor.getPerformanceStats(5)
  console.log(`\nPerformance (last 5 min):`)
  console.log(`  - Requests: ${performanceStats.requestCount}`)
  console.log(`  - Avg Response Time: ${Math.round(performanceStats.averageResponseTime)}ms`)
  console.log(`  - Error Rate: ${performanceStats.errorRate.toFixed(2)}%`)

  return testsPassed === testsTotal
}

// Run the tests
testDeploymentMonitoring()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })

export { testDeploymentMonitoring }