import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock the database and auth dependencies
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              or: jest.fn(() => ({
                range: jest.fn(() => ({
                  order: jest.fn(() => Promise.resolve({
                    data: [
                      {
                        id: '1',
                        table_name: 'transactions',
                        record_id: 'rec1',
                        action: 'INSERT',
                        user_id: 'user1',
                        user_email: 'user@example.com',
                        timestamp: '2024-01-01T10:00:00Z',
                        changed_fields: ['amount'],
                        old_values: null,
                        new_values: { amount: 100 },
                        ip_address: '192.168.1.1',
                        user_agent: 'Mozilla/5.0'
                      }
                    ],
                    error: null,
                    count: 1
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('Audit Export Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Full Export Workflow', () => {
    it('should export audit logs in CSV format with all features', async () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const filters = {
        tableName: 'transactions',
        action: 'INSERT',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z'
      }

      const exportOptions = {
        format: 'csv' as const,
        fields: ['id', 'tableName', 'action', 'userEmail', 'timestamp'],
        includeValues: false,
        batchSize: 1000
      }

      const result = await AuditService.exportAuditLogs(filters, exportOptions)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('totalRecords', 1)
      expect(result).toHaveProperty('format', 'csv')
      
      // Verify CSV structure
      const lines = result.data.split('\n')
      expect(lines[0]).toBe('Id,Table Name,Action,User Email,Timestamp')
      expect(lines[1]).toContain('"1","transactions","INSERT","user@example.com"')
    })

    it('should export audit logs in JSON format with values', async () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const filters = {
        tableName: 'transactions'
      }

      const exportOptions = {
        format: 'json' as const,
        fields: ['id', 'action', 'userEmail'],
        includeValues: true,
        batchSize: 1000
      }

      const result = await AuditService.exportAuditLogs(filters, exportOptions)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('totalRecords', 1)
      expect(result).toHaveProperty('format', 'json')
      
      // Verify JSON structure
      const jsonData = JSON.parse(result.data)
      expect(jsonData).toHaveLength(1)
      expect(jsonData[0]).toEqual({
        id: '1',
        action: 'INSERT',
        userEmail: 'user@example.com',
        oldValues: null,
        newValues: { amount: 100 }
      })
    })

    it('should get export progress correctly', async () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const filters = {
        tableName: 'transactions'
      }

      const progress = await AuditService.getExportProgress(filters)

      expect(progress).toHaveProperty('totalRecords', 1)
    })

    it('should handle large datasets with batching', async () => {
      const { AuditService } = require('@/lib/services/audit-service')

      // Mock a scenario with multiple pages
      const mockClient = require('@/utils/supabase/server').createClient()
      let callCount = 0
      
      mockClient.from().select().eq().gte().lte().or().range().order.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First page
          return Promise.resolve({
            data: Array(1000).fill(null).map((_, i) => ({
              id: `${i + 1}`,
              table_name: 'transactions',
              record_id: `rec${i + 1}`,
              action: 'INSERT',
              user_id: 'user1',
              user_email: 'user@example.com',
              timestamp: '2024-01-01T10:00:00Z',
              changed_fields: ['amount'],
              old_values: null,
              new_values: { amount: 100 + i },
              ip_address: '192.168.1.1',
              user_agent: 'Mozilla/5.0'
            })),
            error: null,
            count: 1500 // Total count
          })
        } else {
          // Second page
          return Promise.resolve({
            data: Array(500).fill(null).map((_, i) => ({
              id: `${i + 1001}`,
              table_name: 'transactions',
              record_id: `rec${i + 1001}`,
              action: 'INSERT',
              user_id: 'user1',
              user_email: 'user@example.com',
              timestamp: '2024-01-01T10:00:00Z',
              changed_fields: ['amount'],
              old_values: null,
              new_values: { amount: 1100 + i },
              ip_address: '192.168.1.1',
              user_agent: 'Mozilla/5.0'
            })),
            error: null,
            count: 1500 // Total count
          })
        }
      })

      const filters = {}
      const exportOptions = {
        format: 'csv' as const,
        fields: [],
        includeValues: false,
        batchSize: 1000
      }

      const result = await AuditService.exportAuditLogs(filters, exportOptions)

      expect(result.totalRecords).toBe(1500)
      expect(result.format).toBe('csv')
      
      // Verify that batching worked (should have made 2 calls)
      const lines = result.data.split('\n')
      expect(lines.length).toBe(1502) // Header + 1500 data rows + empty line
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { AuditService } = require('@/lib/services/audit-service')

      // Mock database error
      const mockClient = require('@/utils/supabase/server').createClient()
      mockClient.from().select().eq().gte().lte().or().range().order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null
      })

      const filters = {}
      const exportOptions = {
        format: 'csv' as const,
        fields: [],
        includeValues: false,
        batchSize: 1000
      }

      await expect(AuditService.exportAuditLogs(filters, exportOptions))
        .rejects
        .toThrow('Failed to fetch audit logs: Database connection failed')
    })

    it('should handle empty results', async () => {
      const { AuditService } = require('@/lib/services/audit-service')

      // Mock empty results
      const mockClient = require('@/utils/supabase/server').createClient()
      mockClient.from().select().eq().gte().lte().or().range().order.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const filters = {}
      const exportOptions = {
        format: 'csv' as const,
        fields: [],
        includeValues: false,
        batchSize: 1000
      }

      const result = await AuditService.exportAuditLogs(filters, exportOptions)

      expect(result.totalRecords).toBe(0)
      expect(result.data).toContain('Id,Table Name,Record ID,Action,User ID,User Email,Timestamp,Changed Fields,IP Address,User Agent')
      
      // Should only contain header
      const lines = result.data.split('\n')
      expect(lines.length).toBe(1)
    })
  })
})