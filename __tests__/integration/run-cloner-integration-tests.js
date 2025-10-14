#!/usr/bin/env node

/**
 * Integration Test Runner for Environment Cloner
 * 
 * This script runs the environment cloner integration tests with proper setup
 * and provides detailed reporting of test results.
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🚀 Starting Environment Cloner Integration Tests...')
console.log('=' .repeat(60))

try {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.JEST_INTEGRATION = 'true'
  
  // Run the integration tests
  const testCommand = [
    'npx jest',
    '--config jest.integration.config.js',
    '--testPathPattern=environment-cloner-integration.test.ts',
    '--verbose',
    '--runInBand', // Run tests serially to avoid conflicts
    '--detectOpenHandles',
    '--forceExit'
  ].join(' ')
  
  console.log(`📋 Running command: ${testCommand}`)
  console.log('')
  
  execSync(testCommand, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('')
  console.log('✅ All integration tests passed!')
  console.log('=' .repeat(60))
  
} catch (error) {
  console.error('')
  console.error('❌ Integration tests failed!')
  console.error('Error:', error.message)
  console.error('=' .repeat(60))
  process.exit(1)
}