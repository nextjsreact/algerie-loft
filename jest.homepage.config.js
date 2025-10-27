import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

// Specialized Jest config for homepage testing
const homepageJestConfig = {
  displayName: 'Homepage Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.homepage.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  
  // Focus on homepage-related tests
  testMatch: [
    '**/__tests__/**/homepage/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/__tests__/**/dual-audience-homepage-integration*.(test|spec).(js|jsx|ts|tsx)',
  ],
  
  // Exclude e2e tests (they use Playwright)
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/e2e/',
  ],
  
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  collectCoverageFrom: [
    'components/homepage/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/homepage',
  
  // Performance settings for homepage tests
  testTimeout: 10000,
  
  transformIgnorePatterns: [
    'node_modules/(?!(next-intl|use-intl|@faker-js)/)',
  ],
  
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Collect coverage for homepage components
  collectCoverage: false, // Disable by default, enable with --coverage flag
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

export default createJestConfig(homepageJestConfig)