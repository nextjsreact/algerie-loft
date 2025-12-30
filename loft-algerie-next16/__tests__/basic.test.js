/**
 * Basic test to validate Jest configuration
 */

describe('Basic Jest Configuration', () => {
  test('Jest is working correctly', () => {
    expect(true).toBe(true)
  })

  test('Environment is configured', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})