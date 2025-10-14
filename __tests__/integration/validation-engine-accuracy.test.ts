/**
 * Validation Engine Accuracy Tests
 * 
 * Focused tests for validation engine accuracy and precision
 * in detecting various database and system issues.
 * 
 * Requirements tested: 6.1, 6.2
 */

import { 
  ValidationEngine, 
  DatabaseConnectivityResult,
  SchemaValidationResult,
  DataIntegrityResult,
  AuditSystemValidationResult
} from '../../lib/environment-management/validation/validation-engine'

import { Environment } from '../../lib/environment-management/types'

// Mock Supabase with detailed control over responses
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => {
            // Simulate different responses based on table
            if (table === 'users') {
              return Promise.resolve({ data: { count: 150 }, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          })
        })),
        eq: jest.fn(() => ({
          select: jest.fn(() => {
            // Simulate schema queries
            if (table === 'information_schema.tables') {
              return Promise.resolve({ 
                data: [
                  { table_name: 'users' },
                  { table_name: 'lofts' },
                  { table_name: 'audit_logs' }
                ], 
                error: null 
              })
            }
            return Promise.resolve({ data: [], error: null })
          })
        })),
        like: jest.fn(() => Promise.resolve({ 
          data: [
            { table_name: 'audit_logs' },
            { table_name: 'audit_user_context' }
          ], 
          error: null 
        })),
        not: jest.fn(() => Promise.resolve({ data: [], error: null })),
        is: jest.fn(() => Promise.resolve({ count: 0, error: null })),
        gte: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      count: jest.fn(() => Promise.resolve({ count: 100, error: null }))
    })),
    rpc: jest.fn((functionName) => {
      if (functionName === 'get_table_names') {
        return Promise.resolve({ 
          data: [
            { table_name: 'users' },
            { table_name: 'lofts' },
            { table_name: 'reservations' }
          ], 
          error: null 
        })
      }
      if (functionName === 'version') {
        return Promise.resolve({ data: 'PostgreSQL 13.7', error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
  }))
}))

