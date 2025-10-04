/**
 * Integration tests for Audit Entity API endpoint
 * Tests the API layer for entity-specific audit history functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock auth
const mockRequireAuthAPI = jest.fn()
jest.mock('@/lib/auth', () => ({
  requireAuthAPI: mockRequireAuthAPI
}))

// Mock audit service
const mockGetEntityAuditHistory = jest.fn()
jest.mock('@/lib/services/audit-service', () => ({
  AuditService: {
    getEntityAuditHistory: mockGetEntityAuditHistory
  }
}))

// Import handler after mocking
import { GET as getEntityAuditHandler } from '@/app/api/audit/entity/[table]/[id]/route'

describe('Audit Entity API Endpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/audit/entity/[table]/[id]', () => {
    it('should return audit history for valid admin user', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockAuditHistory = [
        {
          id: 'audit-1',
          tableName: 'transactions',
          recordId: 'trans-1',
          action: 'INSERT',
          userId: 'user-1',
          userEmail: 'user@example.com',
          timestamp: '2024-01-01T10:00:00Z',
          oldValues: null,
          newValues: { amount: 100 },
          changedFields: []
        }
      ]
      mockGetEntityAuditHistory.mockResolvedValue(mockAuditHistory)

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'transactions', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.tableName).toBe('transactions')
      expect(data.data.recordId).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(data.data.auditHistory).toEqual(mockAuditHistory)
      expect(data.data.total).toBe(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockRequireAuthAPI.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'transactions', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Non authentifié')
    })

    it('should return 403 for user without audit permissions', async () => {
      const mockSession = { user: { id: 'member-1', role: 'member' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'transactions', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permissions insuffisantes pour accéder aux logs d\'audit')
    })

    it('should return 400 for invalid table name', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/audit/entity/invalid_table/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'invalid_table', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nom de table invalide')
      expect(data.validTables).toEqual(['transactions', 'tasks', 'reservations', 'lofts'])
    })

    it('should return 400 for invalid UUID format', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/invalid-id')
      const params = { 
        table: 'transactions', 
        id: 'invalid-id' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Format d\'ID invalide (UUID requis)')
    })

    it('should return 400 for missing table parameter', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/audit/entity//550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: '', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nom de table requis')
    })

    it('should return 400 for missing ID parameter', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/')
      const params = { 
        table: 'transactions', 
        id: '' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ID d\'enregistrement requis')
    })

    it('should handle service errors gracefully', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      mockGetEntityAuditHistory.mockRejectedValue(new Error('Failed to fetch entity audit history: Database error'))

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'transactions', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erreur lors de la récupération de l\'historique d\'audit')
    })

    it('should handle unexpected errors gracefully', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      mockGetEntityAuditHistory.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost/api/audit/entity/transactions/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'transactions', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erreur serveur interne')
    })

    it('should work for manager role', async () => {
      const mockSession = { user: { id: 'manager-1', role: 'manager' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockAuditHistory = []
      mockGetEntityAuditHistory.mockResolvedValue(mockAuditHistory)

      const request = new NextRequest('http://localhost/api/audit/entity/tasks/550e8400-e29b-41d4-a716-446655440000')
      const params = { 
        table: 'tasks', 
        id: '550e8400-e29b-41d4-a716-446655440000' 
      }

      const response = await getEntityAuditHandler(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.auditHistory).toEqual([])
      expect(data.data.total).toBe(0)
    })

    it('should work for all valid table types', async () => {
      const mockSession = { user: { id: 'admin-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const validTables = ['transactions', 'tasks', 'reservations', 'lofts']
      const mockAuditHistory = []
      mockGetEntityAuditHistory.mockResolvedValue(mockAuditHistory)

      for (const table of validTables) {
        const request = new NextRequest(`http://localhost/api/audit/entity/${table}/550e8400-e29b-41d4-a716-446655440000`)
        const params = { 
          table, 
          id: '550e8400-e29b-41d4-a716-446655440000' 
        }

        const response = await getEntityAuditHandler(request, { params })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.tableName).toBe(table)
      }
    })
  })
})