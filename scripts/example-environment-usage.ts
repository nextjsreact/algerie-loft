#!/usr/bin/env tsx

/**
 * Example: How to use the Environment Management System safely
 * 
 * This script demonstrates the correct way to use the environment management
 * system while ensuring production safety.
 */

import { 
  EnvironmentConfigManager,
  EnvironmentValidator,
  ProductionSafetyGuard,
  Environment,
  EnvironmentConfig
} from '../lib/environment-management'

async function demonstrateEnvironmentManagement() {
  console.log('🔧 Environment Management System Demo\n')

  const configManager = new EnvironmentConfigManager()
  const validator = new EnvironmentValidator()
  const safetyGuard = ProductionSafetyGuard.getInstance()

  try {
    // 1. List available environments
    console.log('📋 Available environments:')
    const availableEnvs = await configManager.listAvailableEnvironments()
    availableEnvs.forEach(env => {
      console.log(`  - ${env}`)
    })
    console.log()

    // 2. Create a test environment configuration (SAFE)
    console.log('🔨 Creating test environment configuration...')
    const testConfig: Partial<EnvironmentConfig> = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-example',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key-example',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      ANONYMIZE_DATA: true,
      INCLUDE_AUDIT_LOGS: true
    }

    try {
      const createdConfig = await configManager.createEnvironmentConfig('test', testConfig)
      console.log('✅ Test environment configuration created successfully')
    } catch (error) {
      console.log(`ℹ️  Test config creation: ${error.message}`)
    }

    // 3. Try to create production configuration (SHOULD FAIL)
    console.log('\n🚫 Attempting to create production configuration (should fail)...')
    try {
      await configManager.createEnvironmentConfig('production', testConfig)
      console.log('❌ ERROR: Production configuration was created (this should not happen!)')
    } catch (error) {
      console.log('✅ Production configuration creation blocked:', error.message)
    }

    // 4. Create and validate environments
    console.log('\n🏗️  Creating environment objects...')
    
    // Create a test environment
    const testEnv: Environment = {
      id: 'demo-test-env',
      name: 'Demo Test Environment',
      type: 'test',
      supabaseUrl: 'https://test-project.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceKey: 'test-service-key',
      status: 'active',
      isProduction: false,
      allowWrites: true,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    // Validate test environment
    const testValidation = await validator.validateEnvironment(testEnv)
    console.log(`Test environment validation: ${testValidation.isValid ? '✅ Valid' : '❌ Invalid'}`)
    if (testValidation.errors.length > 0) {
      console.log('  Errors:', testValidation.errors)
    }

    // 5. Demonstrate production environment (read-only)
    console.log('\n🏭 Creating production environment (read-only)...')
    const prodEnv: Environment = {
      id: 'demo-prod-env',
      name: 'Demo Production Environment',
      type: 'production',
      supabaseUrl: 'https://prod-project.supabase.co',
      supabaseAnonKey: 'prod-anon-key',
      supabaseServiceKey: 'prod-service-key',
      status: 'read_only',
      isProduction: true,
      allowWrites: false, // CRITICAL: Production must be read-only
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    const prodValidation = await validator.validateEnvironment(prodEnv)
    console.log(`Production environment validation: ${prodValidation.isValid ? '✅ Valid' : '❌ Invalid'}`)

    // 6. Test write access validation
    console.log('\n✍️  Testing write access validation...')
    
    // Test environment should allow writes
    try {
      await validator.validateWriteAccess(testEnv, 'demo-write-operation')
      console.log('✅ Test environment allows writes')
    } catch (error) {
      console.log('❌ Test environment write validation failed:', error.message)
    }

    // Production environment should block writes
    try {
      await validator.validateWriteAccess(prodEnv, 'demo-write-operation')
      console.log('❌ ERROR: Production environment allowed writes (this should not happen!)')
    } catch (error) {
      console.log('✅ Production environment blocks writes:', error.message)
    }

    // 7. Test clone operation validation
    console.log('\n📋 Testing clone operation validation...')
    const cloneValidation = await validator.validateCloneOperation(prodEnv, testEnv)
    console.log(`Clone validation (prod → test): ${cloneValidation.sourceValid && cloneValidation.targetValid ? '✅ Valid' : '❌ Invalid'}`)
    if (cloneValidation.errors.length > 0) {
      console.log('  Errors:', cloneValidation.errors)
    }

    // 8. Test invalid clone (should fail)
    console.log('\n🚫 Testing invalid clone operation (test → prod, should fail)...')
    const invalidCloneValidation = await validator.validateCloneOperation(testEnv, prodEnv)
    console.log(`Invalid clone validation (test → prod): ${invalidCloneValidation.sourceValid && invalidCloneValidation.targetValid ? '❌ Allowed (ERROR!)' : '✅ Blocked'}`)
    if (invalidCloneValidation.errors.length > 0) {
      console.log('  Blocked reasons:', invalidCloneValidation.errors)
    }

    // 9. Show security alerts
    console.log('\n🔔 Recent security alerts:')
    const alerts = safetyGuard.getSecurityAlerts(3)
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        console.log(`  ${alert.level.toUpperCase()}: ${alert.message}`)
      })
    } else {
      console.log('  No recent alerts')
    }

    console.log('\n🎉 Environment management demo completed successfully!')
    console.log('\n📋 Summary of safety features demonstrated:')
    console.log('  ✅ Production configuration creation blocked')
    console.log('  ✅ Production write operations blocked')
    console.log('  ✅ Invalid clone operations blocked')
    console.log('  ✅ Environment validation working')
    console.log('  ✅ Security alerts generated')

  } catch (error) {
    console.error('❌ Demo failed:', error)
    throw error
  }
}

// Run the demo
demonstrateEnvironmentManagement()
  .then(() => {
    console.log('\n✅ Demo completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  })

export { demonstrateEnvironmentManagement }