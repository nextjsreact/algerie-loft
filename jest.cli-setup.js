/**
 * Jest setup for CLI and Automation tests
 * 
 * This setup file is specifically for Node.js environment tests
 * and doesn't include browser-specific mocks.
 */

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Store original methods for restoration
global.originalConsole = {
  log: originalConsoleLog,
  error: originalConsoleError,
  warn: originalConsoleWarn
}

// Mock console methods by default (can be restored in individual tests)
console.log = jest.fn()
console.error = jest.fn()
console.warn = jest.fn()

// Mock process.exit to prevent tests from actually exiting
const originalProcessExit = process.exit
process.exit = jest.fn()

// Store original for restoration
global.originalProcessExit = originalProcessExit

// Mock setTimeout and setInterval for automation tests
jest.useFakeTimers()

// Global test utilities
global.testUtils = {
  restoreConsole: () => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  },
  
  mockConsole: () => {
    console.log = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
  },
  
  restoreProcessExit: () => {
    process.exit = originalProcessExit
  },
  
  mockProcessExit: () => {
    process.exit = jest.fn()
  }
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})

// Global cleanup
afterAll(() => {
  // Restore original methods
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  process.exit = originalProcessExit
  
  jest.useRealTimers()
})