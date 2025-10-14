#!/usr/bin/env tsx

/**
 * Production Safety Test Script
 * 
 * Tests that production protection mechanisms work correctly
 * This script should be run to verify that production data is safe
 */

import { 
  ProductionSafetyGuard, 
  EnvironmentValidator, 
  EnvironmentConfigManager,
  Environment,
  EnvironmentConfig,
  ProductionAccessError
} from '../lib/environment-management'

async function testProductionSafety() {
  console.log('🔒 Testing Production Safety Mechanisms...\n')

  const safetyGuard = ProductionSafetyGuard.getInstance()
  const validator = new EnvironmentValidator()
  const configManager = new EnvironmentConfigManager()

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

  // Test 1: Production environment detection
  await runTest('Production environment detection', async () => {
    const prodEnv: Environment = {
      id: 'test-prod',
      name: 'Production Environment',
      type: 'production',
      supabaseUrl: 'https://prod-project.supabase.co',
      supabaseAnonKey: 'test-key',
      supabaseServiceKey: 'test-service-key',
      status: 'active',
      isProduction: true,
      allowWrites: false,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    const detectedType = safetyGuard.validateEnvironmentType(prodEnv)
    return detectedType === 'production'
  })

  // Test 2: Production write blocking
  await runTest('Production write operation blocking', async () => {
    const prodEnv: Environment = {
      id: 'test-prod',
      name: 'Production Environment',
      type: 'production',
      supabaseUrl: 'https://prod-project.supabase.co',
      supabaseAnonKey: 'test-key',
      supabaseServiceKey: 'test-service-key',
      status: 'active',
      isProduction: true,
      allowWrites: false,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    try {
      await safetyGuard.enforceReadOnlyAccess(prodEnv, 'test-write-operation')
      return false // Should have thrown an error
    } catch (error) {
      return error instanceof ProductionAccessError
    }
  })

  // Test 3: Production as clone target blocking
  await runTest('Production as clone target blocking', async () => {
    const prodEnv: Environment = {
      id: 'test-prod',
      name: 'Production Environment',
      type: 'production',
      supabaseUrl: 'https://prod-project.supabase.co',
      supabaseAnonKey: 'test-key',
      supabaseServiceKey: 'test-service-key',
      status: 'active',
      isProduction: true,
      allowWrites: false,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    try {
      await safetyGuard.validateCloneTarget(prodEnv)
      return false // Should have thrown an error
    } catch (error) {
      return error instanceof ProductionAccessError
    }
  })

  // Test 4: Production as clone source validation
  await runTest('Production as clone source validation', async () => {
    const prodEnv: Environment = {
      id: 'test-prod',
      name: 'Production Environment',
      type: 'production',
      supabaseUrl: 'https://prod-project.supabase.co',
      supabaseAnonKey: 'test-key',
      supabaseServiceKey: 'test-service-key',
      status: 'read_only',
      isProduction: true,
      allowWrites: false, // This is required for production source
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    try {
      await safetyGuard.validateCloneSource(prodEnv)
      return true // Should succeed with proper configuration
    } catch (error) {
      return false
    }
  })

  // Test 5: Environment validation
  await runTest('Environment validation', async () => {
    const testEnv: Environment = {
      id: 'test-env',
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

    const validation = await validator.validateEnvironment(testEnv)
    return validation.isValid && !validation.isProduction
  })

  // Test 6: Configuration validation
  await runTest('Configuration validation', async () => {
    const testConfig: EnvironmentConfig = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
      ENVIRONMENT_TYPE: 'test',
      IS_PRODUCTION: false,
      ALLOW_WRITES: true
    }

    const validation = validator.validateEnvironmentConfig(testConfig)
    return validation.isValid && !validation.isProduction
  })

  // Test 7: Production configuration protection
  await runTest('Production configuration protection', async () => {
    try {
      const testConfig: EnvironmentConfig = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'production',
        ENVIRONMENT_TYPE: 'production',
        IS_PRODUCTION: true,
        ALLOW_WRITES: false
      }

      await configManager.saveEnvironmentConfig('production', testConfig)
      return false // Should have thrown an error
    } catch (error) {
      return error.message.includes('PRODUCTION PROTECTION')
    }
  })

  // Test 8: Safety configuration validation
  await runTest('Safety configuration validation', async () => {
    return safetyGuard.validateSafetyConfig()
  })

  // Test 9: Clone operation validation
  await runTest('Clone operation validation', async () => {
    const sourceEnv: Environment = {
      id: 'prod-source',
      name: 'Production Source',
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

    const targetEnv: Environment = {
      id: 'test-target',
      name: 'Test Target',
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

    const validation = await validator.validateCloneOperation(sourceEnv, targetEnv)
    return validation.sourceValid && validation.targetValid && validation.errors.length === 0
  })

  // Test 10: Security alerts
  await runTest('Security alerts generation', async () => {
    const alertsBefore = safetyGuard.getSecurityAlerts().length
    
    // Trigger a security alert by attempting production write
    const prodEnv: Environment = {
      id: 'test-prod-alert',
      name: 'Production Environment',
      type: 'production',
      supabaseUrl: 'https://prod-project.supabase.co',
      supabaseAnonKey: 'test-key',
      supabaseServiceKey: 'test-service-key',
      status: 'active',
      isProduction: true,
      allowWrites: false,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    try {
      await safetyGuard.enforceReadOnlyAccess(prodEnv, 'test-alert-operation')
    } catch (error) {
      // Expected error
    }

    const alertsAfter = safetyGuard.getSecurityAlerts().length
    return alertsAfter > alertsBefore
  })

  // Summary
  console.log('\n📊 Test Results:')
  console.log(`✅ Passed: ${testsPassed}/${testsTotal}`)
  console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`)

  if (testsPassed === testsTotal) {
    console.log('\n🎉 All production safety tests passed!')
    console.log('✅ Production environment is PROTECTED')
    console.log('✅ Write operations to production are BLOCKED')
    console.log('✅ Clone operations are VALIDATED')
    console.log('✅ Configuration changes to production are PREVENTED')
  } else {
    console.log('\n⚠️  Some production safety tests failed!')
    console.log('🚨 REVIEW SECURITY CONFIGURATION BEFORE PROCEEDING')
  }

  // Show recent security alerts
  const recentAlerts = safetyGuard.getSecurityAlerts(5)
  if (recentAlerts.length > 0) {
    console.log('\n🔔 Recent Security Alerts:')
    recentAlerts.forEach(alert => {
      console.log(`  ${alert.level.toUpperCase()}: ${alert.message} (${alert.timestamp.toISOString()})`)
    })
  }

  return testsPassed === testsTotal
}

// Run the tests
testProductionSafety()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })

export { testProductionSafety }