import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface AuditFilter {
  user_id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export type AuditAction = 
  | 'create' | 'update' | 'delete' | 'view'
  | 'login' | 'logout' | 'password_change'
  | 'export' | 'import' | 'bulk_update' | 'bulk_delete'

export type ResourceType = 
  | 'loft' | 'transaction' | 'task' | 'user' | 'team' | 'owner'
  | 'notification' | 'report' | 'settings'

export async function createAuditLog(
  userId: string,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  metadata?: {
    ip_address?: string
    user_agent?: string
  }
): Promise<void> {
  return measurePerformance(async () => {
    const supabase = await createClient()

    try {
      const auditEntry = {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry)

      if (error) {
        throw error
      }

      logger.info('Audit log created', { 
        userId, 
        action, 
        resourceType, 
        resourceId 
      })
    } catch (error) {
      logger.error('Failed to create audit log', error, {
        userId,
        action,
        resourceType,
        resourceId
      })
      // Don't throw error to avoid breaking main operations
    }
  }, 'createAuditLog')
}

export async function getAuditLogs(filter: AuditFilter = {}): Promise<{
  logs: AuditLog[]
  total: number
}> {
  return measurePerformance(async () => {
    logger.info('Fetching audit logs', filter)
    const supabase = await createClient()

    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id)
      }
      if (filter.action) {
        query = query.eq('action', filter.action)
      }
      if (filter.resource_type) {
        query = query.eq('resource_type', filter.resource_type)
      }
      if (filter.resource_id) {
        query = query.eq('resource_id', filter.resource_id)
      }
      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from)
      }
      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to)
      }

      // Apply pagination
      const limit = filter.limit || 50
      const offset = filter.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      const logs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        old_values: log.old_values,
        new_values: log.new_values,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at
      }))

      logger.info('Audit logs fetched', { count: logs.length, total: count })
      return { logs, total: count || 0 }
    } catch (error) {
      logger.error('Failed to fetch audit logs', error, filter)
      throw error
    }
  }, 'getAuditLogs')
}

export async function getResourceHistory(
  resourceType: ResourceType,
  resourceId: string
): Promise<AuditLog[]> {
  return measurePerformance(async () => {
    logger.info('Fetching resource history', { resourceType, resourceId })
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const history: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        old_values: log.old_values,
        new_values: log.new_values,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at
      }))

      logger.info('Resource history fetched', { 
        resourceType, 
        resourceId, 
        count: history.length 
      })
      return history
    } catch (error) {
      logger.error('Failed to fetch resource history', error, { resourceType, resourceId })
      throw error
    }
  }, 'getResourceHistory')
}

export async function getUserActivity(
  userId: string,
  days: number = 30
): Promise<{
  totalActions: number
  actionsByType: Record<string, number>
  recentActions: AuditLog[]
}> {
  return measurePerformance(async () => {
    logger.info('Fetching user activity', { userId, days })
    const supabase = await createClient()

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, created_at, resource_type, resource_id')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const logs = data || []
      const totalActions = logs.length

      // Count actions by type
      const actionsByType: Record<string, number> = {}
      logs.forEach(log => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
      })

      // Get recent actions (last 10)
      const recentActions: AuditLog[] = logs.slice(0, 10).map(log => ({
        id: log.id || '',
        user_id: userId,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        created_at: log.created_at
      }))

      logger.info('User activity fetched', { 
        userId, 
        totalActions, 
        actionTypes: Object.keys(actionsByType).length 
      })

      return {
        totalActions,
        actionsByType,
        recentActions
      }
    } catch (error) {
      logger.error('Failed to fetch user activity', error, { userId })
      throw error
    }
  }, 'getUserActivity')
}

export async function getSystemActivity(days: number = 7): Promise<{
  totalActions: number
  actionsByDay: { date: string; count: number }[]
  topUsers: { user_id: string; user_name: string; count: number }[]
  topActions: { action: string; count: number }[]
}> {
  return measurePerformance(async () => {
    logger.info('Fetching system activity', { days })
    const supabase = await createClient()

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          action,
          created_at,
          user_id,
          user:profiles(full_name)
        `)
        .gte('created_at', startDate.toISOString())

      if (error) {
        throw error
      }

      const logs = data || []
      const totalActions = logs.length

      // Actions by day
      const actionsByDay: Record<string, number> = {}
      logs.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0]
        actionsByDay[date] = (actionsByDay[date] || 0) + 1
      })

      const actionsByDayArray = Object.entries(actionsByDay).map(([date, count]) => ({
        date,
        count
      }))

      // Top users
      const userCounts: Record<string, { count: number; name: string }> = {}
      logs.forEach(log => {
        if (!userCounts[log.user_id]) {
          userCounts[log.user_id] = {
            count: 0,
            name: log.user?.[0]?.full_name || 'Unknown User'
          }
        }
        userCounts[log.user_id].count++
      })

      const topUsers = Object.entries(userCounts)
        .map(([user_id, data]) => ({
          user_id,
          user_name: data.name,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Top actions
      const actionCounts: Record<string, number> = {}
      logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
      })

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      logger.info('System activity fetched', { 
        totalActions, 
        uniqueDays: actionsByDayArray.length,
        uniqueUsers: topUsers.length,
        uniqueActions: topActions.length
      })

      return {
        totalActions,
        actionsByDay: actionsByDayArray,
        topUsers,
        topActions
      }
    } catch (error) {
      logger.error('Failed to fetch system activity', error)
      throw error
    }
  }, 'getSystemActivity')
}

// Utility function to clean old audit logs
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  return measurePerformance(async () => {
    logger.info('Cleaning up old audit logs', { retentionDays })
    const supabase = await createClient()

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { count, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select()

      if (error) {
        throw error
      }

      const deletedCount = count || 0
      logger.info('Old audit logs cleaned up', { deletedCount, retentionDays })
      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup old audit logs', error)
      throw error
    }
  }, 'cleanupOldAuditLogs')
}