/**
 * Test Setup for Environment Cloner Integration Tests
 * 
 * Provides utilities and helpers for testing the environment cloning system
 */

import { Environment, CloneOptions } from '../../lib/environment-management/types'

/**
 * Create a mock production environment for testing
 */
export function createMockProductionEnvironment(): Environment {
  return {
    id: 'prod-env-001',
    name: 'Production Environment',
    type: 'production',
    supabaseUrl: 'https://production.supabase.co',
    supabaseAnonKey: 'prod-anon-key-12345',
    supabaseServiceKey: 'prod-service-key-12345',
    status: 'active',
    isProduction: true,
    allowWrites: false, // CRITICAL: Production is always read-only
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date(),
    description: 'Production environment - READ ONLY'
  }
}

/**
 * Create a mock test environment for testing
 */
export function createMockTestEnvironment(): Environment {
  return {
    id: 'test-env-001',
    name: 'Test Environment',
    type: 'test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key-12345',
    supabaseServiceKey: 'test-service-key-12345',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date(),
    description: 'Test environment for development and testing'
  }
}

/**
 * Create a mock training environment for testing
 */
export function createMockTrainingEnvironment(): Environment {
  return {
    id: 'training-env-001',
    name: 'Training Environment',
    type: 'training',
    supabaseUrl: 'https://training.supabase.co',
    supabaseAnonKey: 'training-anon-key-12345',
    supabaseServiceKey: 'training-service-key-12345',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date(),
    description: 'Training environment for user training sessions'
  }
}

/**
 * Create an invalid environment for error testing
 */
export function createInvalidEnvironment(): Environment {
  return {
    id: 'invalid-env-001',
    name: 'Invalid Environment',
    type: 'test',
    supabaseUrl: 'https://invalid-url.supabase.co',
    supabaseAnonKey: '',
    supabaseServiceKey: 'invalid-key',
    status: 'error',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date(),
    description: 'Invalid environment for error testing'
  }
}

/**
 * Create default clone options for testing
 */
export function createDefaultCloneOptions(): CloneOptions {
  return {
    anonymizeData: true,
    includeAuditLogs: true,
    includeConversations: true,
    includeReservations: true,
    preserveUserRoles: false,
    createBackup: true,
    validateAfterClone: true,
    skipConfirmation: true // Always skip confirmation in tests
  }
}

/**
 * Create minimal clone options for basic testing
 */
export function createMinimalCloneOptions(): CloneOptions {
  return {
    anonymizeData: false,
    includeAuditLogs: false,
    includeConversations: false,
    includeReservations: false,
    preserveUserRoles: false,
    createBackup: false,
    validateAfterClone: false,
    skipConfirmation: true
  }
}

/**
 * Create maximal clone options for comprehensive testing
 */
export function createMaximalCloneOptions(): CloneOptions {
  return {
    anonymizeData: true,
    includeAuditLogs: true,
    includeConversations: true,
    includeReservations: true,
    preserveUserRoles: true,
    createBackup: true,
    validateAfterClone: true,
    skipConfirmation: true,
    customAnonymizationRules: [
      { tableName: 'users', columnName: 'email', anonymizationType: 'email' },
      { tableName: 'users', columnName: 'name', anonymizationType: 'name' },
      { tableName: 'users', columnName: 'phone', anonymizationType: 'phone' },
      { tableName: 'reservations', columnName: 'guest_name', anonymizationType: 'name' },
      { tableName: 'reservations', columnName: 'guest_email', anonymizationType: 'email' }
    ]
  }
}

/**
 * Validate clone result structure
 */
export function validateCloneResult(result: any): boolean {
  const requiredFields = [
    'success',
    'operationId',
    'sourceEnvironment',
    'targetEnvironment',
    'statistics',
    'errors',
    'warnings',
    'duration',
    'completedAt'
  ]

  return requiredFields.every(field => result.hasOwnProperty(field))
}

/**
 * Validate clone statistics structure
 */
export function validateCloneStatistics(statistics: any): boolean {
  const requiredFields = [
    'tablesCloned',
    'recordsCloned',
    'recordsAnonymized',
    'functionsCloned',
    'triggersCloned',
    'totalSizeCloned',
    'schemaChanges'
  ]

  return requiredFields.every(field => statistics.hasOwnProperty(field))
}

/**
 * Wait for operation to complete (for async testing)
 */
export async function waitForOperation(
  cloner: any,
  operationId: string,
  timeoutMs: number = 30000
): Promise<any> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeoutMs) {
    const operation = cloner.getOperationStatus(operationId)
    
    if (operation && ['completed', 'failed', 'cancelled'].includes(operation.status)) {
      return operation
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  throw new Error(`Operation ${operationId} did not complete within ${timeoutMs}ms`)
}

/**
 * Generate test data for large dataset scenarios
 */
export function generateLargeDatasetScenario() {
  return {
    expectedTables: 25,
    expectedRecords: 15000,
    expectedAnonymizedRecords: 8500,
    expectedFunctions: 8,
    expectedTriggers: 12,
    expectedSize: '150 MB'
  }
}

/**
 * Test helper to verify production safety
 */
export function verifyProductionSafety(environment: Environment): void {
  if (environment.type === 'production') {
    expect(environment.allowWrites).toBe(false)
    expect(environment.isProduction).toBe(true)
  }
}

/**
 * Test helper to verify operation logs contain required information
 */
export function verifyOperationLogs(logs: any[]): void {
  expect(logs.length).toBeGreaterThan(0)
  
  // Verify log structure
  logs.forEach(log => {
    expect(log).toHaveProperty('timestamp')
    expect(log).toHaveProperty('level')
    expect(log).toHaveProperty('component')
    expect(log).toHaveProperty('message')
    expect(log.timestamp).toBeInstanceOf(Date)
    expect(['info', 'warning', 'error'].includes(log.level)).toBe(true)
  })
  
  // Verify critical safety logs are present (more flexible check)
  const safetyLogs = logs.filter(log => 
    log.component === 'SafetyChecks' || 
    log.message.includes('safety') || 
    log.message.includes('Safety') ||
    log.message.includes('PRODUCTION')
  )
  expect(safetyLogs.length).toBeGreaterThan(0)
}

/**
 * Test helper to verify backup was created properly
 */
export function verifyBackupCreation(result: any, shouldHaveBackup: boolean): void {
  if (shouldHaveBackup) {
    expect(result.backupId).toBeDefined()
    expect(typeof result.backupId).toBe('string')
    expect(result.backupId.length).toBeGreaterThan(0)
  } else {
    expect(result.backupId).toBeUndefined()
  }
}

/**
 * Test helper to verify validation was performed
 */
export function verifyValidationPerformed(result: any, shouldHaveValidation: boolean): void {
  if (shouldHaveValidation) {
    expect(result.validationResult).toBeDefined()
  } else {
    expect(result.validationResult).toBeUndefined()
  }
}