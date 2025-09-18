/**
 * Integration tests for Task-Loft Association functionality
 * Tests the core business logic for associating tasks with lofts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  in: jest.fn(),
  is: jest.fn(),
  not: jest.fn(),
  order: jest.fn(),
  single: jest.fn(),
}

// Mock the createClient function
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id', role: 'admin' }
  }))
}))

// Import the functions to test after mocking
import { getTasks, createTask, updateTask, getTasksByLoft, getTasksWithoutLoft, getTasksWithOrphanedLofts } from '@/app/actions/tasks'

describe('Task-Loft Association Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock chain
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.in.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.is.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.not.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient)
  })

  describe('getTasks with loft information', () => {
    it('should return tasks with loft information when lofts exist', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', loft_id: 'loft-1', status: 'todo' },
        { id: '2', title: 'Task 2', loft_id: 'loft-2', status: 'in_progress' },
        { id: '3', title: 'Task 3', loft_id: null, status: 'completed' }
      ]

      const mockLofts = [
        { id: 'loft-1', name: 'Loft A', address: '123 Main St' },
        { id: 'loft-2', name: 'Loft B', address: '456 Oak Ave' }
      ]

      // Mock tasks query
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockTasks,
        error: null
      })

      // Mock lofts query
      mockSupabaseClient.in.mockResolvedValueOnce({
        data: mockLofts,
        error: null
      })

      const result = await getTasks()

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        id: '1',
        title: 'Task 1',
        loft: { id: 'loft-1', name: 'Loft A', address: '123 Main St' }
      })
      expect(result[1]).toMatchObject({
        id: '2',
        title: 'Task 2',
        loft: { id: 'loft-2', name: 'Loft B', address: '456 Oak Ave' }
      })
      expect(result[2]).toMatchObject({
        id: '3',
        title: 'Task 3',
        loft: null
      })
    })

    it('should detect orphaned loft references', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', loft_id: 'loft-1', status: 'todo' },
        { id: '2', title: 'Task 2', loft_id: 'deleted-loft', status: 'in_progress' }
      ]

      const mockLofts = [
        { id: 'loft-1', name: 'Loft A', address: '123 Main St' }
        // Note: 'deleted-loft' is not in the lofts array
      ]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockTasks,
        error: null
      })

      mockSupabaseClient.in.mockResolvedValueOnce({
        data: mockLofts,
        error: null
      })

      const result = await getTasks()

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: '1',
        loft: { id: 'loft-1', name: 'Loft A' }
      })
      expect(result[1]).toMatchObject({
        id: '2',
        loft: null,
        isOrphaned: true,
        orphanedLoftId: 'deleted-loft'
      })
    })
  })

  describe('createTask with loft association', () => {
    it('should create task with valid loft_id', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'todo',
        loft_id: 'valid-loft-id',
        due_date: '2024-12-31'
      }

      // Mock loft validation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'valid-loft-id' },
        error: null
      })

      // Mock task creation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-task-id', ...taskData },
        error: null
      })

      // Mock redirect
      const mockRedirect = jest.fn()
      jest.doMock('next/navigation', () => ({
        redirect: mockRedirect
      }))

      await expect(createTask(taskData)).resolves.not.toThrow()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lofts')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
    })

    it('should reject task creation with invalid loft_id', async () => {
      const taskData = {
        title: 'New Task',
        loft_id: 'invalid-loft-id'
      }

      // Mock loft validation failure
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Loft not found' }
      })

      await expect(createTask(taskData)).rejects.toThrow('Invalid loft ID provided')
    })
  })

  describe('getTasksByLoft', () => {
    it('should return tasks filtered by loft', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', loft_id: 'target-loft' },
        { id: '2', title: 'Task 2', loft_id: 'target-loft' }
      ]

      const mockLofts = [
        { id: 'target-loft', name: 'Target Loft', address: '123 Main St' }
      ]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockTasks,
        error: null
      })

      mockSupabaseClient.in.mockResolvedValueOnce({
        data: mockLofts,
        error: null
      })

      const result = await getTasksByLoft('target-loft')

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('loft_id', 'target-loft')
      expect(result).toHaveLength(2)
      expect(result.every(task => task.loft?.id === 'target-loft')).toBe(true)
    })
  })

  describe('getTasksWithoutLoft', () => {
    it('should return tasks without loft association', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', loft_id: null },
        { id: '2', title: 'Task 2', loft_id: null }
      ]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockTasks,
        error: null
      })

      const result = await getTasksWithoutLoft()

      expect(mockSupabaseClient.is).toHaveBeenCalledWith('loft_id', null)
      expect(result).toHaveLength(2)
      expect(result.every(task => task.loft === null)).toBe(true)
    })
  })

  describe('getTasksWithOrphanedLofts', () => {
    it('should identify tasks with orphaned loft references', async () => {
      const mockTasksWithLofts = [
        { id: '1', title: 'Task 1', loft_id: 'existing-loft' },
        { id: '2', title: 'Task 2', loft_id: 'deleted-loft' }
      ]

      const mockExistingLofts = [
        { id: 'existing-loft' }
      ]

      // Mock tasks query
      mockSupabaseClient.not.mockReturnValue(mockSupabaseClient)
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockTasksWithLofts,
        error: null
      })

      // Mock lofts query
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockExistingLofts,
        error: null
      })

      const result = await getTasksWithOrphanedLofts()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: '2',
        title: 'Task 2',
        isOrphaned: true,
        orphanedLoftId: 'deleted-loft'
      })
    })
  })

  describe('updateTask with loft association', () => {
    it('should update task with valid loft_id', async () => {
      const taskId = 'test-task-id'
      const updateData = {
        title: 'Updated Task',
        loft_id: 'new-loft-id'
      }

      // Mock task fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { 
          id: taskId, 
          title: 'Original Task',
          assigned_to: 'test-user-id',
          status: 'todo',
          due_date: null
        },
        error: null
      })

      // Mock loft validation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'new-loft-id' },
        error: null
      })

      // Mock task update
      mockSupabaseClient.update.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await expect(updateTask(taskId, updateData)).resolves.not.toThrow()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lofts')
      expect(mockSupabaseClient.update).toHaveBeenCalled()
    })

    it('should reject update with invalid loft_id', async () => {
      const taskId = 'test-task-id'
      const updateData = {
        loft_id: 'invalid-loft-id'
      }

      // Mock task fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { 
          id: taskId,
          assigned_to: 'test-user-id'
        },
        error: null
      })

      // Mock loft validation failure
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Loft not found' }
      })

      await expect(updateTask(taskId, updateData)).rejects.toThrow('Invalid loft ID provided')
    })
  })
})