/**
 * Global teardown for Task-Loft Association tests
 * Cleans up after test execution
 */

module.exports = async () => {
  console.log('🧹 Cleaning up Task-Loft Association test environment...')
  
  // Clean up global test data
  delete global.testData
  
  // Restore console methods
  if (global.console.log.mockRestore) {
    global.console.log.mockRestore()
    global.console.debug.mockRestore()
    global.console.info.mockRestore()
    global.console.warn.mockRestore()
    global.console.error.mockRestore()
  }
  
  console.log('✅ Test environment cleanup complete')
}