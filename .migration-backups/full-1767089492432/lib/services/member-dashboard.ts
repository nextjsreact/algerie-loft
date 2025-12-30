import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

interface MemberTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  due_date?: string
  loft?: {
    name: string
  }
  created_at: string
}

interface MemberDashboardData {
  userTasks: MemberTask[]
  taskStats: {
    total: number
    todo: number
    inProgress: number
    completed: number
    overdue: number
  }
}

export async function getMemberDashboardData(userId: string): Promise<MemberDashboardData> {
  return measurePerformance(async () => {
    logger.info('Fetching member dashboard data', { userId })
    const supabase = await createClient()

    try {
      // Get user's assigned tasks with loft information
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          due_date,
          created_at,
          loft:lofts(name)
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })

      if (tasksError) {
        logger.error('Error fetching member tasks', tasksError)
        throw tasksError
      }

      const userTasks: MemberTask[] = (tasks || []).map(task => ({
        ...task,
        loft: task.loft?.[0] || undefined
      }));
      
      // Calculate task statistics
      const taskStats = {
        total: userTasks.length,
        todo: userTasks.filter(task => task.status === 'todo').length,
        inProgress: userTasks.filter(task => task.status === 'in_progress').length,
        completed: userTasks.filter(task => task.status === 'completed').length,
        overdue: userTasks.filter(task => {
          if (!task.due_date) return false
          return new Date(task.due_date) < new Date() && task.status !== 'completed'
        }).length
      }

      logger.info('Member dashboard data fetched successfully', { 
        userId, 
        taskCount: userTasks.length,
        stats: taskStats 
      })

      return {
        userTasks: userTasks as MemberTask[],
        taskStats
      }
    } catch (error) {
      logger.error('Failed to fetch member dashboard data', error, { userId })
      throw error
    }
  }, 'getMemberDashboardData')
}