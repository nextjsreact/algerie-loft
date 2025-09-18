/**
 * Integration tests for Task-Loft API endpoints
 * Tests the API layer for task-loft association functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock auth
const mockRequireAuthAPI = jest.fn()
jest.mock('@/lib/auth', () => ({
  requireAuthAPI: mockRequireAuthAPI
}))

// Mock task actions
const mockGetTasks = jest.fn()
const mockGetTasksByLoft = jest.fn()
const mockGetTasksWithoutLoft = jest.fn()
const mockGetTasksWithOrphanedLofts = jest.fn()
const mockCleanupOrphanedLoftReferences = jest.fn()
const mockReassignOrphanedTasksToLoft = jest.fn()

jest.mock('@/app/actions/tasks', () => ({
  getTasks: mockGetTasks,
  getTasksByLoft: mockGetTasksByLoft,
  getTasksWithoutLoft: mockGetTasksWithoutLoft,
  getTasksWithOrphanedLofts: mockGetTasksWithOrphanedLofts,
  cleanupOrphanedLoftReferences: mockCleanupOrphanedLoftReferences,
  reassignOrphanedTasksToLoft: mockReassignOrphanedTasksToLoft
}))

// Import handlers after mocking
import { GET as getTasksHandler } from '@/app/api/tasks/route'
import { GET as getTasksByLoftHandler } from '@/app/api/tasks/by-loft/[loftId]/route'
import { GET as getTasksWithoutLoftHandler } from '@/app/api/tasks/without-loft/route'
import { GET as getOrphanedTasksHandler, DELETE as cleanupOrphanedHandler } from '@/app/api/tasks/orphaned/route'
import { POST as reassignTasksHandler } from '@/app/api/tasks/reassign/route'

describe('Task-Loft API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/tasks', () => {
    it('should return tasks with loft information', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockTasks = [
        { 
          id: '1', 
          title: 'Task 1', 
          loft: { id: 'loft-1', name: 'Loft A', address: '123 Main St' } 
        },
        { 
          id: '2', 
          title: 'Task 2', 
          loft: null 
        }
      ]
      mockGetTasks.mockResolvedValue(mockTasks)

      const request = new NextRequest('http://localhost/api/tasks')
      const response = await getTasksHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tasks).toHaveLength(2)
      expect(data.tasks[0].loft).toEqual({ id: 'loft-1', name: 'Loft A', address: '123 Main St' })
      expect(data.tasks[1].loft).toBeNull()
      expect(data.total).toBe(2)
    })

    it('should require authentication', async () => {
      mockRequireAuthAPI.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/tasks')
      const response = await getTasksHandler(request)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/tasks/by-loft/[loftId]', () => {
    it('should return tasks filtered by loft', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockTasks = [
        { id: '1', title: 'Task 1', loft_id: 'loft-1' },
        { id: '2', title: 'Task 2', loft_id: 'loft-1' }
      ]
      mockGetTasksByLoft.mockResolvedValue(mockTasks)

      const request = new NextRequest('http://localhost/api/tasks/by-loft/loft-1')
      const response = await getTasksByLoftHandler(request, { params: { loftId: 'loft-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tasks).toHaveLength(2)
      expect(data.loftId).toBe('loft-1')
      expect(mockGetTasksByLoft).toHaveBeenCalledWith('loft-1')
    })

    it('should require admin or manager role', async () => {
      const mockSession = { user: { id: 'user-1', role: 'member' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/tasks/by-loft/loft-1')
      const response = await getTasksByLoftHandler(request, { params: { loftId: 'loft-1' } })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/tasks/without-loft', () => {
    it('should return tasks without loft association', async () => {
      const mockSession = { user: { id: 'user-1', role: 'manager' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockTasks = [
        { id: '1', title: 'Task 1', loft_id: null },
        { id: '2', title: 'Task 2', loft_id: null }
      ]
      mockGetTasksWithoutLoft.mockResolvedValue(mockTasks)

      const request = new NextRequest('http://localhost/api/tasks/without-loft')
      const response = await getTasksWithoutLoftHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tasks).toHaveLength(2)
      expect(data.tasks.every((task: any) => task.loft_id === null)).toBe(true)
    })
  })

  describe('GET /api/tasks/orphaned', () => {
    it('should return orphaned tasks', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockOrphanedTasks = [
        { 
          id: '1', 
          title: 'Orphaned Task', 
          isOrphaned: true, 
          orphanedLoftId: 'deleted-loft' 
        }
      ]
      mockGetTasksWithOrphanedLofts.mockResolvedValue(mockOrphanedTasks)

      const request = new NextRequest('http://localhost/api/tasks/orphaned')
      const response = await getOrphanedTasksHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0].isOrphaned).toBe(true)
    })
  })

  describe('DELETE /api/tasks/orphaned', () => {
    it('should cleanup orphaned references', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockCleanupResult = {
        cleaned: 3,
        tasks: [
          { id: '1', title: 'Task 1', orphanedLoftId: 'deleted-1' },
          { id: '2', title: 'Task 2', orphanedLoftId: 'deleted-2' },
          { id: '3', title: 'Task 3', orphanedLoftId: 'deleted-3' }
        ]
      }
      mockCleanupOrphanedLoftReferences.mockResolvedValue(mockCleanupResult)

      const request = new NextRequest('http://localhost/api/tasks/orphaned', { method: 'DELETE' })
      const response = await cleanupOrphanedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cleaned).toBe(3)
      expect(data.message).toContain('3 références orphelines nettoyées')
    })

    it('should require admin role for cleanup', async () => {
      const mockSession = { user: { id: 'user-1', role: 'manager' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/tasks/orphaned', { method: 'DELETE' })
      const response = await cleanupOrphanedHandler(request)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/tasks/reassign', () => {
    it('should reassign tasks to new loft', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const mockReassignResult = {
        reassigned: 2,
        loft: { id: 'new-loft', name: 'New Loft' },
        taskIds: ['task-1', 'task-2']
      }
      mockReassignOrphanedTasksToLoft.mockResolvedValue(mockReassignResult)

      const requestBody = {
        newLoftId: 'new-loft',
        taskIds: ['task-1', 'task-2']
      }

      const request = new NextRequest('http://localhost/api/tasks/reassign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await reassignTasksHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reassigned).toBe(2)
      expect(data.message).toContain('2 tâches réassignées au loft New Loft')
      expect(mockReassignOrphanedTasksToLoft).toHaveBeenCalledWith('new-loft', ['task-1', 'task-2'])
    })

    it('should validate request body', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      const invalidRequestBody = {
        newLoftId: 'new-loft'
        // Missing taskIds
      }

      const request = new NextRequest('http://localhost/api/tasks/reassign', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await reassignTasksHandler(request)

      expect(response.status).toBe(400)
    })

    it('should handle reassignment errors', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      mockReassignOrphanedTasksToLoft.mockRejectedValue(new Error('Invalid loft ID provided'))

      const requestBody = {
        newLoftId: 'invalid-loft',
        taskIds: ['task-1']
      }

      const request = new NextRequest('http://localhost/api/tasks/reassign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await reassignTasksHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Invalid loft ID provided')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSession = { user: { id: 'user-1', role: 'admin' } }
      mockRequireAuthAPI.mockResolvedValue(mockSession)

      mockGetTasks.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/tasks')
      const response = await getTasksHandler(request)

      expect(response.status).toBe(500)
    })

    it('should handle authentication errors', async () => {
      mockRequireAuthAPI.mockRejectedValue(new Error('Authentication failed'))

      const request = new NextRequest('http://localhost/api/tasks')
      const response = await getTasksHandler(request)

      expect(response.status).toBe(500)
    })
  })
})