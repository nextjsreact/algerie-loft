import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock the database client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('Audit Export Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Enhanced Export Functionality', () => {
    it('should generate CSV with selected fields', () => {
      // Import the service after mocking
      const { AuditService } = require('@/lib/services/audit-service')

      const mockLogs = [
        {
          id: '1',
          tableName: 'transactions',
          recordId: 'rec1',
          action: 'INSERT',
          userId: 'user1',
          userEmail: 'user@example.com',
          timestamp: '2024-01-01T10:00:00Z',
          changedFields: ['amount', 'description'],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          oldValues: null,
          newValues: { amount: 100, description: 'Test' }
        }
      ]

      const selectedFields = ['id', 'tableName', 'action', 'userEmail']
      const csv = AuditService.generateCSV(mockLogs, selectedFields, false)

      expect(csv).toContain('Id,Table Name,Action,User Email')
      expect(csv).toContain('"1","transactions","INSERT","user@example.com"')
      expect(csv).not.toContain('Old Values')
      expect(csv).not.toContain('New Values')
    })

    it('should include old/new values when requested', () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const mockLogs = [
        {
          id: '1',
          tableName: 'transactions',
          recordId: 'rec1',
          action: 'UPDATE',
          userId: 'user1',
          userEmail: 'user@example.com',
          timestamp: '2024-01-01T10:00:00Z',
          changedFields: ['amount'],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          oldValues: { amount: 50 },
          newValues: { amount: 100 }
        }
      ]

      const csv = AuditService.generateCSV(mockLogs, [], true)

      expect(csv).toContain('Old Values,New Values')
      expect(csv).toContain('""amount"":50')
      expect(csv).toContain('""amount"":100')
    })

    it('should format logs for JSON export', () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const mockLogs = [
        {
          id: '1',
          tableName: 'transactions',
          recordId: 'rec1',
          action: 'INSERT',
          userId: 'user1',
          userEmail: 'user@example.com',
          timestamp: '2024-01-01T10:00:00Z',
          changedFields: ['amount'],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          oldValues: null,
          newValues: { amount: 100 }
        }
      ]

      const selectedFields = ['id', 'action', 'userEmail']
      const formatted = AuditService.formatLogsForExport(mockLogs, selectedFields, false)

      expect(formatted).toHaveLength(1)
      expect(formatted[0]).toEqual({
        id: '1',
        action: 'INSERT',
        userEmail: 'user@example.com'
      })
      expect(formatted[0]).not.toHaveProperty('oldValues')
      expect(formatted[0]).not.toHaveProperty('newValues')
    })

    it('should include values in JSON export when requested', () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const mockLogs = [
        {
          id: '1',
          tableName: 'transactions',
          recordId: 'rec1',
          action: 'UPDATE',
          userId: 'user1',
          userEmail: 'user@example.com',
          timestamp: '2024-01-01T10:00:00Z',
          changedFields: ['amount'],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          oldValues: { amount: 50 },
          newValues: { amount: 100 }
        }
      ]

      const formatted = AuditService.formatLogsForExport(mockLogs, [], true)

      expect(formatted[0]).toHaveProperty('oldValues', { amount: 50 })
      expect(formatted[0]).toHaveProperty('newValues', { amount: 100 })
    })

    it('should handle empty logs gracefully', () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const csv = AuditService.generateCSV([], [], false)
      const formatted = AuditService.formatLogsForExport([], [], false)

      expect(csv).toContain('Id,Table Name,Record ID,Action,User ID,User Email,Timestamp,Changed Fields,IP Address,User Agent')
      expect(formatted).toEqual([])
    })

    it('should escape CSV values properly', () => {
      const { AuditService } = require('@/lib/services/audit-service')

      const mockLogs = [
        {
          id: '1',
          tableName: 'transactions',
          recordId: 'rec1',
          action: 'INSERT',
          userId: 'user1',
          userEmail: 'user"with"quotes@example.com',
          timestamp: '2024-01-01T10:00:00Z',
          changedFields: ['description'],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          oldValues: null,
          newValues: { description: 'Test with "quotes" and, commas' }
        }
      ]

      const csv = AuditService.generateCSV(mockLogs, [], true)

      expect(csv).toContain('"user""with""quotes@example.com"')
      expect(csv).toContain('"{""description"":""Test with \\""quotes\\""')
    })
  })
})