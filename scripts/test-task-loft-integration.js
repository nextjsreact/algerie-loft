#!/usr/bin/env node

/**
 * Integration test script for Task-Loft Association
 * Validates the complete functionality from database to UI
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Starting Task-Loft Association Integration Tests...\n')

// Test configuration
const testConfig = {
  unit: {
    enabled: true,
    pattern: '__tests__/**/*task-loft*.test.{ts,tsx}',
    description: 'Unit and Integration Tests'
  },
  e2e: {
    enabled: true,
    pattern: 'tests/e2e/task-loft-association.spec.ts',
    description: 'End-to-End Tests'
  },
  api: {
    enabled: true,
    pattern: '__tests__/api/task-loft*.test.ts',
    description: 'API Integration Tests'
  }
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
}

function runCommand(command, description) {
  console.log(`📋 Running: ${description}`)
  console.log(`   Command: ${command}\n`)
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    })
    
    console.log('✅ PASSED\n')
    results.passed++
    results.details.push({ test: description, status: 'PASSED', output })
    
    return true
  } catch (error) {
    console.log('❌ FAILED')
    console.log(`Error: ${error.message}\n`)
    results.failed++
    results.details.push({ 
      test: description, 
      status: 'FAILED', 
      error: error.message,
      output: error.stdout || error.stderr 
    })
    
    return false
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n')
  
  // Check if test files exist
  const testFiles = [
    '__tests__/lib/task-loft-association.test.ts',
    '__tests__/components/task-form-loft.test.tsx',
    '__tests__/api/task-loft-endpoints.test.ts',
    'tests/e2e/task-loft-association.spec.ts'
  ]
  
  const missingFiles = testFiles.filter(file => !fs.existsSync(file))
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing test files:')
    missingFiles.forEach(file => console.log(`   - ${file}`))
    console.log('\nPlease ensure all test files are created before running integration tests.\n')
    return false
  }
  
  // Check if package.json has required test scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredScripts = ['test', 'test:e2e']
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script])
  
  if (missingScripts.length > 0) {
    console.log('⚠️  Missing package.json scripts:')
    missingScripts.forEach(script => console.log(`   - ${script}`))
    console.log('\nSome tests may not run properly.\n')
  }
  
  console.log('✅ Prerequisites check completed\n')
  return true
}

function runUnitTests() {
  if (!testConfig.unit.enabled) {
    console.log('⏭️  Unit tests skipped (disabled in config)\n')
    results.skipped++
    return
  }
  
  const success = runCommand(
    `npm test -- --testPathPattern="${testConfig.unit.pattern}" --verbose`,
    testConfig.unit.description
  )
  
  return success
}

function runApiTests() {
  if (!testConfig.api.enabled) {
    console.log('⏭️  API tests skipped (disabled in config)\n')
    results.skipped++
    return
  }
  
  const success = runCommand(
    `npm test -- --testPathPattern="${testConfig.api.pattern}" --verbose`,
    testConfig.api.description
  )
  
  return success
}

function runE2ETests() {
  if (!testConfig.e2e.enabled) {
    console.log('⏭️  E2E tests skipped (disabled in config)\n')
    results.skipped++
    return
  }
  
  // Check if Playwright is available
  try {
    execSync('npx playwright --version', { stdio: 'pipe' })
  } catch (error) {
    console.log('⚠️  Playwright not available, skipping E2E tests')
    console.log('   Run: npm install @playwright/test\n')
    results.skipped++
    return
  }
  
  const success = runCommand(
    `npx playwright test ${testConfig.e2e.pattern} --reporter=line`,
    testConfig.e2e.description
  )
  
  return success
}

function generateReport() {
  console.log('📊 Test Results Summary')
  console.log('========================\n')
  
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏭️  Skipped: ${results.skipped}`)
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}\n`)
  
  if (results.failed > 0) {
    console.log('❌ Failed Tests:')
    results.details
      .filter(detail => detail.status === 'FAILED')
      .forEach(detail => {
        console.log(`   - ${detail.test}`)
        console.log(`     Error: ${detail.error}`)
      })
    console.log()
  }
  
  // Generate detailed report file
  const reportPath = path.join(__dirname, '..', 'test-results', 'task-loft-integration-report.json')
  const reportDir = path.dirname(reportPath)
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      total: results.passed + results.failed + results.skipped
    },
    details: results.details,
    config: testConfig
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📄 Detailed report saved to: ${reportPath}\n`)
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.log('❌ Integration tests failed!')
    process.exit(1)
  } else {
    console.log('✅ All integration tests passed!')
    process.exit(0)
  }
}

// Main execution
async function main() {
  try {
    // Check prerequisites
    if (!checkPrerequisites()) {
      process.exit(1)
    }
    
    // Run test suites
    console.log('🚀 Starting test execution...\n')
    
    runUnitTests()
    runApiTests()
    runE2ETests()
    
    // Generate final report
    generateReport()
    
  } catch (error) {
    console.error('💥 Unexpected error during test execution:')
    console.error(error.message)
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Test execution interrupted by user')
  generateReport()
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test execution terminated')
  generateReport()
})

// Run the tests
main()