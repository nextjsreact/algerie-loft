/**
 * Environment Switching Example
 * 
 * Demonstrates how to use the environment switching system
 * with automatic .env file management and service restart.
 */

import { EnvironmentSwitcher } from '../core/environment-switcher'
import { ConfigurationManager } from '../core/configuration-manager'
import { EnvironmentStatusDisplay } from '../core/environment-status-display'
import { logger } from '../../logger'

async function demonstrateEnvironmentSwitching() {
  console.log('🔄 Environment Switching System Demo')
  console.log('='.repeat(50))

  const switcher = new EnvironmentSwitcher()
  const configManager = new ConfigurationManager()
  const statusDisplay = new EnvironmentStatusDisplay()

  try {
    // 1. Show current environment status
    console.log('\n1. Current Environment Status:')
    await statusDisplay.displayStatus()

    // 2. List all available environments
    console.log('\n2. Available Environments:')
    const environments = await configManager.listEnvironments()
    environments.forEach(env => {
      console.log(`   • ${env.type}: ${env.name}`)
    })

    // 3. Demonstrate switching to development environment
    console.log('\n3. Switching to Development Environment:')
    const devResult = await switcher.switchToDevelopment(true)
    
    if (devResult.success) {
      console.log('✅ Successfully switched to development')
      console.log(`   Duration: ${devResult.switchDuration}ms`)
      console.log(`   Services restarted: ${devResult.servicesRestarted}`)
      
      if (devResult.backupPath) {
        console.log(`   Backup created: ${devResult.backupPath}`)
      }
    } else {
      console.log('❌ Failed to switch to development:', devResult.error)
    }

    // 4. Show new environment status
    console.log('\n4. New Environment Status:')
    await statusDisplay.displayStatus()

    // 5. Demonstrate switching to test environment
    console.log('\n5. Switching to Test Environment:')
    const testResult = await switcher.switchToTest(true)
    
    if (testResult.success) {
      console.log('✅ Successfully switched to test')
      console.log(`   Previous environment: ${testResult.previousEnvironment}`)
      console.log(`   Current environment: ${testResult.currentEnvironment}`)
    } else {
      console.log('❌ Failed to switch to test:', testResult.error)
    }

    // 6. Show environment comparison
    console.log('\n6. Environment Comparison:')
    await statusDisplay.displayEnvironmentComparison()

    // 7. Show service status
    console.log('\n7. Service Status:')
    await statusDisplay.displayServiceStatus()

    // 8. Demonstrate rollback functionality
    console.log('\n8. Rollback to Previous Environment:')
    const rollbackResult = await switcher.rollbackToPrevious()
    
    if (rollbackResult.success) {
      console.log('✅ Successfully rolled back')
      console.log(`   Restored environment: ${rollbackResult.currentEnvironment}`)
    } else {
      console.log('❌ Rollback failed:', rollbackResult.error)
    }

    console.log('\n✅ Environment switching demonstration completed!')

  } catch (error) {
    console.error('❌ Demo failed:', error.message)
    logger.error('Environment switching demo error', { error: error.message })
  }
}

// Example of programmatic environment switching
async function programmaticSwitchingExample() {
  console.log('\n🔧 Programmatic Switching Example')
  console.log('='.repeat(50))

  const switcher = new EnvironmentSwitcher()

  try {
    // Switch with custom options
    const result = await switcher.switchEnvironment({
      targetEnvironment: 'development',
      backupCurrent: true,
      restartServices: true,
      confirmProduction: false,
      skipValidation: false
    })

    if (result.success) {
      console.log('✅ Programmatic switch successful')
      console.log('Result:', JSON.stringify(result, null, 2))
    } else {
      console.log('❌ Programmatic switch failed:', result.error)
    }

  } catch (error) {
    console.error('❌ Programmatic switch error:', error.message)
  }
}

// Example of environment status monitoring
async function statusMonitoringExample() {
  console.log('\n📊 Status Monitoring Example')
  console.log('='.repeat(50))

  const switcher = new EnvironmentSwitcher()

  try {
    // Get current status
    const status = await switcher.getCurrentStatus()
    console.log('Current Status:', JSON.stringify(status, null, 2))

    // List environments with status
    const environmentsWithStatus = await switcher.listEnvironmentsWithStatus()
    console.log('\nEnvironments with Status:')
    environmentsWithStatus.forEach(env => {
      console.log(`${env.type}: ${env.status.isHealthy ? '✅' : '❌'} ${env.status.isActive ? '(Active)' : ''}`)
    })

  } catch (error) {
    console.error('❌ Status monitoring error:', error.message)
  }
}

// Run the examples
async function runExamples() {
  try {
    await demonstrateEnvironmentSwitching()
    await programmaticSwitchingExample()
    await statusMonitoringExample()
  } catch (error) {
    console.error('❌ Examples failed:', error.message)
    process.exit(1)
  }
}

// Export for use in other modules
export {
  demonstrateEnvironmentSwitching,
  programmaticSwitchingExample,
  statusMonitoringExample,
  runExamples
}

// Run if called directly
if (require.main === module) {
  runExamples()
}