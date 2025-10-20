#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Running Contact Forms Test Suite\n')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function runCommand(command, description) {
  console.log(`${colors.blue}${colors.bold}${description}${colors.reset}`)
  console.log(`${colors.yellow}Running: ${command}${colors.reset}\n`)
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log(`${colors.green}✅ ${description} completed successfully${colors.reset}\n`)
    return true
  } catch (error) {
    console.log(`${colors.red}❌ ${description} failed${colors.reset}\n`)
    return false
  }
}

async function main() {
  const results = []
  
  // 1. Run unit tests for form components
  results.push(runCommand(
    'npm run test -- --config=jest.forms.config.js --coverage',
    '1. Unit Tests - Form Components & API Routes'
  ))
  
  // 2. Run form validation tests
  results.push(runCommand(
    'npm run test -- __tests__/forms/ --verbose',
    '2. Form Validation Tests'
  ))
  
  // 3. Run API endpoint tests
  results.push(runCommand(
    'npm run test -- __tests__/api/ --verbose',
    '3. API Endpoint Tests'
  ))
  
  // 4. Run E2E tests for forms
  results.push(runCommand(
    'npx playwright test tests/e2e/contact-forms.spec.ts',
    '4. End-to-End Form Tests'
  ))
  
  // 5. Test email notification system (mock)
  results.push(runCommand(
    'node scripts/test-email-notifications.js',
    '5. Email Notification System Test'
  ))
  
  // Summary
  console.log(`${colors.bold}📊 Test Results Summary${colors.reset}`)
  console.log('=' * 50)
  
  const passed = results.filter(Boolean).length
  const total = results.length
  
  results.forEach((result, index) => {
    const status = result ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`
    const testNames = [
      'Unit Tests - Form Components & API Routes',
      'Form Validation Tests', 
      'API Endpoint Tests',
      'End-to-End Form Tests',
      'Email Notification System Test'
    ]
    console.log(`${index + 1}. ${testNames[index]}: ${status}`)
  })
  
  console.log('\n' + '=' * 50)
  console.log(`${colors.bold}Overall: ${passed}/${total} tests passed${colors.reset}`)
  
  if (passed === total) {
    console.log(`${colors.green}${colors.bold}🎉 All form tests passed! Contact forms are ready for production.${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  Some tests failed. Please review and fix issues before deployment.${colors.reset}`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error(`${colors.red}Error running test suite:${colors.reset}`, error)
  process.exit(1)
})