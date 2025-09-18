/**
 * Task-Loft Analytics Service
 * Provides statistics and analytics for task-loft associations
 */

import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

export interface TaskLoftStats {
  totalTasks: number
  tasksWithLoft: number
  tasksWithoutLoft: number
  orphanedTasks: number
  loftsWithTasks: number
  loftsWithoutTasks: number
  averageTasksPerLoft: number
}

export interface LoftTaskBreakdown {
  loftId: string
  loftName: string
  loftAddress: string
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  completedTasks: number
  overdueTasks: number
}

export interface TaskStatusByLoft {
  loftId: string | null
  loftName: string | null
  todo: number
  in_progress: number
  completed: number
  total: number
}

export interface TaskLoftAnalytics {
  stats: TaskLoftStats
  loftBreakdown: LoftTaskBreakdown[]
  statusByLoft: TaskStatusByLoft[]
  orphanedTasks: Array<{
    id: string
    title: string
    orphanedLoftId: string
    status: string
  }>
  trends: {
    tasksCreatedThisMonth: number
    tasksCompletedThisMonth: number
    mostActiveLoft: string | null
    leastActiveLoft: string | null
  }
}

export async function getTaskLoftAnalytics(): Promise<TaskLoftAnalytics> {
  return measurePerformance(async () => {
    logger.info('Starting task-loft analytics fetch')
    const supabase = await createClient()

    try {
      // Fetch all required data in parallel
      const [
        { data: allTasks, error: tasksError },
        { data: allLofts, error: loftsError }
      ] = await Promise.all([
        supabase.from("tasks").select("*"),
        supabase.from("lofts").select("id, name, address")
      ])

      if (tasksError) throw tasksError
      if (loftsError) throw loftsError

      const tasks = allTasks || []
      const lofts = allLofts || []

      // Create loft lookup map
      const loftMap = new Map(lofts.map(loft => [loft.id, loft]))

      // Calculate basic statistics
      const tasksWithLoft = tasks.filter(task => task.loft_id).length
      const tasksWithoutLoft = tasks.filter(task => !task.loft_id).length
      
      // Identify orphaned tasks (loft_id exists but loft doesn't)
      const orphanedTasks = tasks
        .filter(task => task.loft_id && !loftMap.has(task.loft_id))
        .map(task => ({
          id: task.id,
          title: task.title,
          orphanedLoftId: task.loft_id,
          status: task.status
        }))

      // Calculate lofts with/without tasks
      const loftsWithTasksSet = new Set(
        tasks
          .filter(task => task.loft_id && loftMap.has(task.loft_id))
          .map(task => task.loft_id)
      )
      const loftsWithTasks = loftsWithTasksSet.size
      const loftsWithoutTasks = lofts.length - loftsWithTasks

      const stats: TaskLoftStats = {
        totalTasks: tasks.length,
        tasksWithLoft: tasksWithLoft - orphanedTasks.length, // Exclude orphaned
        tasksWithoutLoft,
        orphanedTasks: orphanedTasks.length,
        loftsWithTasks,
        loftsWithoutTasks,
        averageTasksPerLoft: loftsWithTasks > 0 ? (tasksWithLoft - orphanedTasks.length) / loftsWithTasks : 0
      }

      // Calculate loft breakdown
      const loftBreakdown: LoftTaskBreakdown[] = lofts.map(loft => {
        const loftTasks = tasks.filter(task => task.loft_id === loft.id)
        const now = new Date()
        
        return {
          loftId: loft.id,
          loftName: loft.name,
          loftAddress: loft.address,
          totalTasks: loftTasks.length,
          todoTasks: loftTasks.filter(task => task.status === 'todo').length,
          inProgressTasks: loftTasks.filter(task => task.status === 'in_progress').length,
          completedTasks: loftTasks.filter(task => task.status === 'completed').length,
          overdueTasks: loftTasks.filter(task => 
            task.due_date && 
            new Date(task.due_date) < now && 
            task.status !== 'completed'
          ).length
        }
      }).sort((a, b) => b.totalTasks - a.totalTasks) // Sort by most tasks first

      // Calculate status by loft (including tasks without loft)
      const statusByLoft: TaskStatusByLoft[] = []
      
      // Add lofts with tasks
      lofts.forEach(loft => {
        const loftTasks = tasks.filter(task => task.loft_id === loft.id)
        if (loftTasks.length > 0) {
          statusByLoft.push({
            loftId: loft.id,
            loftName: loft.name,
            todo: loftTasks.filter(task => task.status === 'todo').length,
            in_progress: loftTasks.filter(task => task.status === 'in_progress').length,
            completed: loftTasks.filter(task => task.status === 'completed').length,
            total: loftTasks.length
          })
        }
      })

      // Add tasks without loft
      const tasksWithoutLoftList = tasks.filter(task => !task.loft_id)
      if (tasksWithoutLoftList.length > 0) {
        statusByLoft.push({
          loftId: null,
          loftName: null,
          todo: tasksWithoutLoftList.filter(task => task.status === 'todo').length,
          in_progress: tasksWithoutLoftList.filter(task => task.status === 'in_progress').length,
          completed: tasksWithoutLoftList.filter(task => task.status === 'completed').length,
          total: tasksWithoutLoftList.length
        })
      }

      // Calculate trends (current month)
      const currentMonth = new Date()
      currentMonth.setDate(1) // First day of current month
      
      const tasksThisMonth = tasks.filter(task => 
        new Date(task.created_at) >= currentMonth
      )
      
      const completedThisMonth = tasks.filter(task => 
        task.status === 'completed' && 
        task.updated_at &&
        new Date(task.updated_at) >= currentMonth
      )

      // Find most and least active lofts
      const activeLofts = loftBreakdown.filter(loft => loft.totalTasks > 0)
      const mostActiveLoft = activeLofts.length > 0 ? activeLofts[0].loftName : null
      const leastActiveLoft = activeLofts.length > 1 ? 
        activeLofts[activeLofts.length - 1].loftName : null

      const trends = {
        tasksCreatedThisMonth: tasksThisMonth.length,
        tasksCompletedThisMonth: completedThisMonth.length,
        mostActiveLoft,
        leastActiveLoft
      }

      logger.info('Task-loft analytics completed', { 
        totalTasks: stats.totalTasks,
        loftsAnalyzed: lofts.length,
        orphanedTasks: stats.orphanedTasks
      })

      return {
        stats,
        loftBreakdown,
        statusByLoft,
        orphanedTasks,
        trends
      }

    } catch (error) {
      logger.error('Task-loft analytics error', error)
      throw new Error('Failed to fetch task-loft analytics')
    }
  }, 'getTaskLoftAnalytics')
}

