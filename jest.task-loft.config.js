/**
 * Jest configuration for Task-Loft Association tests
 * Specialized configuration for testing the loft association functionality
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'Task-Loft Association Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Test file patterns specific to task-loft functionality
  testMatch: [
    '**/__tests__/**/*task-loft*.test.{js,ts,tsx}',
    '**/__tests__/**/task-form-loft.test.{js,ts,tsx}',
    '**/__tests__/**/task-loft-endpoints.test.{js,ts,tsx}'
  ],
  
  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/actions/tasks.ts',
    'components/forms/task-form.tsx',
    'components/tasks/modern-tasks-page.tsx',
    'app/api/tasks/**/*.ts',
    'app/api/lofts/selection/route.ts',
    'lib/services/loft.ts',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/task-loft-association',
  
  // Test timeout
  testTimeout: 30000,
  
  // Setup files
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@babel))'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js'
}

// Create and export the Jest configuration
module.exports = createJestConfig(customJestConfig)