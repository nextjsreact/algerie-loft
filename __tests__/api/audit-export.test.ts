import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuthAPI: jest.fn()
}))

// Mock the audit service
jest.mock('@/lib/services/audit-service', () => ({
  AuditService: {
    exportAuditLogs: jest.fn(),
    getExportProgress: jest.fn()
  }
}))

// Mock Next.js request/response
const mockRequest = (body: any = {}, searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/audit/export')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  
  return {
    json: jest.fn().mockResolvedValue(body),
    url: url.toString()
  } as any
}

const mockResponse = () => {
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    headers: new Headers()
  }
  return res as any
}

// Import handler after mocking
import { POST as exportHandler, GET as progressHandler } from '@/app/api/audit/export/route'
import { requireAuthAPI } from '@/lib/auth'
import { AuditService } from '@/lib/services/audit-service'

describe('Audit Export API Endpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/audit/export', () => {
    it('should require authentication', async () => {
      // Mock unauthenticated request
      ;(requireAuthAPI as jest.Mock).mockResolvedValue(null)

      const request = mockRequest({
        filters: {},
        format: 'csv'
      })

      const response = await exportHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Non authentifié')
    })

    it('should require admin or manager role', async () => {
      // Mock authenticated user with insufficient permissions
      ;(requireAuthAPI as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'member' }
      })

      const request = mockRequest({
        filters: {},
        format: 'csv'
      })

      const response = await exportHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toContain('Permissions insuffisantes')
    })

    it('should validate export format', async () => {
      // Mock authenticated admin user
      ;(requireAuthAPI as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      })

      const request = mockRequest({
        filters: {},
        format: 'invalid'
      })

      const response = await exportHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Format d\'export invalide')
    })

    it('should export audit logs successfully', async () => {
      // Mock authenticated admin user
      ;(requireAuthAPI as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      })

      // Mock successful export
      ;(AuditService.exportAuditLogs as jest.Mock).mockResolvedValue({
        data: 'id,tableName,action\n1,transactions,INSERT',
        totalRecords: 1,
        format: 'csv'
      })

      const request = mockRequest({
        filters: { tableName: 'transactions' },
        format: 'csv',
        fields: ['id', 'tableName', 'action'],
        includeValues: false
      })

      const response = await exportHandler(request)

      expect(response.status).toBe(200)
      expect(AuditService.exportAuditLogs).toHaveBeenCalledWith(
        { tableName: 'transactions' },
        {
          format: 'csv',
          fields: ['id', 'tableName', 'action'],
          includeValues: false,
          batchSize: 1000
        }
      )
    })

    it('should validate table name filter', async () => {
      // Mock authenticated admin user
      ;(requireAuthAPI as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      })

      const request = mockRequest({
        filters: { tableName: 'invalid_table' },
        format: 'csv'
      })

      const response = await exportHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Nom de table invalide')
      expect(responseData.validTables).toEqual(['transactions', 'tasks', 'reservations', 'lofts'])
    })

    it('should validate UUID format for recordId', async () => {
      // Mock authenticated admin user
      ;(requireAuthAPI as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      })

      const request = mockRequest({
        filters: { recordId: 'invalid-uuid' },
        format: 'csv'
      })

      const response = await exportHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Format d\'ID d\'enregistrement invalide')
    })
  })

  describe('GET /api/audit/export/progress', () => {
    it('should require authentication for progress endpoint', async () => {
      // Mock unauthenticated request
      ;(requireAuthAPI as jest.Mock).mockResolvedValue(null)

      const request = mockRequest({}, {})

      const response = await progressHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Non authentifié')
    })

    it('should return export progress successfully', async () => {
      // Mock authenticated admin user
      ;(requireAuthAPI as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'admin' }
      })

      // Mock progress response
      ;(AuditService.getExportProgress as jest.Mock).mockResolvedValue({
        totalRecords: 150
      })

      const request = mockRequest({}, { tableName: 'transactions' })

      const response = await progressHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.totalRecords).toBe(150)
      expect(AuditService.getExportProgress).toHaveBeenCalledWith({
        tableName: 'transactions'
      })
    })
  })
})