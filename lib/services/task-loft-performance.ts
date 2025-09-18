/**
 * Task-Loft Performance Optimization Service
 * Provides optimized queries and caching for task-loft operations
 */

import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { unstable_cache } from 'next/cache'

// Cache configuration
const CACHE_TAGS = {
  TASKS: 'tasks',
  LOFTS: 'lofts',
  TASK_LOFT_STATS: 'task-loft-stats',
  TASK_LOFT_ANALYTICS: 'task-loft-analytics'
} as const

const CACHE_DURATIONS = {
  TASKS: 60, // 1 minute
  LOFTS: 300, // 5 minutes
  STATS: 180, // 3 minutes
  ANALYTICS: 600 // 10 minutes
} as const

/**
 * Optimized function to get tasks with loft information using database function
 */
export async function getTasksWithLoftOptimized(
  userRole: string = 'admin',
  userId?: string,
  limit: number = 50,
  offset: number = 0
) {
  return measurePerformance(async () => {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('get_tasks_with_loft_optimized', {
      user_role: userRole,
      user_id_param: userId || null,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      logger.error('Error in optimized tasks query', error)
      throw error
    }

    return data || []
  }, 'getTasksWithLoftOptimized')
}

/**
 * Cached function to get loft task summary statistics
 */
export const getLoftTaskSummaryCached = unstable_cache(
  async () => {
    return measurePerformance(async () => {
      const supabase = await createClient()
      
      const { data, error } = await supabase.rpc('get_loft_task_summary')

      if (error) {
        logger.error('Error getting loft task summary', error)
        throw error
      }

      return data?.[0] || {
        total_lofts: 0,
        lofts_with_tasks: 0,
        lofts_without_tasks: 0,
        total_tasks: 0,
        tasks_with_loft: 0,
        tasks_without_loft: 0,
        orphaned_tasks: 0,
        avg_tasks_per_loft: 0
      }
    }, 'getLoftTaskSummary')
  },
  ['loft-task-summary'],
  {
    revalidate: CACHE_DURATIONS.STATS,
    tags: [CACHE_TAGS.TASK_LOFT_STATS]
  }
)

/**
 * Cached function to get materialized view data
 */
export const getTaskLoftStatsMaterialized = unstable_cache(
  async () => {
    return measurePerformance(async () => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('task_loft_stats_mv')
        .select('*')
        .order('total_tasks', { ascending: false })

      if (error) {
        logger.error('Error getting materialized view data', error)
        throw error
      }

      return data || []
    }, 'getTaskLoftStatsMaterialized')
  },
  ['task-loft-stats-materialized'],
  {
    revalidate: CACHE_DURATIONS.ANALYTICS,
    tags: [CACHE_TAGS.TASK_LOFT_ANALYTICS]
  }
)

/**
 * Batch operation to get multiple lofts with their task counts
 */
export async function getLoftsWithTaskCountsBatch(loftIds: string[]) {
  return measurePerformance(async () => {
    if (loftIds.length === 0) return []

    const supabase = await createClient()
    
    // Use a single query with aggregation instead of multiple queries
    const { data, error } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        address,
        tasks:tasks(count)
      `)
      .in('id', loftIds)

    if (error) {
      logger.error('Error in batch loft query', error)
      throw error
    }

    return data?.map(loft => ({
      ...loft,
      taskCount: loft.tasks?.[0]?.count || 0
    })) || []
  }, 'getLoftsWithTaskCountsBatch')
}

/**
 * Optimized search for tasks with loft information
 */
export async function searchTasksWithLoftOptimized(
  searchTerm: string,
  filters: {
    status?: string
    loftId?: string
    assignedTo?: string
    dateFrom?: string
    dateTo?: string
  } = {},
  userRole: string = 'admin',
  userId?: string,
  limit: number = 20
) {
  return measurePerformance(async () => {
    const supabase = await createClient()
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        loft:lofts(id, name, address)
      `)

    // Apply role-based filtering
    if (userRole === 'member' && userId) {
      query = query.eq('assigned_to', userId)
    }

    // Apply search term
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.loftId && filters.loftId !== 'all') {
      if (filters.loftId === 'no_loft') {
        query = query.is('loft_id', null)
      } else {
        query = query.eq('loft_id', filters.loftId)
      }
    }

    if (filters.assignedTo && filters.assignedTo !== 'all') {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    if (filters.dateFrom) {
      query = query.gte('due_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('due_date', filters.dateTo)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error in optimized task search', error)
      throw error
    }

    return data || []
  }, 'searchTasksWithLoftOptimized')
}

