import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { createNotification } from '@/app/actions/notifications'

export interface TaskNotificationData {
  taskId: string
  taskTitle: string
  assignedTo?: string
  createdBy: string
  dueDate?: string
  status?: string
  description?: string
}

export async function notifyTaskAssignment(
  taskData: TaskNotificationData,
  assignedUserId: string,
  assignedByUserId: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating task assignment notification', { 
      taskId: taskData.taskId, 
      assignedTo: assignedUserId,
      assignedBy: assignedByUserId 
    })

    try {
      const dueDateText = taskData.dueDate 
        ? ` (Due: ${new Date(taskData.dueDate).toLocaleDateString()})`
        : ''

      await createNotification(
        assignedUserId,
        "New Task Assigned",
        `You have been assigned a new task: "${taskData.taskTitle}"${dueDateText}`,
        'info',
        `/tasks/${taskData.taskId}`
      )

      logger.info('Task assignment notification created successfully')
    } catch (error) {
      logger.error('Failed to create task assignment notification', error)
      throw error
    }
  }, 'notifyTaskAssignment')
}

export async function notifyTaskReassignment(
  taskData: TaskNotificationData,
  newAssigneeId: string,
  oldAssigneeId: string,
  updatedByUserId: string,
  updatedByName: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating task reassignment notifications', { 
      taskId: taskData.taskId, 
      newAssignee: newAssigneeId,
      oldAssignee: oldAssigneeId,
      updatedBy: updatedByUserId 
    })

    try {
      // Notify the newly assigned user
      if (newAssigneeId !== updatedByUserId) {
        const dueDateText = taskData.dueDate 
          ? ` (Due: ${new Date(taskData.dueDate).toLocaleDateString()})`
          : ''

        await createNotification(
          newAssigneeId,
          "Task Assigned to You",
          `You have been assigned to task: "${taskData.taskTitle}"${dueDateText}`,
          'info',
          `/tasks/${taskData.taskId}`
        )
      }

      // Notify the previously assigned user
      if (oldAssigneeId && oldAssigneeId !== updatedByUserId && oldAssigneeId !== newAssigneeId) {
        await createNotification(
          oldAssigneeId,
          "Task Reassigned",
          `Task "${taskData.taskTitle}" has been reassigned to someone else by ${updatedByName}.`,
          'warning',
          `/tasks/${taskData.taskId}`
        )
      }

      logger.info('Task reassignment notifications created successfully')
    } catch (error) {
      logger.error('Failed to create task reassignment notifications', error)
      throw error
    }
  }, 'notifyTaskReassignment')
}

export async function notifyTaskStatusChange(
  taskData: TaskNotificationData,
  oldStatus: string,
  newStatus: string,
  updatedByUserId: string,
  updatedByName: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating task status change notifications', { 
      taskId: taskData.taskId, 
      oldStatus,
      newStatus,
      updatedBy: updatedByUserId 
    })

    try {
      // Notify the task creator if they're not the one making the change
      if (taskData.createdBy && taskData.createdBy !== updatedByUserId) {
        const notificationType = newStatus === 'completed' ? 'success' : 'info'
        
        await createNotification(
          taskData.createdBy,
          "Task Status Updated",
          `Task "${taskData.taskTitle}" status changed from "${oldStatus}" to "${newStatus}" by ${updatedByName}.`,
          notificationType,
          `/tasks/${taskData.taskId}`
        )
      }

      // Notify the assigned user if they're not the one making the change
      if (taskData.assignedTo && taskData.assignedTo !== updatedByUserId && taskData.assignedTo !== taskData.createdBy) {
        const notificationType = newStatus === 'completed' ? 'success' : 'info'
        
        await createNotification(
          taskData.assignedTo,
          "Your Task Status Updated",
          `Status of your assigned task "${taskData.taskTitle}" has been updated to "${newStatus}".`,
          notificationType,
          `/tasks/${taskData.taskId}`
        )
      }

      logger.info('Task status change notifications created successfully')
    } catch (error) {
      logger.error('Failed to create task status change notifications', error)
      throw error
    }
  }, 'notifyTaskStatusChange')
}

