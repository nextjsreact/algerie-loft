#!/usr/bin/env node

/**
 * Comprehensive Homepage Testing Script
 * Runs all homepage-related tests including unit, integration, and e2e tests
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan')
  log(`  ${title}`, 'bright')
  log('='.repeat(60), 'cyan')
}

function logSubsection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue')
  log(`  ${title}`, 'blue')
  log(`${'-'.repeat(40)}`, 'blue')
}

function runCommand(command, options = {}) {
  log(`Running: ${command}`, 'yellow')
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    })
    return { success: true, result }
  } catch (error) {
    log(`Error running command: ${error.message}`, 'red')
    return { success: false, error }
  }
}

async function runAsyncCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, 'yellow')
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, code })
      } else {
        reject({ success: false, code })
      }
    })
    
    child.on('error', (error) => {
      reject({ success: false, error })
    })
  })
}

function checkPrerequisites() {
  logSection('Checking Prerequisites')
  
  // Check if required files exist
  const requiredFiles = [
    'components/homepage/DualAudienceHomepage.tsx',
    '__tests__/components/homepage/DualAudienceHomepage.test.tsx',
    '__tests__/integration/dual-audience-homepage-integration.test.tsx',
    '__tests__/e2e/dual-audience-homepage-e2e.test.tsx',
    'jest.homepage.config.js',
    'jest.homepage.setup.js'
  ]
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))
  
  if (missingFiles.length > 0) {
    log('Missing required files:', 'red')
    missingFiles.forEach(file => log(`  - ${file}`, 'red'))
    return false
  }
  
  log('All required files present ✓', 'green')
  
  // Check if dependencies are installed
  try {
    execSync('npm list @testing-library/react @testing-library/jest-dom', { stdio: 'ignore' })
    log('Testing dependencies installed ✓', 'green')
  } catch (error) {
    log('Missing testing dependencies. Installing...', 'yellow')
    runCommand('npm install @testing-library/react @testing-library/jest-dom @testing-library/user-event')
  }
  
  return true
}

function runUnitTests() {
  logSection('Running Unit Tests')
  
  const result = runCommand('npx jest --config=jest.homepage.config.js --testPathPattern="components/homepage"')
  
  if (result.success) {
    log('Unit tests passed ✓', 'green')
  } else {
    log('Unit tests failed ✗', 'red')
  }
  
  return result.success
}

function runIntegrationTests() {
  logSection('Running Integration Tests')
  
  const result = runCommand('npx jest --config=jest.homepage.config.js --testPathPattern="integration/dual-audience-homepage"')
  
  if (result.success) {
    log('Integration tests passed ✓', 'green')
  } else {
    log('Integration tests failed ✗', 'red')
  }
  
  return result.success
}

async function runE2ETests() {
  logSection('Running End-to-End Tests')
  
  try {
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'ignore' })
    } catch (error) {
      log('Playwright not found. Installing...', 'yellow')
      runCommand('npx playwright install')
    }
    
    // Start development server in background
    log('Starting development server...', 'yellow')
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: true
    })
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    try {
      // Run E2E tests
      await runAsyncCommand('npx', ['playwright', 'test', '__tests__/e2e/dual-audience-homepage-e2e.test.tsx'])
      log('E2E tests passed ✓', 'green')
      return true
    } catch (error) {
      log('E2E tests failed ✗', 'red')
      return false
    } finally {
      // Kill server process
      if (serverProcess.pid) {
        try {
          process.kill(-serverProcess.pid, 'SIGTERM')
        } catch (error) {
          // Ignore errors when killing process
        }
      }
    }
  } catch (error) {
    log(`E2E test setup failed: ${error.message}`, 'red')
    return false
  }
}

function generateCoverageReport() {
  logSection('Generating Coverage Report')
  
  const result = runCommand('npx jest --config=jest.homepage.config.js --coverage --coverageReporters=text --coverageReporters=html')
  
  if (result.success) {
    log('Coverage report generated ✓', 'green')
    log('HTML report available at: coverage/homepage/lcov-report/index.html', 'cyan')
  } else {
    log('Coverage report generation failed ✗', 'red')
  }
  
  return result.success
}

function runLinting() {
  logSection('Running Linting')
  
  const result = runCommand('npx eslint components/homepage/ __tests__/**/homepage/ __tests__/**/dual-audience-homepage*')
  
  if (result.success) {
    log('Linting passed ✓', 'green')
  } else {
    log('Linting failed ✗', 'red')
  }
  
  return result.success
}

function runTypeChecking() {
  logSection('Running Type Checking')
  
  const result = runCommand('npx tsc --noEmit --project .')
  
  if (result.success) {
    log('Type checking passed ✓', 'green')
  } else {
    log('Type checking failed ✗', 'red')
  }
  
  return result.success
}

function generateTestReport(results) {
  logSection('Test Summary Report')
  
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(Boolean).length,
      failed: Object.values(results).filter(result => !result).length
    }
  }
  
  // Display summary
  log(`Total test suites: ${report.summary.total}`, 'bright')
  log(`Passed: ${report.summary.passed}`, 'green')
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green')
  
  // Display detailed results
  Object.entries(results).forEach(([testType, passed]) => {
    const status = passed ? '✓' : '✗'
    const color = passed ? 'green' : 'red'
    log(`  ${testType}: ${status}`, color)
  })
  
  // Save report to file
  const reportPath = 'test-results/homepage-test-report.json'
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log(`\nDetailed report saved to: ${reportPath}`, 'cyan')
  
  return report.summary.failed === 0
}

async function main() {
  log('🏠 Dual-Audience Homepage Comprehensive Testing Suite', 'bright')
  log('====================================================', 'bright')
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('Prerequisites check failed. Exiting.', 'red')
    process.exit(1)
  }
  
  const results = {}
  
  // Run all test types
  try {
    results.linting = runLinting()
    results.typeChecking = runTypeChecking()
    results.unitTests = runUnitTests()
    results.integrationTests = runIntegrationTests()
    results.coverage = generateCoverageReport()
    
    // E2E tests (optional, can be skipped in CI)
    if (process.argv.includes('--include-e2e')) {
      results.e2eTests = await runE2ETests()
    } else {
      log('\nSkipping E2E tests (use --include-e2e to run them)', 'yellow')
    }
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'red')
    process.exit(1)
  }
  
  // Generate final report
  const allPassed = generateTestReport(results)
  
  if (allPassed) {
    log('\n🎉 All tests passed! Homepage is ready for production.', 'green')
    process.exit(0)
  } else {
    log('\n❌ Some tests failed. Please review and fix issues.', 'red')
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Dual-Audience Homepage Testing Suite

Usage: node scripts/test-homepage-comprehensive.js [options]

Options:
  --include-e2e    Include end-to-end tests (requires dev server)
  --help, -h       Show this help message

Test Types:
  - Linting: ESLint checks for code quality
  - Type Checking: TypeScript compilation checks
  - Unit Tests: Component-level testing
  - Integration Tests: Cross-component interaction testing
  - Coverage: Code coverage analysis
  - E2E Tests: Full browser testing (optional)

Reports:
  - Console output with colored results
  - HTML coverage report in coverage/homepage/
  - JSON test report in test-results/homepage-test-report.json
`)
  process.exit(0)
}

// Run the main function
main().catch(error => {
  log(`Unexpected error: ${error.message}`, 'red')
  process.exit(1)
})