/**
 * Get task completion rate by loft
 */
export async function getTaskCompletionRateByLoft(): Promise<Array<{
  loftId: string
  loftName: string
  completionRate: number
  totalTasks: number
  completedTasks: number
}>> {
  return measurePerformance(async () => {
    const supabase = await createClient()

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("loft_id, status, lofts(id, name)")
      .not("loft_id", "is", null)

    if (tasksError) throw tasksError

    // Group tasks by loft
    const loftTasksMap = new Map()
    
    tasks?.forEach(task => {
      if (!task.loft_id || !task.lofts) return
      
      const loftId = task.loft_id
      if (!loftTasksMap.has(loftId)) {
        loftTasksMap.set(loftId, {
          loftId,
          loftName: task.lofts.name,
          totalTasks: 0,
          completedTasks: 0
        })
      }
      
      const loftData = loftTasksMap.get(loftId)
      loftData.totalTasks++
      if (task.status === 'completed') {
        loftData.completedTasks++
      }
    })

    // Calculate completion rates
    return Array.from(loftTasksMap.values()).map(loft => ({
      ...loft,
      completionRate: loft.totalTasks > 0 ? (loft.completedTasks / loft.totalTasks) * 100 : 0
    })).sort((a, b) => b.completionRate - a.completionRate)

  }, 'getTaskCompletionRateByLoft')
}

/**
 * Get task distribution across lofts
 */
export async function getTaskDistributionByLoft(): Promise<Array<{
  loftId: string
  loftName: string
  taskCount: number
  percentage: number
}>> {
  return measurePerformance(async () => {
    const analytics = await getTaskLoftAnalytics()
    const totalTasksWithLoft = analytics.stats.tasksWithLoft
    
    return analytics.loftBreakdown
      .filter(loft => loft.totalTasks > 0)
      .map(loft => ({
        loftId: loft.loftId,
        loftName: loft.loftName,
        taskCount: loft.totalTasks,
        percentage: totalTasksWithLoft > 0 ? (loft.totalTasks / totalTasksWithLoft) * 100 : 0
      }))
      .sort((a, b) => b.taskCount - a.taskCount)

  }, 'getTaskDistributionByLoft')
}