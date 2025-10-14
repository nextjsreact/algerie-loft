/**
 * Unit Tests for Audit System Cloner
 * 
 * Tests the audit system cloning functionality in isolation
 * Requirements: 8.1, 8.4
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { AuditSystemCloner } from '@/lib/environment-management/specialized-cloning/audit-system-cloner'
import { Environment } from '@/lib/environment-management/types'

// Mock dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/logger')
jest.mock('@/lib/environment-management/production-safety-guard')
jest.mock('@/lib/environment-management/anonymization')

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  schema: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis()
}

const createMockEnvironment = (type: 'production' | 'test'): Environment => ({
  id: `env_${type}`,
  name: `${type} Environment`,
  type,
  supabaseUrl: `https://${type}.supabase.co`,
  supabaseAnonKey: 'mock_key',
  supabaseServiceKey: 'mock_service_key',
  status: 'active',
  isProduction: type === 'production',
  allowWrites: type !== 'production',
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: `Mock ${type} environment`
})

describe('🔍 Audit System Cloner Unit Tests', () => {
  let auditCloner: AuditSystemCloner
  let productionEnv: Environment
  let testEnv: Environment

  beforeEach(() => {
    jest.clearAllMocks()
    auditCloner = new AuditSystemCloner()
    productionEnv = createMockEnvironment('production')
    testEnv = createMockEnvironment('test')
    
    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Schema Analysis', () => {
    it('should identify audit tables correctly', async () => {
      const mockAuditTables = [
        { table_name: 'audit_logs', table_schema: 'audit' },
        { table_name: 'audit_user_context', table_schema: 'audit' },
        { table_name: 'audit_retention_policies', table_schema: 'audit' }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockAuditTables,
        error: null
      })

      const tables = await auditCloner.analyzeAuditSchema(productionEnv)

      expect(tables).toHaveLength(3)
      expect(tables.map(t => t.tableName)).toContain('audit_logs')
      expect(tables.map(t => t.tableName)).toContain('audit_user_context')
      expect(tables.map(t => t.tableName)).toContain('audit_retention_policies')
    })

    it('should extract audit functions correctly', async () => {
      const mockAuditFunctions = [
        {
          routine_name: 'audit_trigger_function',
          routine_schema: 'audit',
          routine_definition: 'CREATE OR REPLACE FUNCTION audit.audit_trigger_function() RETURNS trigger...'
        },
        {
          routine_name: 'set_audit_user_context',
          routine_schema: 'audit',
          routine_definition: 'CREATE OR REPLACE FUNCTION audit.set_audit_user_context(user_id uuid)...'
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockAuditFunctions,
        error: null
      })

      const functions = await auditCloner.extractAuditFunctions(productionEnv)

      expect(functions).toHaveLength(2)
      expect(functions[0].name).toBe('audit_trigger_function')
      expect(functions[1].name).toBe('set_audit_user_context')
    })

    it('should identify audit triggers correctly', async () => {
      const mockAuditTriggers = [
        {
          trigger_name: 'lofts_audit_trigger',
          event_object_table: 'lofts',
          event_object_schema: 'public',
          action_statement: 'EXECUTE FUNCTION audit.audit_trigger_function()'
        },
        {
          trigger_name: 'transactions_audit_trigger',
          event_object_table: 'transactions',
          event_object_schema: 'public',
          action_statement: 'EXECUTE FUNCTION audit.audit_trigger_function()'
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockAuditTriggers,
        error: null
      })

      const triggers = await auditCloner.extractAuditTriggers(productionEnv)

      expect(triggers).toHaveLength(2)
      expect(triggers[0].name).toBe('lofts_audit_trigger')
      expect(triggers[0].tableName).toBe('lofts')
      expect(triggers[1].name).toBe('transactions_audit_trigger')
      expect(triggers[1].tableName).toBe('transactions')
    })
  })

  describe('Data Anonymization', () => {
    it('should anonymize sensitive data in audit logs', async () => {
      const mockAuditLogs = [
        {
          id: 'log1',
          table_name: 'users',
          operation: 'UPDATE',
          old_data: { 
            email: 'user@example.com', 
            name: 'John Doe',
            phone: '+213555123456'
          },
          new_data: { 
            email: 'newemail@example.com', 
            name: 'John Doe',
            phone: '+213555123456'
          },
          user_id: 'user123',
          timestamp: new Date()
        }
      ]

      const anonymizedLogs = await auditCloner.anonymizeAuditLogs(mockAuditLogs, {
        anonymizeEmails: true,
        anonymizeNames: true,
        anonymizePhones: true,
        preserveStructure: true
      })

      expect(anonymizedLogs).toHaveLength(1)
      expect(anonymizedLogs[0].old_data.email).not.toBe('user@example.com')
      expect(anonymizedLogs[0].old_data.name).not.toBe('John Doe')
      expect(anonymizedLogs[0].old_data.phone).not.toBe('+213555123456')
      
      // Structure should be preserved
      expect(anonymizedLogs[0].table_name).toBe('users')
      expect(anonymizedLogs[0].operation).toBe('UPDATE')
      expect(anonymizedLogs[0].id).toBe('log1')
    })

    it('should preserve audit log relationships', async () => {
      const mockAuditLogs = [
        {
          id: 'log1',
          table_name: 'users',
          operation: 'INSERT',
          new_data: { id: 'user123', email: 'user@example.com' },
          user_id: 'admin1'
        },
        {
          id: 'log2',
          table_name: 'transactions',
          operation: 'INSERT',
          new_data: { user_id: 'user123', amount: 1000 },
          user_id: 'admin1'
        }
      ]

      const anonymizedLogs = await auditCloner.anonymizeAuditLogs(mockAuditLogs, {
        preserveRelationships: true,
        anonymizeEmails: true
      })

      // User IDs should be consistently anonymized
      const userIdInFirstLog = anonymizedLogs[0].new_data.id
      const userIdInSecondLog = anonymizedLogs[1].new_data.user_id
      expect(userIdInFirstLog).toBe(userIdInSecondLog)
      
      // Admin user should be consistently anonymized
      expect(anonymizedLogs[0].user_id).toBe(anonymizedLogs[1].user_id)
    })

    it('should handle different data types in audit logs', async () => {
      const mockAuditLogs = [
        {
          id: 'log1',
          table_name: 'transactions',
          operation: 'UPDATE',
          old_data: {
            amount: 1000.50,
            date: '2024-01-15T10:30:00Z',
            metadata: { source: 'api', version: '1.0' },
            tags: ['payment', 'confirmed']
          },
          new_data: {
            amount: 1200.75,
            date: '2024-01-15T10:30:00Z',
            metadata: { source: 'api', version: '1.0' },
            tags: ['payment', 'confirmed', 'updated']
          }
        }
      ]

      const anonymizedLogs = await auditCloner.anonymizeAuditLogs(mockAuditLogs, {
        preserveDataTypes: true,
        anonymizeAmounts: false // Keep amounts for testing
      })

      expect(typeof anonymizedLogs[0].old_data.amount).toBe('number')
      expect(typeof anonymizedLogs[0].old_data.date).toBe('string')
      expect(Array.isArray(anonymizedLogs[0].old_data.tags)).toBe(true)
      expect(typeof anonymizedLogs[0].old_data.metadata).toBe('object')
    })
  })

  describe('Audit Log Filtering', () => {
    it('should filter logs by age', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45) // 45 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 15) // 15 days old

      const mockAuditLogs = [
        {
          id: 'log1',
          timestamp: oldDate,
          table_name: 'users',
          operation: 'UPDATE'
        },
        {
          id: 'log2',
          timestamp: recentDate,
          table_name: 'users',
          operation: 'INSERT'
        }
      ]

      const filteredLogs = await auditCloner.filterAuditLogs(mockAuditLogs, {
        maxAge: 30 // Only logs newer than 30 days
      })

      expect(filteredLogs).toHaveLength(1)
      expect(filteredLogs[0].id).toBe('log2')
    })

    it('should filter logs by operation type', async () => {
      const mockAuditLogs = [
        { id: 'log1', operation: 'INSERT', table_name: 'users' },
        { id: 'log2', operation: 'UPDATE', table_name: 'users' },
        { id: 'log3', operation: 'DELETE', table_name: 'users' },
        { id: 'log4', operation: 'SELECT', table_name: 'users' }
      ]

      const filteredLogs = await auditCloner.filterAuditLogs(mockAuditLogs, {
        operationFilter: ['INSERT', 'UPDATE'] // Only INSERT and UPDATE operations
      })

      expect(filteredLogs).toHaveLength(2)
      expect(filteredLogs.map(log => log.operation)).toEqual(['INSERT', 'UPDATE'])
    })

    it('should filter logs by table name', async () => {
      const mockAuditLogs = [
        { id: 'log1', table_name: 'users', operation: 'INSERT' },
        { id: 'log2', table_name: 'transactions', operation: 'INSERT' },
        { id: 'log3', table_name: 'lofts', operation: 'UPDATE' },
        { id: 'log4', table_name: 'users', operation: 'DELETE' }
      ]

      const filteredLogs = await auditCloner.filterAuditLogs(mockAuditLogs, {
        tableFilter: ['users', 'transactions'] // Only specific tables
      })

      expect(filteredLogs).toHaveLength(3)
      expect(filteredLogs.every(log => ['users', 'transactions'].includes(log.table_name))).toBe(true)
    })
  })

  describe('Audit System Validation', () => {
    it('should validate audit triggers are working', async () => {
      // Mock successful trigger test
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true, message: 'Audit trigger working correctly' },
        error: null
      })

      const isValid = await auditCloner.validateAuditTriggers(testEnv, ['lofts_audit_trigger'])

      expect(isValid).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('test_audit_trigger', {
        trigger_name: 'lofts_audit_trigger'
      })
    })

    it('should validate audit functions exist and are callable', async () => {
      // Mock function existence check
      mockSupabase.select.mockResolvedValue({
        data: [{ routine_name: 'audit_trigger_function' }],
        error: null
      })

      // Mock function call test
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const isValid = await auditCloner.validateAuditFunctions(testEnv, ['audit_trigger_function'])

      expect(isValid).toBe(true)
    })

    it('should validate audit schema integrity', async () => {
      // Mock schema validation
      const mockSchemaInfo = {
        tables: ['audit_logs', 'audit_user_context'],
        functions: ['audit_trigger_function', 'set_audit_user_context'],
        triggers: ['lofts_audit_trigger', 'transactions_audit_trigger']
      }

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockSchemaInfo.tables.map(name => ({ table_name: name })), error: null })
        .mockResolvedValueOnce({ data: mockSchemaInfo.functions.map(name => ({ routine_name: name })), error: null })
        .mockResolvedValueOnce({ data: mockSchemaInfo.triggers.map(name => ({ trigger_name: name })), error: null })

      const validation = await auditCloner.validateAuditSchema(testEnv)

      expect(validation.isValid).toBe(true)
      expect(validation.missingTables).toHaveLength(0)
      expect(validation.missingFunctions).toHaveLength(0)
      expect(validation.missingTriggers).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const { createClient } = require('@/utils/supabase/server')
      createClient.mockRejectedValue(new Error('Connection failed'))

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_connection_error'
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Connection failed')
    })

    it('should handle missing audit schema gracefully', async () => {
      // Mock empty audit schema
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_missing_schema'
      )

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('audit schema not found'))).toBe(true)
    })

    it('should handle data corruption in audit logs', async () => {
      const corruptedLogs = [
        {
          id: 'log1',
          table_name: null, // Corrupted data
          operation: 'UPDATE',
          old_data: 'invalid_json', // Should be object
          timestamp: 'invalid_date' // Should be date
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [{ table_name: 'audit_logs' }], error: null })
        .mockResolvedValueOnce({ data: corruptedLogs, error: null })

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_data_corruption'
      )

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('data corruption'))).toBe(true)
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large audit log datasets efficiently', async () => {
      // Mock large dataset
      const largeLogs = Array.from({ length: 10000 }, (_, i) => ({
        id: `log${i}`,
        table_name: 'users',
        operation: 'UPDATE',
        old_data: { id: `user${i}`, email: `user${i}@example.com` },
        timestamp: new Date()
      }))

      mockSupabase.select
        .mockResolvedValueOnce({ data: [{ table_name: 'audit_logs' }], error: null })
        .mockResolvedValueOnce({ data: largeLogs, error: null })

      const startTime = Date.now()

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true,
        batchSize: 1000 // Process in batches
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_large_dataset'
      )

      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(result.logsCloned).toBe(10000)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
    })

    it('should optimize memory usage during anonymization', async () => {
      const memoryBefore = process.memoryUsage().heapUsed

      // Mock moderate dataset
      const logs = Array.from({ length: 1000 }, (_, i) => ({
        id: `log${i}`,
        table_name: 'users',
        operation: 'UPDATE',
        old_data: { 
          id: `user${i}`, 
          email: `user${i}@example.com`,
          profile: { name: `User ${i}`, bio: 'A'.repeat(1000) } // Large text data
        }
      }))

      const anonymizedLogs = await auditCloner.anonymizeAuditLogs(logs, {
        anonymizeEmails: true,
        preserveStructure: true,
        streamProcessing: true // Use streaming for memory efficiency
      })

      const memoryAfter = process.memoryUsage().heapUsed
      const memoryIncrease = memoryAfter - memoryBefore

      expect(anonymizedLogs).toHaveLength(1000)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
    })
  })
})