export async function notifyTaskDueDateChange(
  taskData: TaskNotificationData,
  oldDueDate: string | null,
  newDueDate: string | null,
  updatedByUserId: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating task due date change notification', { 
      taskId: taskData.taskId, 
      oldDueDate,
      newDueDate,
      updatedBy: updatedByUserId 
    })

    try {
      if (taskData.assignedTo && taskData.assignedTo !== updatedByUserId) {
        let dueDateText = ''
        if (newDueDate && oldDueDate) {
          dueDateText = `Due date changed from ${new Date(oldDueDate).toLocaleDateString()} to ${new Date(newDueDate).toLocaleDateString()}`
        } else if (newDueDate) {
          dueDateText = `Due date set to: ${new Date(newDueDate).toLocaleDateString()}`
        } else {
          dueDateText = 'Due date removed'
        }

        await createNotification(
          taskData.assignedTo,
          "Task Due Date Updated",
          `Due date for task "${taskData.taskTitle}" has been updated. ${dueDateText}`,
          'info',
          `/tasks/${taskData.taskId}`
        )
      }

      logger.info('Task due date change notification created successfully')
    } catch (error) {
      logger.error('Failed to create task due date change notification', error)
      throw error
    }
  }, 'notifyTaskDueDateChange')
}

export async function notifyTaskDeletion(
  taskData: TaskNotificationData,
  deletedByUserId: string,
  deletedByName: string
): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Creating task deletion notifications', { 
      taskId: taskData.taskId, 
      deletedBy: deletedByUserId 
    })

    try {
      const usersToNotify = []
      
      // Notify assigned user
      if (taskData.assignedTo && taskData.assignedTo !== deletedByUserId) {
        usersToNotify.push(taskData.assignedTo)
      }
      
      // Notify creator
      if (taskData.createdBy && taskData.createdBy !== deletedByUserId && taskData.createdBy !== taskData.assignedTo) {
        usersToNotify.push(taskData.createdBy)
      }

      // Send notifications
      for (const userId of usersToNotify) {
        await createNotification(
          userId,
          "Task Deleted",
          `Task "${taskData.taskTitle}" has been deleted by ${deletedByName}.`,
          'warning',
          '/tasks'
        )
      }

      logger.info('Task deletion notifications created successfully')
    } catch (error) {
      logger.error('Failed to create task deletion notifications', error)
      throw error
    }
  }, 'notifyTaskDeletion')
}

export async function notifyTaskOverdue(): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Checking for overdue tasks')
    const supabase = await createClient()

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get overdue tasks
      const { data: overdueTasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          assigned_to,
          created_by,
          status
        `)
        .lt('due_date', today.toISOString())
        .neq('status', 'completed')
        .not('assigned_to', 'is', null)

      if (error) {
        throw error
      }

      // Create notifications for overdue tasks
      for (const task of overdueTasks || []) {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Notify assigned user
        if (task.assigned_to) {
          await createNotification(
            task.assigned_to,
            "Task Overdue",
            `Your task "${task.title}" is ${daysOverdue} day(s) overdue.`,
            'error',
            `/tasks/${task.id}`
          )
        }

        // Notify creator if different from assigned user
        if (task.created_by && task.created_by !== task.assigned_to) {
          await createNotification(
            task.created_by,
            "Task Overdue",
            `Task "${task.title}" assigned to someone is ${daysOverdue} day(s) overdue.`,
            'warning',
            `/tasks/${task.id}`
          )
        }
      }

      logger.info('Overdue task notifications processed', { count: overdueTasks?.length || 0 })
    } catch (error) {
      logger.error('Failed to process overdue task notifications', error)
      throw error
    }
  }, 'notifyTaskOverdue')
}