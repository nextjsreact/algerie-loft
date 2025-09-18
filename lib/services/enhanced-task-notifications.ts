import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { createNotification } from '@/app/actions/notifications'
import { UserRole, Task } from '@/lib/types'
import { TaskPermissionService } from './task-permissions'

export interface EnhancedTaskNotificationData {
  taskId: string
  taskTitle: string
  assignedTo?: string
  createdBy: string
  dueDate?: string
  status?: string
  description?: string
  loftId?: string
  loftName?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface NotificationRecipient {
  userId: string
  role: UserRole
  name?: string
  email?: string
}

/**
 * Enhanced task notification service with role-based notifications
 */
export class EnhancedTaskNotificationService {
  /**
   * Get users who should be notified about task changes
   */
  static async getNotificationRecipients(
    taskData: EnhancedTaskNotificationData,
    notificationType: 'assignment' | 'status_change' | 'due_date_change' | 'deletion' | 'overdue',
    excludeUserId?: string
  ): Promise<NotificationRecipient[]> {
    const supabase = await createClient()
    const recipients: NotificationRecipient[] = []

    try {
      // Get user information for task participants
      const userIds = [taskData.assignedTo, taskData.createdBy].filter(Boolean) as string[]
      
      if (userIds.length === 0) return recipients

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', userIds)

      if (error) {
        logger.error('Failed to fetch user information for notifications', error)
        return recipients
      }

      // Add task participants
      users?.forEach(user => {
        if (user.id !== excludeUserId) {
          recipients.push({
            userId: user.id,
            role: user.role as UserRole,
            name: user.full_name,
            email: user.email
          })
        }
      })

      // Add supervisors for certain notification types
      if (['status_change', 'overdue', 'deletion'].includes(notificationType)) {
        const { data: supervisors, error: supervisorError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('role', ['admin', 'manager'])

        if (!supervisorError && supervisors) {
          supervisors.forEach(supervisor => {
            if (supervisor.id !== excludeUserId && !recipients.find(r => r.userId === supervisor.id)) {
              recipients.push({
                userId: supervisor.id,
                role: supervisor.role as UserRole,
                name: supervisor.full_name,
                email: supervisor.email
              })
            }
          })
        }
      }

      return recipients
    } catch (error) {
      logger.error('Failed to get notification recipients', error)
      return recipients
    }
  }

  /**
   * Create role-specific notification content
   */
  static createNotificationContent(
    taskData: EnhancedTaskNotificationData,
    notificationType: string,
    recipient: NotificationRecipient,
    updatedByName?: string
  ): {
    titleKey: string
    messageKey: string
    type: 'info' | 'success' | 'warning' | 'error'
    titlePayload?: Record<string, any>
    messagePayload?: Record<string, any>
  } {
    const isAssignedUser = recipient.userId === taskData.assignedTo
    const isCreator = recipient.userId === taskData.createdBy
    const isSupervisor = ['admin', 'manager'].includes(recipient.role)

    switch (notificationType) {
      case 'task_assigned':
        return {
          titleKey: isAssignedUser ? 'taskAssignedToYou' : 'taskAssignedNotification',
          messageKey: 'taskAssignedMessage',
          type: 'info',
          messagePayload: {
            taskTitle: taskData.taskTitle,
            assigneeName: isAssignedUser ? 'you' : 'team member',
            dueDate: taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : '',
            loftName: taskData.loftName || ''
          }
        }

      case 'task_status_changed':
        const statusType = taskData.status === 'completed' ? 'success' : 'info'
        return {
          titleKey: isAssignedUser ? 'yourTaskStatusUpdated' : 'taskStatusUpdated',
          messageKey: 'taskStatusUpdatedMessage',
          type: statusType,
          messagePayload: {
            taskTitle: taskData.taskTitle,
            newStatus: taskData.status || '',
            updatedBy: updatedByName || 'someone',
            isYourTask: isAssignedUser
          }
        }

      case 'task_due_date_changed':
        return {
          titleKey: isAssignedUser ? 'yourTaskDueDateUpdated' : 'taskDueDateUpdated',
          messageKey: 'taskDueDateUpdatedMessage',
          type: 'info',
          messagePayload: {
            taskTitle: taskData.taskTitle,
            newDueDate: taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : '',
            updatedBy: updatedByName || 'someone'
          }
        }

      case 'task_overdue':
        const daysOverdue = taskData.dueDate 
          ? Math.floor((new Date().getTime() - new Date(taskData.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0

        return {
          titleKey: isAssignedUser ? 'yourTaskOverdue' : isSupervisor ? 'taskOverdueAlert' : 'taskOverdue',
          messageKey: 'taskOverdueMessage',
          type: 'error',
          messagePayload: {
            taskTitle: taskData.taskTitle,
            daysOverdue: daysOverdue.toString(),
            assigneeName: isAssignedUser ? 'you' : 'team member',
            isYourTask: isAssignedUser,
            isSupervisorAlert: isSupervisor
          }
        }

      case 'task_deleted':
        return {
          titleKey: 'taskDeleted',
          messageKey: 'taskDeletedMessage',
          type: 'warning',
          messagePayload: {
            taskTitle: taskData.taskTitle,
            deletedBy: updatedByName || 'someone',
            wasAssignedToYou: isAssignedUser
          }
        }

      case 'task_reassigned':
        return {
          titleKey: isAssignedUser ? 'taskAssignedToYou' : 'taskReassigned',
          messageKey: 'taskReassignedMessage',
          type: isAssignedUser ? 'info' : 'warning',
          messagePayload: {
            taskTitle: taskData.taskTitle,
            reassignedBy: updatedByName || 'someone',
            newAssignee: isAssignedUser ? 'you' : 'someone else'
          }
        }

      default:
        return {
          titleKey: 'taskNotification',
          messageKey: 'taskNotificationMessage',
          type: 'info',
          messagePayload: {
            taskTitle: taskData.taskTitle
          }
        }
    }
  }

  /**
   * Send enhanced task assignment notification
   */
  static async notifyTaskAssignment(
    taskData: EnhancedTaskNotificationData,
    assignedByUserId: string,
    assignedByName: string
  ): Promise<void> {
    return measurePerformance(async () => {
      logger.info('Creating enhanced task assignment notification', {
        taskId: taskData.taskId,
        assignedTo: taskData.assignedTo,
        assignedBy: assignedByUserId
      })

      try {
        const recipients = await this.getNotificationRecipients(
          taskData,
          'assignment',
          assignedByUserId
        )

        for (const recipient of recipients) {
          const content = this.createNotificationContent(
            taskData,
            'task_assigned',
            recipient,
            assignedByName
          )

          await createNotification(
            recipient.userId,
            content.titleKey,
            content.messageKey,
            content.type,
            `/tasks/${taskData.taskId}`,
            assignedByUserId,
            content.titlePayload,
            content.messagePayload
          )
        }

        logger.info('Enhanced task assignment notifications created successfully')
      } catch (error) {
        logger.error('Failed to create enhanced task assignment notifications', error)
        throw error
      }
    }, 'notifyEnhancedTaskAssignment')
  }

  /**
   * Send enhanced task status change notification
   */
  static async notifyTaskStatusChange(
    taskData: EnhancedTaskNotificationData,
    oldStatus: string,
    newStatus: string,
    updatedByUserId: string,
    updatedByName: string
  ): Promise<void> {
    return measurePerformance(async () => {
      logger.info('Creating enhanced task status change notifications', {
        taskId: taskData.taskId,
        oldStatus,
        newStatus,
        updatedBy: updatedByUserId
      })

      try {
        const recipients = await this.getNotificationRecipients(
          taskData,
          'status_change',
          updatedByUserId
        )

        const enhancedTaskData = { ...taskData, status: newStatus }

        for (const recipient of recipients) {
          const content = this.createNotificationContent(
            enhancedTaskData,
            'task_status_changed',
            recipient,
            updatedByName
          )

          await createNotification(
            recipient.userId,
            content.titleKey,
            content.messageKey,
            content.type,
            `/tasks/${taskData.taskId}`,
            updatedByUserId,
            content.titlePayload,
            content.messagePayload
          )
        }

        // Special notification for task completion to supervisors
        if (newStatus === 'completed') {
          await this.notifyTaskCompletion(taskData, updatedByUserId, updatedByName)
        }

        logger.info('Enhanced task status change notifications created successfully')
      } catch (error) {
        logger.error('Failed to create enhanced task status change notifications', error)
        throw error
      }
    }, 'notifyEnhancedTaskStatusChange')
  }

  /**
   * Send task completion notification to supervisors
   */
  static async notifyTaskCompletion(
    taskData: EnhancedTaskNotificationData,
    completedByUserId: string,
    completedByName: string
  ): Promise<void> {
    const supabase = await createClient()

    try {
      // Get supervisors
      const { data: supervisors, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'manager'])

      if (error || !supervisors) return

      for (const supervisor of supervisors) {
        if (supervisor.id !== completedByUserId) {
          await createNotification(
            supervisor.id,
            'taskCompletedAlert',
            'taskCompletedAlertMessage',
            'success',
            `/tasks/${taskData.taskId}`,
            completedByUserId,
            undefined,
            {
              taskTitle: taskData.taskTitle,
              completedBy: completedByName,
              loftName: taskData.loftName || ''
            }
          )
        }
      }
    } catch (error) {
      logger.error('Failed to notify supervisors of task completion', error)
    }
  }

  /**
   * Send enhanced overdue task notifications
   */
  static async notifyOverdueTasks(): Promise<void> {
    return measurePerformance(async () => {
      logger.info('Processing enhanced overdue task notifications')
      const supabase = await createClient()

      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get overdue tasks with loft information
        const { data: overdueTasks, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            description,
            due_date,
            assigned_to,
            created_by,
            status,
            loft_id,
            lofts!loft_id (
              id,
              name
            )
          `)
          .lt('due_date', today.toISOString())
          .neq('status', 'completed')
          .not('assigned_to', 'is', null)

        if (error) {
          throw error
        }

        for (const task of overdueTasks || []) {
          const taskData: EnhancedTaskNotificationData = {
            taskId: task.id,
            taskTitle: task.title,
            assignedTo: task.assigned_to,
            createdBy: task.created_by,
            dueDate: task.due_date,
            status: task.status,
            description: task.description,
            loftId: task.loft_id,
            loftName: task.lofts?.name,
            priority: this.calculateTaskPriority(task)
          }

          const recipients = await this.getNotificationRecipients(
            taskData,
            'overdue'
          )

          for (const recipient of recipients) {
            const content = this.createNotificationContent(
              taskData,
              'task_overdue',
              recipient
            )

            await createNotification(
              recipient.userId,
              content.titleKey,
              content.messageKey,
              content.type,
              `/tasks/${taskData.taskId}`,
              null,
              content.titlePayload,
              content.messagePayload
            )
          }
        }

        logger.info('Enhanced overdue task notifications processed', { 
          count: overdueTasks?.length || 0 
        })
      } catch (error) {
        logger.error('Failed to process enhanced overdue task notifications', error)
        throw error
      }
    }, 'notifyEnhancedOverdueTasks')
  }

  /**
   * Calculate task priority based on due date and other factors
   */
  static calculateTaskPriority(task: any): 'low' | 'medium' | 'high' {
    if (!task.due_date) return 'low'

    const now = new Date()
    const dueDate = new Date(task.due_date)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return 'high' // Overdue
    if (daysUntilDue <= 1) return 'high' // Due today or tomorrow
    if (daysUntilDue <= 3) return 'medium' // Due within 3 days
    return 'low' // Due later
  }

  /**
   * Send task deletion notification
   */
  static async notifyTaskDeletion(
    taskData: EnhancedTaskNotificationData,
    deletedByUserId: string,
    deletedByName: string
  ): Promise<void> {
    return measurePerformance(async () => {
      logger.info('Creating enhanced task deletion notifications', {
        taskId: taskData.taskId,
        deletedBy: deletedByUserId
      })

      try {
        const recipients = await this.getNotificationRecipients(
          taskData,
          'deletion',
          deletedByUserId
        )

        for (const recipient of recipients) {
          const content = this.createNotificationContent(
            taskData,
            'task_deleted',
            recipient,
            deletedByName
          )

          await createNotification(
            recipient.userId,
            content.titleKey,
            content.messageKey,
            content.type,
            '/tasks',
            deletedByUserId,
            content.titlePayload,
            content.messagePayload
          )
        }

        logger.info('Enhanced task deletion notifications created successfully')
      } catch (error) {
        logger.error('Failed to create enhanced task deletion notifications', error)
        throw error
      }
    }, 'notifyEnhancedTaskDeletion')
  }

  /**
   * Send task reassignment notification
   */
  static async notifyTaskReassignment(
    taskData: EnhancedTaskNotificationData,
    oldAssigneeId: string,
    newAssigneeId: string,
    reassignedByUserId: string,
    reassignedByName: string
  ): Promise<void> {
    return measurePerformance(async () => {
      logger.info('Creating enhanced task reassignment notifications', {
        taskId: taskData.taskId,
        oldAssignee: oldAssigneeId,
        newAssignee: newAssigneeId,
        reassignedBy: reassignedByUserId
      })

      try {
        // Notify old assignee
        if (oldAssigneeId && oldAssigneeId !== reassignedByUserId) {
          const content = this.createNotificationContent(
            taskData,
            'task_reassigned',
            { userId: oldAssigneeId, role: 'member' }, // Role doesn't matter for content generation
            reassignedByName
          )

          await createNotification(
            oldAssigneeId,
            content.titleKey,
            content.messageKey,
            content.type,
            `/tasks/${taskData.taskId}`,
            reassignedByUserId,
            content.titlePayload,
            content.messagePayload
          )
        }

        // Notify new assignee
        if (newAssigneeId && newAssigneeId !== reassignedByUserId) {
          await this.notifyTaskAssignment(
            { ...taskData, assignedTo: newAssigneeId },
            reassignedByUserId,
            reassignedByName
          )
        }

        logger.info('Enhanced task reassignment notifications created successfully')
      } catch (error) {
        logger.error('Failed to create enhanced task reassignment notifications', error)
        throw error
      }
    }, 'notifyEnhancedTaskReassignment')
  }
}