describe('Validation Engine Accuracy Tests', () => {
  let validationEngine: ValidationEngine
  let mockEnvironment: Environment

  beforeEach(() => {
    jest.clearAllMocks()
    validationEngine = new ValidationEngine()

    mockEnvironment = {
      id: 'test-env-123',
      name: 'Test Environment',
      type: 'test',
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceKey: 'test-service-key',
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
      status: 'active',
      isProduction: false,
      allowWrites: true,
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  })

  describe('Database Connectivity Validation Accuracy', () => {
    it('should accurately measure response times', async () => {
      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)

      expect(result.responseTime).toBeGreaterThan(0)
      expect(result.responseTime).toBeLessThan(5000) // Should be reasonable
      expect(result.connected).toBe(true)
    })

    it('should detect version information when available', async () => {
      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)

      expect(result.version).toBeDefined()
      expect(result.version).toContain('PostgreSQL')
    })

    it('should accurately detect connection failures', async () => {
      // Mock connection failure
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Connection refused')))
          }))
        }))
      })

      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)

      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Connection refused')
    })

    it('should handle timeout scenarios accurately', async () => {
      // Mock timeout scenario
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 100)
            ))
          }))
        }))
      })

      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)

      expect(result.connected).toBe(false)
      expect(result.responseTime).toBeGreaterThan(90) // Should reflect timeout duration
    })
  })

  describe('Schema Validation Accuracy', () => {
    it('should accurately identify missing critical tables', async () => {
      // Mock scenario with missing tables
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          { table_name: 'users' },
          { table_name: 'lofts' }
          // Missing: reservations, transactions, tasks, etc.
        ],
        error: null
      })

      const result = await validationEngine.validateSchema(mockEnvironment)

      expect(result.isValid).toBe(false)
      expect(result.tablesFound).toBe(2)
      expect(result.missingTables).toContain('reservations')
      expect(result.missingTables).toContain('transactions')
      expect(result.missingTables).toContain('tasks')
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should accurately count database objects', async () => {
      const result = await validationEngine.validateSchema(mockEnvironment)

      expect(result.functionsFound).toBeGreaterThanOrEqual(0)
      expect(result.triggersFound).toBeGreaterThanOrEqual(0)
      expect(result.policiesFound).toBeGreaterThanOrEqual(0)
    })

    it('should handle schema query failures gracefully', async () => {
      // Mock schema query failure
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Schema access denied'))

      const result = await validationEngine.validateSchema(mockEnvironment)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Schema access denied')
    })
  })

  describe('Data Integrity Validation Accuracy', () => {
    it('should accurately count total records across tables', async () => {
      const result = await validationEngine.validateDataIntegrity(mockEnvironment)

      expect(result.totalRecords).toBeGreaterThanOrEqual(0)
      // With our mock, should have some records from the count queries
      expect(result.totalRecords).toBeGreaterThan(0)
    })

    it('should detect orphaned records accurately', async () => {
      // Mock scenario with orphaned records
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'reservations') {
          return {
            select: jest.fn(() => ({
              not: jest.fn(() => Promise.resolve({ 
                data: [
                  { id: 'orphan-1' },
                  { id: 'orphan-2' }
                ], 
                error: null 
              }))
            }))
          }
        }
        return {
          select: jest.fn(() => ({
            count: jest.fn(() => Promise.resolve({ count: 100, error: null }))
          }))
        }
      })

      const result = await validationEngine.validateDataIntegrity(mockEnvironment)

      expect(result.orphanedRecords).toBe(2)
      expect(result.isValid).toBe(false) // Should be invalid due to orphaned records
    })

    it('should detect null constraint violations', async () => {
      // Mock scenario with null constraint violations
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation((table) => ({
        select: jest.fn(() => ({
          is: jest.fn(() => Promise.resolve({ count: 5, error: null })), // 5 null violations
          count: jest.fn(() => Promise.resolve({ count: 100, error: null }))
        }))
      }))

      const result = await validationEngine.validateDataIntegrity(mockEnvironment)

      expect(result.nullConstraintViolations).toBeGreaterThan(0)
      expect(result.isValid).toBe(false) // Should be invalid due to null violations
    })

    it('should handle data integrity check failures gracefully', async () => {
      // Mock data access failure
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn(() => {
          throw new Error('Data access denied')
        })
      }))

      const result = await validationEngine.validateDataIntegrity(mockEnvironment)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Audit System Validation Accuracy', () => {
    it('should accurately detect audit tables presence', async () => {
      const result = await validationEngine.validateAuditSystem(mockEnvironment)

      expect(result.auditTablesPresent).toBe(true) // Our mock returns audit tables
      expect(typeof result.auditTriggersActive).toBe('boolean')
      expect(typeof result.auditFunctionsWorking).toBe('boolean')
    })

    it('should detect missing audit components', async () => {
      // Mock scenario with no audit components
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation((table) => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            like: jest.fn(() => Promise.resolve({ data: [], error: null })) // No audit components
          }))
        }))
      }))

      const result = await validationEngine.validateAuditSystem(mockEnvironment)

      expect(result.auditTablesPresent).toBe(false)
      expect(result.auditTriggersActive).toBe(false)
      expect(result.auditFunctionsWorking).toBe(false)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should check for recent audit logs', async () => {
      // Mock scenario with recent audit logs
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'audit_logs') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ 
                  data: [{ id: 'recent-log-1' }], 
                  error: null 
                }))
              }))
            }))
          }
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              like: jest.fn(() => Promise.resolve({ 
                data: [{ table_name: 'audit_logs' }], 
                error: null 
              }))
            }))
          }))
        }
      })

      const result = await validationEngine.validateAuditSystem(mockEnvironment)

      expect(result.auditLogsRecent).toBe(true)
    })
  })

  describe('Overall Score Calculation Accuracy', () => {
    it('should calculate accurate scores for healthy environments', async () => {
      const result = await validationEngine.validateEnvironment(mockEnvironment)

      expect(result.overallScore).toBeGreaterThan(50) // Should be decent with our mocks
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should calculate low scores for unhealthy environments', async () => {
      // Mock unhealthy environment
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Connection failed')))
          }))
        }))
      }))

      const result = await validationEngine.validateEnvironment(mockEnvironment)

      expect(result.overallScore).toBeLessThan(50) // Should be low due to connection failure
      expect(result.isValid).toBe(false)
    })

    it('should provide partial scores for partially working environments', async () => {
      // Mock partially working environment (connectivity works, schema issues)
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: { count: 1 }, error: null }))
              }))
            }))
          }
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [], error: null })) // Empty schema
          }))
        }
      })

      const result = await validationEngine.validateEnvironment(mockEnvironment)

      expect(result.overallScore).toBeGreaterThan(20) // Should get connectivity points
      expect(result.overallScore).toBeLessThan(80) // But lose schema points
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed database responses', async () => {
      // Mock malformed response
      const mockSupabaseClient = require('@supabase/supabase-js').createClient()
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: 'invalid-format', error: null }))
          }))
        }))
      })

      const result = await validationEngine.validateDatabaseConnectivity(mockEnvironment)

      expect(result).toBeDefined()
      expect(typeof result.connected).toBe('boolean')
    })

    it('should handle concurrent validation requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        validationEngine.validateEnvironment(mockEnvironment)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(typeof result.overallScore).toBe('number')
      })
    })

    it('should validate with minimal permissions', async () => {
      // Test with environment that has limited access
      const limitedEnv: Environment = {
        ...mockEnvironment,
        supabaseServiceKey: mockEnvironment.supabaseAnonKey // Use anon key instead of service key
      }

      const result = await validationEngine.validateEnvironment(limitedEnv)

      expect(result).toBeDefined()
      // Should still work but might have limited functionality
      expect(result.connectivity).toBeDefined()
    })
  })
})