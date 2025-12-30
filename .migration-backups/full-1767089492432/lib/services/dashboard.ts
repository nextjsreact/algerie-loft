import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

export interface DashboardStats {
  totalLofts: number
  occupiedLofts: number
  activeTasks: number
  monthlyRevenue: number
  totalTeams: number
  tasksWithLoft: number
  tasksWithoutLoft: number
  orphanedTasks: number
  loftsWithTasks: number
}

export interface DashboardData {
  stats: DashboardStats
  recentTasks: any[]
  monthlyRevenue: any[]
  errors: string[]
}

export async function getDashboardData(): Promise<DashboardData> {
  return measurePerformance(async () => {
    logger.info('Starting dashboard data fetch')
    const supabase = await createClient()
    const errors: string[] = []

    try {
      // Fetch all data in parallel for better performance
      const [
        { data: loftsData, error: loftsError },
        { data: tasksData, error: tasksError },
        { data: teamsData, error: teamsError },
        { data: transactionsData, error: transactionsError },
        { data: recentTasksData, error: recentTasksError },
        { data: monthlyRevenueData, error: monthlyRevenueError }
      ] = await Promise.all([
        supabase.from("lofts").select("*"),
        supabase.from("tasks").select("id, status").in("status", ["todo", "in_progress"]),
        supabase.from("teams").select("id"),
        supabase.from("transactions").select("amount").eq("transaction_type", "income").eq("status", "completed"),
        supabase.from("tasks").select("*, assigned_user:profiles(full_name), loft:lofts(name)").order("updated_at", { ascending: false }).limit(5),
        supabase.rpc('calculate_monthly_revenue')
      ])

      // Collect errors but don't fail completely
      const errorMappings = [
        { error: loftsError, name: 'lofts' },
        { error: tasksError, name: 'tasks' },
        { error: teamsError, name: 'teams' },
        { error: transactionsError, name: 'transactions' },
        { error: recentTasksError, name: 'recent tasks' },
        { error: monthlyRevenueError, name: 'monthly revenue' }
      ]

      errorMappings.forEach(({ error, name }) => {
        if (error) {
          const errorMsg = `Failed to fetch ${name}: ${error.message}`
          errors.push(errorMsg)
          logger.warn(errorMsg, { error, category: 'dashboard' })
        }
      })

      // Get all tasks for loft statistics
      const { data: allTasksData, error: allTasksError } = await supabase
        .from("tasks")
        .select("loft_id")

      if (allTasksError) {
        errors.push(`Failed to fetch all tasks for loft stats: ${allTasksError.message}`)
      }

      // Calculate loft-related statistics
      const allTasks = allTasksData || []
      const tasksWithLoft = allTasks.filter(task => task.loft_id).length
      const tasksWithoutLoft = allTasks.filter(task => !task.loft_id).length
      
      // Calculate orphaned tasks (simplified check)
      const loftIds = new Set((loftsData || []).map(loft => loft.id))
      const orphanedTasks = allTasks.filter(task => 
        task.loft_id && !loftIds.has(task.loft_id)
      ).length

      // Calculate lofts with tasks
      const loftsWithTasksSet = new Set(
        allTasks
          .filter(task => task.loft_id && loftIds.has(task.loft_id))
          .map(task => task.loft_id)
      )

      // Calculate stats with fallback values
      const stats: DashboardStats = {
        totalLofts: loftsData?.length || 0,
        occupiedLofts: (loftsData || []).filter(l => l.status === 'occupied').length || 0,
        activeTasks: (tasksData || []).length || 0,
        monthlyRevenue: (transactionsData || []).reduce((acc, t) => acc + t.amount, 0) || 0,
        totalTeams: (teamsData || []).length || 0,
        tasksWithLoft: tasksWithLoft - orphanedTasks, // Exclude orphaned
        tasksWithoutLoft,
        orphanedTasks,
        loftsWithTasks: loftsWithTasksSet.size
      }

      const recentTasks = (recentTasksData || []).map((task: any) => ({
        ...task,
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        assigned_user: task.assigned_user,
        loft: task.loft,
      }))

      logger.info('Dashboard data fetch completed', { 
        stats, 
        errorsCount: errors.length,
        recentTasksCount: recentTasks.length 
      })

      return {
        stats,
        recentTasks,
        monthlyRevenue: monthlyRevenueData || [],
        errors
      }
    } catch (error) {
      logger.error('Dashboard service error', error, { category: 'dashboard' })
      throw new Error('Failed to fetch dashboard data')
    }
  }, 'getDashboardData')
}