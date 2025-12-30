'use client'

import { useState, useMemo, useCallback } from 'react'
import { Task, UserRole } from '@/lib/types'
import { TaskPermissionService } from '@/lib/services/task-permissions'
import { DataFilterService, FilterConfig } from '@/lib/services/data-filter'

/**
 * Configuration for task management
 */
export interface TaskManagementConfig {
  userRole: UserRole
  userId: string
  assignedLoftIds?: string[]
  teamIds?: string[]
}

/**
 * Task filtering options
 */
export interface TaskFilterOptions {
  searchTerm?: string
  statusFilter?: string
  assigneeFilter?: string
  loftFilter?: string
  startDate?: string
  endDate?: string
  showOnlyAssigned?: boolean
  showOnlyCreated?: boolean
  includeCompleted?: boolean
}

/**
 * Return type for the useTaskManagement hook
 */
export interface UseTaskManagementReturn {
  /**
   * Filtered and permission-checked tasks
   */
  filteredTasks: Task[]
  
  /**
   * Task statistics
   */
  stats: {
    total: number
    todo: number
    inProgress: number
    completed: number
    myTasks: number
    overdue: number
    accessible: number
    filtered: number
  }
  
  /**
   * Check if user can perform actions
   */
  permissions: {
    canCreateTask: boolean
    canViewAllTasks: boolean
    canManageTasks: boolean
  }
  
  /**
   * Get permissions for a specific task
   */
  getTaskPermissions: (task: Task) => ReturnType<typeof TaskPermissionService.getAvailableActions>
  
  /**
   * Filter tasks by various criteria
   */
  filterTasks: (options: TaskFilterOptions) => Task[]
  
  /**
   * Get tasks assigned to current user
   */
  getMyTasks: () => Task[]
  
  /**
   * Get overdue tasks
   */
  getOverdueTasks: () => Task[]
  
  /**
   * Get tasks by status
   */
  getTasksByStatus: (status: string) => Task[]
  
  /**
   * Update task filters
   */
  updateFilters: (filters: Partial<TaskFilterOptions>) => void
  
  /**
   * Current filter state
   */
  currentFilters: TaskFilterOptions
}

/**
 * Custom hook for managing tasks with role-based permissions
 */
export function useTaskManagement(
  tasks: Task[],
  config: TaskManagementConfig,
  initialFilters: TaskFilterOptions = {}
): UseTaskManagementReturn {
  const { userRole, userId, assignedLoftIds = [], teamIds = [] } = config
  const [currentFilters, setCurrentFilters] = useState<TaskFilterOptions>(initialFilters)

  // Apply role-based data filtering first
  const accessibleTasks = useMemo(() => {
    const filterConfig: FilterConfig = {
      userRole,
      userId,
      assignedLoftIds,
      teamIds
    }

    const result = DataFilterService.filterTasks(tasks, filterConfig)
    return result.data
  }, [tasks, userRole, userId, assignedLoftIds, teamIds])

  // Apply additional filters
  const filteredTasks = useMemo(() => {
    return filterTasksWithOptions(accessibleTasks, currentFilters, userId)
  }, [accessibleTasks, currentFilters, userId])

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    
    return {
      total: tasks.length,
      accessible: accessibleTasks.length,
      filtered: filteredTasks.length,
      todo: accessibleTasks.filter(task => task.status === 'todo').length,
      inProgress: accessibleTasks.filter(task => task.status === 'in_progress').length,
      completed: accessibleTasks.filter(task => task.status === 'completed').length,
      myTasks: accessibleTasks.filter(task => task.assigned_to === userId).length,
      overdue: accessibleTasks.filter(task => 
        task.due_date && 
        new Date(task.due_date) < now && 
        task.status !== 'completed'
      ).length
    }
  }, [accessibleTasks, filteredTasks, tasks, userId])

  // User permissions
  const permissions = useMemo(() => ({
    canCreateTask: TaskPermissionService.canCreateTask(userRole),
    canViewAllTasks: ['admin', 'manager'].includes(userRole),
    canManageTasks: ['admin', 'manager'].includes(userRole)
  }), [userRole])

  // Get permissions for a specific task
  const getTaskPermissions = useCallback((task: Task) => {
    return TaskPermissionService.getAvailableActions(task, userRole, userId)
  }, [userRole, userId])

  // Filter tasks with options
  const filterTasks = useCallback((options: TaskFilterOptions) => {
    return filterTasksWithOptions(accessibleTasks, options, userId)
  }, [accessibleTasks, userId])

  // Get user's assigned tasks
  const getMyTasks = useCallback(() => {
    return TaskPermissionService.filterTasksForUser(
      accessibleTasks,
      userRole,
      userId,
      { showOnlyAssigned: true }
    )
  }, [accessibleTasks, userRole, userId])

  // Get overdue tasks
  const getOverdueTasks = useCallback(() => {
    const now = new Date()
    return accessibleTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'completed' &&
      TaskPermissionService.canViewTask(task, userRole, userId)
    )
  }, [accessibleTasks, userRole, userId])

  // Get tasks by status
  const getTasksByStatus = useCallback((status: string) => {
    return accessibleTasks.filter(task => 
      task.status === status &&
      TaskPermissionService.canViewTask(task, userRole, userId)
    )
  }, [accessibleTasks, userRole, userId])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TaskFilterOptions>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  return {
    filteredTasks,
    stats,
    permissions,
    getTaskPermissions,
    filterTasks,
    getMyTasks,
    getOverdueTasks,
    getTasksByStatus,
    updateFilters,
    currentFilters
  }
}

/**
 * Helper function to filter tasks with various options
 */
function filterTasksWithOptions(
  tasks: Task[], 
  options: TaskFilterOptions, 
  userId: string
): Task[] {
  const {
    searchTerm = '',
    statusFilter = 'all',
    assigneeFilter = 'all',
    loftFilter = 'all',
    startDate = '',
    endDate = '',
    showOnlyAssigned = false,
    showOnlyCreated = false,
    includeCompleted = true
  } = options

  return tasks.filter(task => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false
    }

    // Assignee filter
    if (assigneeFilter !== 'all' && task.assigned_to !== assigneeFilter) {
      return false
    }

    // Loft filter
    if (loftFilter !== 'all') {
      if (loftFilter === 'no_loft' && task.loft_id) {
        return false
      }
      if (loftFilter !== 'no_loft' && task.loft_id !== loftFilter) {
        return false
      }
    }

    // Date range filter
    if (startDate || endDate) {
      const taskDate = task.due_date ? new Date(task.due_date) : null
      
      if (startDate && (!taskDate || taskDate < new Date(startDate))) {
        return false
      }
      
      if (endDate && (!taskDate || taskDate > new Date(endDate))) {
        return false
      }
    }

    // Assignment filters
    if (showOnlyAssigned && task.assigned_to !== userId) {
      return false
    }

    if (showOnlyCreated && task.user_id !== userId) {
      return false
    }

    // Completion filter
    if (!includeCompleted && task.status === 'completed') {
      return false
    }

    return true
  })
}