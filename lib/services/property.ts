import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

export interface MaintenanceSchedule {
  id: string
  loft_id: string
  loft_name: string
  task_type: 'inspection' | 'cleaning' | 'repair' | 'upgrade'
  description: string
  scheduled_date: string
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time'
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
  estimated_cost: number
  assigned_to?: string
}

export interface PropertyDocument {
  id: string
  loft_id: string
  document_type: 'contract' | 'insurance' | 'inspection' | 'photo' | 'other'
  file_name: string
  file_url: string
  upload_date: string
  expiry_date?: string
  description?: string
}

export interface OccupancyTrend {
  month: string
  occupancy_rate: number
  total_lofts: number
  occupied_lofts: number
  revenue: number
}

export interface PropertyAnalytics {
  occupancyTrends: OccupancyTrend[]
  maintenanceCosts: { month: string; cost: number }[]
  revenueByProperty: { loft_name: string; revenue: number }[]
  averageTenancyDuration: number
}

export async function getMaintenanceSchedule(loftId?: string): Promise<MaintenanceSchedule[]> {
  return measurePerformance(async () => {
    logger.info('Fetching maintenance schedule', { loftId })
    const supabase = await createClient()

    try {
      let query = supabase
        .from('maintenance_tasks')
        .select(`
          id,
          loft_id,
          task_type,
          description,
          scheduled_date,
          frequency,
          status,
          estimated_cost,
          assigned_to,
          loft:lofts(name)
        `)
        .order('scheduled_date', { ascending: true })

      if (loftId) {
        query = query.eq('loft_id', loftId)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Error fetching maintenance schedule', error)
        throw error
      }

      const schedule: MaintenanceSchedule[] = (data || []).map(task => {
        const scheduledDate = new Date(task.scheduled_date)
        const now = new Date()
        const isOverdue = scheduledDate < now && task.status !== 'completed'

        return {
          id: task.id,
          loft_id: task.loft_id,
          loft_name: task.loft?.[0]?.name || 'Unknown',
          task_type: task.task_type,
          description: task.description,
          scheduled_date: task.scheduled_date,
          frequency: task.frequency,
          status: isOverdue ? 'overdue' : task.status,
          estimated_cost: task.estimated_cost || 0,
          assigned_to: task.assigned_to
        }
      })

      logger.info('Maintenance schedule fetched', { count: schedule.length })
      return schedule

    } catch (error) {
      logger.error('Failed to fetch maintenance schedule', error)
      throw error
    }
  }, 'getMaintenanceSchedule')
}

export async function schedulePreventiveMaintenance(loftId: string): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Scheduling preventive maintenance', { loftId })
    const supabase = await createClient()

    try {
      const now = new Date()
      
      // Define standard preventive maintenance tasks
      const maintenanceTasks = [
        {
          task_type: 'inspection',
          description: 'Quarterly property inspection',
          frequency: 'quarterly',
          estimated_cost: 100,
          months_offset: 3
        },
        {
          task_type: 'cleaning',
          description: 'Deep cleaning and maintenance',
          frequency: 'monthly',
          estimated_cost: 150,
          months_offset: 1
        },
        {
          task_type: 'inspection',
          description: 'Annual safety inspection',
          frequency: 'yearly',
          estimated_cost: 300,
          months_offset: 12
        }
      ]

      const scheduledTasks = maintenanceTasks.map(task => {
        const scheduledDate = new Date(now)
        scheduledDate.setMonth(scheduledDate.getMonth() + task.months_offset)

        return {
          loft_id: loftId,
          task_type: task.task_type,
          description: task.description,
          scheduled_date: scheduledDate.toISOString(),
          frequency: task.frequency,
          status: 'scheduled',
          estimated_cost: task.estimated_cost,
          created_at: now.toISOString()
        }
      })

      const { error } = await supabase
        .from('maintenance_tasks')
        .insert(scheduledTasks)

      if (error) {
        throw error
      }

      logger.info('Preventive maintenance scheduled', { loftId, tasksCount: scheduledTasks.length })

    } catch (error) {
      logger.error('Failed to schedule preventive maintenance', error, { loftId })
      throw error
    }
  }, 'schedulePreventiveMaintenance')
}