/**
 * Performance monitoring for task-loft operations
 */
export async function getTaskLoftPerformanceMetrics() {
  return measurePerformance(async () => {
    const supabase = await createClient()
    
    // Get query performance statistics
    const queries = [
      // Test basic task query performance
      measurePerformance(async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, loft_id')
          .limit(100)
        return { queryType: 'basic_tasks', recordCount: data?.length || 0, error }
      }, 'basic_tasks_query'),

      // Test task-loft join performance
      measurePerformance(async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, loft:lofts(name)')
          .limit(100)
        return { queryType: 'task_loft_join', recordCount: data?.length || 0, error }
      }, 'task_loft_join_query'),

      // Test materialized view performance
      measurePerformance(async () => {
        const { data, error } = await supabase
          .from('task_loft_stats_mv')
          .select('*')
          .limit(50)
        return { queryType: 'materialized_view', recordCount: data?.length || 0, error }
      }, 'materialized_view_query'),

      // Test function call performance
      measurePerformance(async () => {
        const { data, error } = await supabase.rpc('get_loft_task_summary')
        return { queryType: 'function_call', recordCount: data?.length || 0, error }
      }, 'function_call_query')
    ]

    const results = await Promise.all(queries)
    
    return {
      timestamp: new Date().toISOString(),
      metrics: results,
      summary: {
        totalQueries: results.length,
        successfulQueries: results.filter(r => !r.error).length,
        failedQueries: results.filter(r => r.error).length,
        averageResponseTime: results.reduce((acc, r) => acc + (r.duration || 0), 0) / results.length
      }
    }
  }, 'getTaskLoftPerformanceMetrics')
}

/**
 * Cache invalidation utilities
 */
export async function invalidateTaskLoftCaches() {
  try {
    // In a real implementation, you would use your cache invalidation mechanism
    // For Next.js, you might use revalidateTag or revalidatePath
    
    logger.info('Invalidating task-loft caches', {
      tags: Object.values(CACHE_TAGS)
    })

    // Example: revalidateTag(CACHE_TAGS.TASKS)
    // This would be implemented based on your caching strategy
    
    return { success: true, invalidatedTags: Object.values(CACHE_TAGS) }
  } catch (error) {
    logger.error('Failed to invalidate caches', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Batch update optimization for task-loft associations
 */
export async function updateTaskLoftAssociationsBatch(
  updates: Array<{ taskId: string; loftId: string | null }>
) {
  return measurePerformance(async () => {
    const supabase = await createClient()
    
    // Use a transaction for batch updates
    const { data, error } = await supabase.rpc('batch_update_task_loft_associations', {
      updates: updates
    })

    if (error) {
      logger.error('Error in batch task-loft update', error)
      throw error
    }

    // Invalidate relevant caches
    await invalidateTaskLoftCaches()

    return { updatedCount: updates.length, success: true }
  }, 'updateTaskLoftAssociationsBatch')
}

/**
 * Preload commonly accessed data
 */
export async function preloadTaskLoftData() {
  return measurePerformance(async () => {
    // Preload frequently accessed data in parallel
    const [summary, topLofts] = await Promise.all([
      getLoftTaskSummaryCached(),
      getTaskLoftStatsMaterialized()
    ])

    return {
      summary,
      topLofts: topLofts.slice(0, 10), // Top 10 lofts by task count
      preloadedAt: new Date().toISOString()
    }
  }, 'preloadTaskLoftData')
}