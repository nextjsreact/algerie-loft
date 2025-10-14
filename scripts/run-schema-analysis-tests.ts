#!/usr/bin/env tsx
/**
 * Schema Analysis Integration Test Runner
 * 
 * Runs integration tests for schema analysis components
 * with proper environment setup and cleanup
 */

import { execSync } from 'child_process'
import { resolve } from 'path'

interface TestConfig {
  testFile: string
  description: string
  timeout: number
  requiresDatabase: boolean
}

const TEST_CONFIGS: TestConfig[] = [
  {
    testFile: '__tests__/integration/schema-analysis-mock.test.ts',
    description: 'Schema Analysis with Mocked Data',
    timeout: 30000,
    requiresDatabase: false
  },
  {
    testFile: '__tests__/integration/schema-analysis-integration.test.ts',
    description: 'Schema Analysis with Real Database',
    timeout: 60000,
    requiresDatabase: true
  }
]

class TestRunner {
  private testResults: Map<string, { success: boolean; duration: number; error?: string }> = new Map()

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Schema Analysis Integration Tests')
    console.log('=' .repeat(60))

    for (const config of TEST_CONFIGS) {
      await this.runTest(config)
    }

    this.printSummary()
  }

  private async runTest(config: TestConfig): Promise<void> {
    console.log(`\n📋 Running: ${config.description}`)
    console.log('-'.repeat(40))

    if (config.requiresDatabase && !this.checkDatabaseAvailability()) {
      console.log('⚠️  Skipping database-dependent test (no database available)')
      this.testResults.set(config.testFile, { 
        success: true, 
        duration: 0, 
        error: 'Skipped - no database' 
      })
      return
    }

    const startTime = Date.now()

    try {
      // Run the specific test file
      const command = `npx jest ${config.testFile} --config=jest.integration.config.js --verbose --runInBand`
      
      console.log(`Executing: ${command}`)
      
      execSync(command, {
        stdio: 'inherit',
        cwd: resolve(process.cwd()),
        timeout: config.timeout,
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      })

      const duration = Date.now() - startTime
      this.testResults.set(config.testFile, { success: true, duration })
      
      console.log(`✅ Test completed successfully in ${duration}ms`)

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.testResults.set(config.testFile, { 
        success: false, 
        duration, 
        error: errorMessage 
      })
      
      console.log(`❌ Test failed after ${duration}ms`)
      console.log(`Error: ${errorMessage}`)
    }
  }

  private checkDatabaseAvailability(): boolean {
    // Check if test database environment variables are set
    const requiredEnvVars = [
      'TEST_SOURCE_SUPABASE_URL',
      'TEST_SOURCE_SUPABASE_SERVICE_KEY',
      'TEST_TARGET_SUPABASE_URL',
      'TEST_TARGET_SUPABASE_SERVICE_KEY'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.log(`Missing environment variables: ${missingVars.join(', ')}`)
      return false
    }

    return true
  }

  private printSummary(): void {
    console.log('\n📊 TEST SUMMARY')
    console.log('=' .repeat(60))

    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    let skippedTests = 0
    let totalDuration = 0

    for (const [testFile, result] of this.testResults) {
      totalTests++
      totalDuration += result.duration

      if (result.error === 'Skipped - no database') {
        skippedTests++
        console.log(`⏭️  ${testFile}: SKIPPED`)
      } else if (result.success) {
        passedTests++
        console.log(`✅ ${testFile}: PASSED (${result.duration}ms)`)
      } else {
        failedTests++
        console.log(`❌ ${testFile}: FAILED (${result.duration}ms)`)
        if (result.error) {
          console.log(`   Error: ${result.error}`)
        }
      }
    }

    console.log('\n📈 STATISTICS:')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log(`Skipped: ${skippedTests}`)
    console.log(`Total Duration: ${totalDuration}ms`)

    if (failedTests > 0) {
      console.log('\n❌ Some tests failed. Check the output above for details.')
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed successfully!')
    }
  }
}

// Environment setup
function setupTestEnvironment(): void {
  console.log('🔧 Setting up test environment...')

  // Set default test environment variables if not provided
  if (!process.env.TEST_SOURCE_SUPABASE_URL) {
    process.env.TEST_SOURCE_SUPABASE_URL = 'http://localhost:54321'
  }
  if (!process.env.TEST_SOURCE_SUPABASE_SERVICE_KEY) {
    process.env.TEST_SOURCE_SUPABASE_SERVICE_KEY = 'test-service-key'
  }
  if (!process.env.TEST_TARGET_SUPABASE_URL) {
    process.env.TEST_TARGET_SUPABASE_URL = 'http://localhost:54321'
  }
  if (!process.env.TEST_TARGET_SUPABASE_SERVICE_KEY) {
    process.env.TEST_TARGET_SUPABASE_SERVICE_KEY = 'test-service-key'
  }

  console.log('✅ Test environment configured')
}

// Main execution
async function main() {
  try {
    setupTestEnvironment()
    
    const runner = new TestRunner()
    await runner.runAllTests()
    
  } catch (error) {
    console.error('💥 Test runner failed:', error)
    process.exit(1)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Schema Analysis Integration Test Runner

Usage: tsx scripts/run-schema-analysis-tests.ts [options]

Options:
  --help, -h     Show this help message

Environment Variables:
  TEST_SOURCE_SUPABASE_URL          Source test database URL
  TEST_SOURCE_SUPABASE_SERVICE_KEY  Source test database service key
  TEST_TARGET_SUPABASE_URL          Target test database URL
  TEST_TARGET_SUPABASE_SERVICE_KEY  Target test database service key

Examples:
  # Run all tests
  tsx scripts/run-schema-analysis-tests.ts

  # Run with custom database
  TEST_SOURCE_SUPABASE_URL=https://your-test-db.supabase.co \\
  TEST_SOURCE_SUPABASE_SERVICE_KEY=your-key \\
  tsx scripts/run-schema-analysis-tests.ts
`)
  process.exit(0)
}

main().catch(console.error)