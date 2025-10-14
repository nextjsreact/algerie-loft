import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Specialized Jest config for CLI and Automation tests
const cliAutomationJestConfig = {
  displayName: 'CLI and Automation Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.cli-setup.js'],
  testEnvironment: 'node', // Use node environment for CLI tests
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/environment-management/cli/**/*.{js,jsx,ts,tsx}',
    'lib/environment-management/automation/**/*.{js,jsx,ts,tsx}',
    'lib/environment-management/core/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/lib/environment-management/cli.test.ts',
    '**/__tests__/lib/environment-management/automation.test.ts',
    '**/__tests__/lib/environment-management/environment-switching.test.ts',
    '**/__tests__/lib/environment-management/cli-automation-integration.test.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(next-intl|use-intl)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testTimeout: 30000, // 30 seconds timeout for CLI operations
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/cli-automation',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(cliAutomationJestConfig)