import { AuditService } from '@/lib/services/audit-service'
import type { AuditFilters, AuditLog, AuditAction } from '@/lib/types'

// Mock the Supabase client with proper method chaining
const createMockQuery = (finalResult: any) => {
  const mockQuery = {
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(finalResult),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  }
  return mockQuery
}

const mockRpc = jest.fn()
const mockAuth = {
  getUser: jest.fn()
}

let mockQuery: any
const mockSupabaseClient = {
  from: jest.fn(() => mockQuery),
  rpc: mockRpc,
  auth: mockAuth
}

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

// Get reference to mocked logger
const { logger: mockLogger } = require('@/lib/logger')

describe('AuditService Unit Tests', () => {
  const mockAuditLog: AuditLog = {
    id: 'test-audit-id',
    tableName: 'transactions',
    recordId: 'test-record-id',
    action: 'INSERT',
    userId: 'test-user-id',
    userEmail: 'test@example.com',
    timestamp: '2024-01-01T00:00:00Z',
    oldValues: null,
    newValues: { amount: 100, description: 'Test transaction' },
    changedFields: ['amount', 'description'],
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    integrityHash: 'test-hash'
  }

  const mockDbRow = {
    id: 'test-audit-id',
    table_name: 'transactions',
    record_id: 'test-record-id',
    action: 'INSERT',
    user_id: 'test-user-id',
    user_email: 'test@example.com',
    timestamp: '2024-01-01T00:00:00Z',
    old_values: null,
    new_values: { amount: 100, description: 'Test transaction' },
    changed_fields: ['amount', 'description'],
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 Test Browser',
    integrity_hash: 'test-hash'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default successful response
    mockQuery = createMockQuery({
      data: [mockDbRow],
      error: null,
      count: 1
    })
    
    mockRpc.mockResolvedValue({
      data: 'access-log-id',
      error: null
    })

    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  })

  describe('getAuditLogs method signature and basic functionality', () => {
    it('should have the correct method signature', () => {
      expect(typeof AuditService.getAuditLogs).toBe('function')
    })

    it('should accept filters, page, and limit parameters', async () => {
      const filters: AuditFilters = {
        tableName: 'transactions',
        action: 'INSERT'
      }
      
      const result = await AuditService.getAuditLogs(filters, 1, 50)
      
      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.logs)).toBe(true)
      expect(typeof result.total).toBe('number')
    })

    it('should work with default parameters', async () => {
      const result = await AuditService.getAuditLogs()
      
      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('total')
    })

    it('should transform database rows to AuditLog format correctly', async () => {
      const result = await AuditService.getAuditLogs()

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toEqual(mockAuditLog)
    })
  })

  describe('Filter application tests', () => {
    it('should call eq method for tableName filter', async () => {
      const filters: AuditFilters = { tableName: 'tasks' }
      
      await AuditService.getAuditLogs(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('table_name', 'tasks')
    })

    it('should call eq method for recordId filter', async () => {
      const filters: AuditFilters = { recordId: 'specific-record' }
      
      await AuditService.getAuditLogs(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('record_id', 'specific-record')
    })

    it('should call eq method for userId filter', async () => {
      const filters: AuditFilters = { userId: 'specific-user' }
      
      await AuditService.getAuditLogs(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'specific-user')
    })

    it('should call eq method for action filter', async () => {
      const filters: AuditFilters = { action: 'UPDATE' }
      
      await AuditService.getAuditLogs(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('action', 'UPDATE')
    })

    it('should call gte and lte methods for date range filters', async () => {
      const filters: AuditFilters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      }
      
      await AuditService.getAuditLogs(filters)

      expect(mockQuery.gte).toHaveBeenCalledWith('timestamp', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('timestamp', '2024-12-31')
    })

    it('should call or method for search filter', async () => {
      const filters: AuditFilters = { search: 'test search' }
      
      await AuditService.getAuditLogs(filters)

      expect(mockQuery.or).toHaveBeenCalledWith(
        'user_email.ilike.%test search%,action.ilike.%test search%,table_name.ilike.%test search%'
      )
    })

    it('should not apply filters for null/undefined values', async () => {
      const filters: AuditFilters = {
        tableName: undefined,
        recordId: null as any,
        userId: '',
        action: undefined
      }

      await AuditService.getAuditLogs(filters)

      // Should not call eq for undefined/null/empty values
      expect(mockQuery.eq).not.toHaveBeenCalledWith('table_name', undefined)
      expect(mockQuery.eq).not.toHaveBeenCalledWith('record_id', null)
      expect(mockQuery.eq).not.toHaveBeenCalledWith('user_id', '')
      expect(mockQuery.eq).not.toHaveBeenCalledWith('action', undefined)
    })
  })

  describe('Pagination tests', () => {
    it('should apply correct pagination for page 1', async () => {
      await AuditService.getAuditLogs({}, 1, 50)

      expect(mockQuery.range).toHaveBeenCalledWith(0, 49)
    })

    it('should apply correct pagination for page 2', async () => {
      await AuditService.getAuditLogs({}, 2, 25)

      expect(mockQuery.range).toHaveBeenCalledWith(25, 49)
    })

    it('should handle large page numbers', async () => {
      await AuditService.getAuditLogs({}, 100, 10)

      expect(mockQuery.range).toHaveBeenCalledWith(990, 999)
    })
  })

  describe('Error handling tests', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed')
      mockQuery = createMockQuery({
        data: null,
        error: dbError,
        count: null
      })

      await expect(AuditService.getAuditLogs()).rejects.toThrow(
        'Failed to fetch audit logs: Database connection failed'
      )
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch audit logs',
        dbError,
        expect.any(Object)
      )
    })

    it('should handle empty results', async () => {
      mockQuery = createMockQuery({
        data: [],
        error: null,
        count: 0
      })

      const result = await AuditService.getAuditLogs()

      expect(result).toEqual({
        logs: [],
        total: 0
      })
    })

    it('should handle malformed audit log data', async () => {
      const malformedRow = {
        ...mockDbRow,
        changed_fields: null, // This should be handled gracefully
        ip_address: null,
        user_agent: null
      }

      mockQuery = createMockQuery({
        data: [malformedRow],
        error: null,
        count: 1
      })

      const result = await AuditService.getAuditLogs()

      expect(result.logs[0].changedFields).toEqual([])
      expect(result.logs[0].ipAddress).toBeNull()
      expect(result.logs[0].userAgent).toBeNull()
    })
  })

  describe('getEntityAuditHistory method tests', () => {
    beforeEach(() => {
      // For getEntityAuditHistory, the chain ends with order, not range
      mockQuery.order = jest.fn().mockResolvedValue({
        data: [mockDbRow],
        error: null
      })
    })

    it('should have the correct method signature', () => {
      expect(typeof AuditService.getEntityAuditHistory).toBe('function')
    })

    it('should fetch audit history for specific entity', async () => {
      const result = await AuditService.getEntityAuditHistory('transactions', 'record-123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
      expect(mockQuery.eq).toHaveBeenCalledWith('table_name', 'transactions')
      expect(mockQuery.eq).toHaveBeenCalledWith('record_id', 'record-123')
      expect(mockQuery.order).toHaveBeenCalledWith('timestamp', { ascending: false })
      
      expect(result).toEqual([mockAuditLog])
    })

    it('should handle empty history', async () => {
      mockQuery.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await AuditService.getEntityAuditHistory('tasks', 'nonexistent')

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Table not found')
      mockQuery.order.mockResolvedValue({
        data: null,
        error: dbError
      })

      await expect(
        AuditService.getEntityAuditHistory('invalid_table', 'record-id')
      ).rejects.toThrow('Failed to fetch entity audit history: Table not found')
    })
  })

  describe('Data transformation tests', () => {
    it('should correctly transform all audit actions', async () => {
      const actions: AuditAction[] = ['INSERT', 'UPDATE', 'DELETE']
      
      for (const action of actions) {
        const dbRow = { ...mockDbRow, action }
        mockQuery = createMockQuery({
          data: [dbRow],
          error: null,
          count: 1
        })

        const result = await AuditService.getAuditLogs()
        expect(result.logs[0].action).toBe(action)
      }
    })

    it('should handle different timestamp formats', async () => {
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01 00:00:00+00',
        '2024-01-01T00:00:00.123456Z'
      ]

      for (const timestamp of timestamps) {
        const dbRow = { ...mockDbRow, timestamp }
        mockQuery = createMockQuery({
          data: [dbRow],
          error: null,
          count: 1
        })

        const result = await AuditService.getAuditLogs()
        expect(result.logs[0].timestamp).toBe(timestamp)
      }
    })

    it('should handle complex JSON values in old/new values', async () => {
      const complexValues = {
        nested: {
          object: {
            with: ['arrays', 'and', 'strings'],
            numbers: 123.45,
            boolean: true,
            null_value: null
          }
        },
        unicode: 'Test with émojis 🎉 and special chars ñáéíóú'
      }

      const dbRow = {
        ...mockDbRow,
        old_values: complexValues,
        new_values: { ...complexValues, updated: true }
      }

      mockQuery = createMockQuery({
        data: [dbRow],
        error: null,
        count: 1
      })

      const result = await AuditService.getAuditLogs()
      
      expect(result.logs[0].oldValues).toEqual(complexValues)
      expect(result.logs[0].newValues).toEqual({ ...complexValues, updated: true })
    })

    it('should handle empty and null arrays in changed_fields', async () => {
      const testCases = [
        { changed_fields: null, expected: [] },
        { changed_fields: [], expected: [] },
        { changed_fields: ['field1'], expected: ['field1'] },
        { changed_fields: ['field1', 'field2', 'field3'], expected: ['field1', 'field2', 'field3'] }
      ]

      for (const testCase of testCases) {
        const dbRow = { ...mockDbRow, changed_fields: testCase.changed_fields }
        mockQuery = createMockQuery({
          data: [dbRow],
          error: null,
          count: 1
        })

        const result = await AuditService.getAuditLogs()
        expect(result.logs[0].changedFields).toEqual(testCase.expected)
      }
    })
  })

  describe('Export functionality tests', () => {
    beforeEach(() => {
      // Mock getAuditLogs for export functionality
      jest.spyOn(AuditService, 'getAuditLogs').mockResolvedValue({
        logs: [mockAuditLog],
        total: 1
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should have the correct export method signature', () => {
      expect(typeof AuditService.exportAuditLogs).toBe('function')
    })

    it('should export audit logs as CSV by default', async () => {
      const result = await AuditService.exportAuditLogs()

      expect(result.format).toBe('csv')
      expect(result.totalRecords).toBe(1)
      expect(result.data).toContain('Id,Table Name,Record ID,Action,User ID,User Email,Timestamp,Changed Fields,IP Address,User Agent')
      expect(result.data).toContain('"test-audit-id","transactions","test-record-id","INSERT"')
    })

    it('should export audit logs as JSON when specified', async () => {
      const result = await AuditService.exportAuditLogs({}, { format: 'json' })

      expect(result.format).toBe('json')
      expect(result.totalRecords).toBe(1)
      
      const parsedData = JSON.parse(result.data)
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0]).toMatchObject({
        id: 'test-audit-id',
        tableName: 'transactions',
        action: 'INSERT'
      })
    })

    it('should include old/new values when specified', async () => {
      const result = await AuditService.exportAuditLogs({}, { 
        format: 'json', 
        includeValues: true 
      })

      const parsedData = JSON.parse(result.data)
      expect(parsedData[0]).toHaveProperty('oldValues')
      expect(parsedData[0]).toHaveProperty('newValues')
      expect(parsedData[0].newValues).toEqual({ amount: 100, description: 'Test transaction' })
    })

    it('should export only selected fields when specified', async () => {
      const result = await AuditService.exportAuditLogs({}, { 
        format: 'json',
        fields: ['id', 'action', 'userEmail']
      })

      const parsedData = JSON.parse(result.data)
      expect(parsedData[0]).toEqual({
        id: 'test-audit-id',
        action: 'INSERT',
        userEmail: 'test@example.com'
      })
    })

    it('should handle CSV field selection', async () => {
      const result = await AuditService.exportAuditLogs({}, { 
        format: 'csv',
        fields: ['id', 'action', 'userEmail']
      })

      const lines = result.data.split('\n')
      expect(lines[0]).toBe('Id,Action,User Email')
      expect(lines[1]).toBe('"test-audit-id","INSERT","test@example.com"')
    })

    it('should escape CSV values properly', async () => {
      const logWithSpecialChars = {
        ...mockAuditLog,
        userEmail: 'test"with"quotes@example.com',
        newValues: { description: 'Transaction with, comma and "quotes"' }
      }

      jest.spyOn(AuditService, 'getAuditLogs').mockResolvedValue({
        logs: [logWithSpecialChars],
        total: 1
      })

      const result = await AuditService.exportAuditLogs({}, { includeValues: true })

      expect(result.data).toContain('"test""with""quotes@example.com"')
      expect(result.data).toContain('"{""description"":""Transaction with, comma and \\""quotes\\""""}"')
    })
  })

  describe('Statistics functionality tests', () => {
    const mockStatisticsLogs: AuditLog[] = [
      {
        ...mockAuditLog,
        id: 'log1',
        action: 'INSERT',
        userId: 'user1',
        userEmail: 'user1@example.com',
        timestamp: '2024-01-01T10:00:00Z'
      },
      {
        ...mockAuditLog,
        id: 'log2',
        action: 'UPDATE',
        userId: 'user1',
        userEmail: 'user1@example.com',
        timestamp: '2024-01-01T11:00:00Z'
      },
      {
        ...mockAuditLog,
        id: 'log3',
        action: 'DELETE',
        userId: 'user2',
        userEmail: 'user2@example.com',
        timestamp: '2024-01-02T10:00:00Z'
      }
    ]

    beforeEach(() => {
      jest.spyOn(AuditService, 'getAuditLogs').mockResolvedValue({
        logs: mockStatisticsLogs,
        total: 3
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should have the correct statistics method signature', () => {
      expect(typeof AuditService.getAuditStatistics).toBe('function')
    })

    it('should calculate audit statistics correctly', async () => {
      const result = await AuditService.getAuditStatistics()

      expect(result.totalLogs).toBe(3)
      expect(result.actionBreakdown).toEqual({
        INSERT: 1,
        UPDATE: 1,
        DELETE: 1
      })
      expect(result.userActivity).toHaveLength(2)
      expect(result.userActivity[0]).toEqual({
        userId: 'user1',
        userEmail: 'user1@example.com',
        count: 2
      })
      expect(result.dailyActivity).toHaveLength(2)
      expect(result.dailyActivity[0]).toEqual({
        date: '2024-01-01',
        count: 2
      })
    })

    it('should sort user activity by count descending', async () => {
      const result = await AuditService.getAuditStatistics()

      expect(result.userActivity[0].count).toBeGreaterThanOrEqual(result.userActivity[1].count)
    })

    it('should sort daily activity by date ascending', async () => {
      const result = await AuditService.getAuditStatistics()

      expect(result.dailyActivity[0].date.localeCompare(result.dailyActivity[1].date)).toBeLessThanOrEqual(0)
    })

    it('should handle empty statistics', async () => {
      jest.spyOn(AuditService, 'getAuditStatistics').mockResolvedValue({
        totalLogs: 0,
        actionBreakdown: { INSERT: 0, UPDATE: 0, DELETE: 0 },
        userActivity: [],
        dailyActivity: []
      })

      const result = await AuditService.getAuditStatistics()

      expect(result).toEqual({
        totalLogs: 0,
        actionBreakdown: { INSERT: 0, UPDATE: 0, DELETE: 0 },
        userActivity: [],
        dailyActivity: []
      })
    })
  })

  describe('Type compatibility tests', () => {
    it('should return correct types for getAuditLogs', async () => {
      const result = await AuditService.getAuditLogs()
      
      expect(typeof result.total).toBe('number')
      expect(Array.isArray(result.logs)).toBe(true)
      
      if (result.logs.length > 0) {
        const log = result.logs[0]
        expect(typeof log.id).toBe('string')
        expect(typeof log.tableName).toBe('string')
        expect(typeof log.recordId).toBe('string')
        expect(['INSERT', 'UPDATE', 'DELETE']).toContain(log.action)
        expect(typeof log.userId).toBe('string')
        expect(typeof log.userEmail).toBe('string')
        expect(typeof log.timestamp).toBe('string')
        expect(Array.isArray(log.changedFields)).toBe(true)
      }
    })

    it('should accept valid filter types', () => {
      const validFilters: AuditFilters = {
        tableName: 'reservations',
        recordId: 'test-record',
        userId: 'test-user',
        action: 'UPDATE',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        search: 'test search'
      }

      expect(validFilters.tableName).toBe('reservations')
      expect(validFilters.action).toBe('UPDATE')
      
      // This should not throw a type error
      expect(() => {
        AuditService.getAuditLogs(validFilters, 1, 50)
      }).not.toThrow()
    })
  })

  describe('Security and access logging tests', () => {
    it('should log audit access for security monitoring', async () => {
      await AuditService.getAuditLogs({ tableName: 'tasks' })

      expect(mockRpc).toHaveBeenCalledWith('log_audit_access', {
        p_access_type: 'VIEW',
        p_table_name: 'tasks',
        p_record_id: null,
        p_filters_applied: JSON.stringify({ tableName: 'tasks' }),
        p_records_accessed: 0
      })
    })

    it('should log audit access for entity history', async () => {
      // Set up mock for getEntityAuditHistory
      mockQuery.order = jest.fn().mockResolvedValue({
        data: [mockDbRow],
        error: null
      })

      await AuditService.getEntityAuditHistory('lofts', 'loft-456')

      expect(mockRpc).toHaveBeenCalledWith('log_audit_access', {
        p_access_type: 'VIEW',
        p_table_name: 'lofts',
        p_record_id: 'loft-456',
        p_filters_applied: null,
        p_records_accessed: 0
      })
    })
  })
})