export async function getPropertyDocuments(loftId: string): Promise<PropertyDocument[]> {
  return measurePerformance(async () => {
    logger.info('Fetching property documents', { loftId })
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('loft_id', loftId)
        .order('upload_date', { ascending: false })

      if (error) {
        logger.error('Error fetching property documents', error)
        throw error
      }

      const documents: PropertyDocument[] = (data || []).map(doc => ({
        id: doc.id,
        loft_id: doc.loft_id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_url: doc.file_url,
        upload_date: doc.upload_date,
        expiry_date: doc.expiry_date,
        description: doc.description
      }))

      logger.info('Property documents fetched', { loftId, count: documents.length })
      return documents

    } catch (error) {
      logger.error('Failed to fetch property documents', error, { loftId })
      throw error
    }
  }, 'getPropertyDocuments')
}

export async function getPropertyAnalytics(months: number = 12): Promise<PropertyAnalytics> {
  return measurePerformance(async () => {
    logger.info('Fetching property analytics', { months })
    const supabase = await createClient()

    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      // Fetch occupancy trends
      const { data: occupancyData, error: occupancyError } = await supabase
        .rpc('get_occupancy_trends', { start_date: startDate.toISOString() })

      // Fetch maintenance costs
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('transaction_type', 'expense')
        .like('description', '%maintenance%')
        .gte('created_at', startDate.toISOString())

      // Fetch revenue by property
      const { data: revenueData, error: revenueError } = await supabase
        .from('transactions')
        .select(`
          amount,
          loft:lofts(name)
        `)
        .eq('transaction_type', 'income')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())

      if (occupancyError || maintenanceError || revenueError) {
        logger.error('Error fetching analytics data', { occupancyError, maintenanceError, revenueError })
        throw new Error('Failed to fetch analytics data')
      }

      // Process occupancy trends
      const occupancyTrends: OccupancyTrend[] = (occupancyData || []).map((trend: OccupancyTrend) => ({
        month: trend.month,
        occupancy_rate: trend.occupancy_rate,
        total_lofts: trend.total_lofts,
        occupied_lofts: trend.occupied_lofts,
        revenue: trend.revenue
      }))

      // Process maintenance costs by month
      const maintenanceCostsByMonth = new Map<string, number>()
      ;(maintenanceData || []).forEach(expense => {
        const month = new Date(expense.created_at).toISOString().substring(0, 7)
        maintenanceCostsByMonth.set(month, (maintenanceCostsByMonth.get(month) || 0) + expense.amount)
      })

      const maintenanceCosts = Array.from(maintenanceCostsByMonth.entries()).map(([month, cost]) => ({
        month,
        cost
      }))

      // Process revenue by property
      const revenueByPropertyMap = new Map<string, number>()
      ;(revenueData || []).forEach(transaction => {
        const loftName = transaction.loft?.[0]?.name || 'Unknown'
        revenueByPropertyMap.set(loftName, (revenueByPropertyMap.get(loftName) || 0) + transaction.amount)
      })

      const revenueByProperty = Array.from(revenueByPropertyMap.entries()).map(([loft_name, revenue]) => ({
        loft_name,
        revenue
      }))

      // Calculate average tenancy duration (placeholder - would need lease data)
      const averageTenancyDuration = 12 // months - this would be calculated from actual lease data

      const analytics: PropertyAnalytics = {
        occupancyTrends,
        maintenanceCosts,
        revenueByProperty,
        averageTenancyDuration
      }

      logger.info('Property analytics calculated', { 
        occupancyTrendsCount: occupancyTrends.length,
        maintenanceCostsCount: maintenanceCosts.length,
        revenueByPropertyCount: revenueByProperty.length
      })

      return analytics

    } catch (error) {
      logger.error('Failed to fetch property analytics', error)
      throw error
    }
  }, 'getPropertyAnalytics')
}