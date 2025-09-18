"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Database, TaskWithLoft } from "@/lib/types"
import { z } from "zod"
import { taskSchema, taskStatusUpdateSchema } from "@/lib/validations"
import { createClient } from '@/utils/supabase/server' // Import the new createClient
import { createNotification } from './notifications'
import { logger } from '@/lib/logger'
import { 
  notifyTaskAssignment, 
  notifyTaskReassignment, 
  notifyTaskStatusChange, 
  notifyTaskDueDateChange,
  notifyTaskDeletion 
} from '@/lib/services/task-notifications'
import { unstable_noStore as noStore } from 'next/cache';

type Task = Database['public']['Tables']['tasks']['Row']

export async function getTasks() {
  const session = await requireRole(["admin", "manager", "member"])
  const supabase = await createClient() // Create client here
  
  // Get all tasks first (we'll filter them using the data filter service)
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting tasks:", error)
    throw error
  }

  // If no tasks, return empty array
  if (!allTasks || allTasks.length === 0) {
    return []
  }

  // Apply role-based filtering using DataFilterService
  const { DataFilterService } = await import('@/lib/services/data-filter')
  const filterConfig = {
    userRole: session.user.role,
    userId: session.user.id,
    assignedLoftIds: [], // Will be populated if needed
    teamIds: [] // Will be populated if needed
  }

  const filteredResult = DataFilterService.filterTasks(allTasks, filterConfig)
  const tasks = filteredResult.data

  // Get unique loft IDs from filtered tasks
  const loftIds = [...new Set(tasks.map(task => task.loft_id).filter(Boolean))]
  
  // If no loft IDs, return tasks as is
  if (loftIds.length === 0) {
    return tasks.map(task => ({ ...task, loft: null }))
  }

  // Get loft information
  const { data: lofts, error: loftsError } = await supabase
    .from("lofts")
    .select("id, name, address")
    .in("id", loftIds)

  if (loftsError) {
    console.error("Error getting lofts:", loftsError)
    // Return tasks without loft info if loft query fails
    return tasks.map(task => ({ ...task, loft: null }))
  }

  // Create a map for quick loft lookup
  const loftMap = new Map(lofts?.map(loft => [loft.id, loft]) || [])

  // Combine tasks with loft information and detect orphaned references
  return tasks.map(task => {
    if (!task.loft_id) {
      return { ...task, loft: null }
    }
    
    const loft = loftMap.get(task.loft_id)
    if (!loft) {
      // This is an orphaned reference - loft_id exists but loft doesn't
      return { 
        ...task, 
        loft: null, 
        isOrphaned: true,
        orphanedLoftId: task.loft_id
      }
    }
    
    return { ...task, loft }
  })
}

export async function getTask(id: string): Promise<Task | null> {
  noStore();
  const supabase = await createClient() // Create client here
  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching task:", error)
    return null
  }

  // If task has a loft_id, get the loft information
  if (task.loft_id) {
    const { data: loft, error: loftError } = await supabase
      .from("lofts")
      .select("id, name, address")
      .eq("id", task.loft_id)
      .single()

    if (!loftError && loft) {
      return { ...task, loft }
    }
  }

  return { ...task, loft: null }
}

export async function createTask(data: unknown) {
  const session = await requireRole(["admin", "manager"])
  const validatedData = taskSchema.parse(data);

  const supabase = await createClient() // Create client here

  // Validate loft_id if provided
  if (validatedData.loft_id) {
    const { data: loft, error: loftError } = await supabase
      .from("lofts")
      .select("id")
      .eq("id", validatedData.loft_id)
      .single()

    if (loftError || !loft) {
      throw new Error("Invalid loft ID provided")
    }
  }

  const { data: newTask, error } = await supabase.from("tasks").insert({
    ...validatedData,
    due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
    created_by: session.user.id,
  }).select().single()

  if (error) {
    console.error("Error creating task:", error)
    throw error
  }

  // Create enhanced notification for the assigned user
  if (validatedData.assigned_to && newTask && validatedData.assigned_to !== session.user.id) {
    try {
      const { EnhancedTaskNotificationService } = await import('@/lib/services/enhanced-task-notifications')
      
      // Get loft information if available
      let loftName = undefined
      if (validatedData.loft_id) {
        const { data: loft } = await supabase
          .from('lofts')
          .select('name')
          .eq('id', validatedData.loft_id)
          .single()
        loftName = loft?.name
      }

      await EnhancedTaskNotificationService.notifyTaskAssignment(
        {
          taskId: newTask.id,
          taskTitle: validatedData.title,
          assignedTo: validatedData.assigned_to,
          createdBy: session.user.id,
          dueDate: validatedData.due_date || undefined,
          status: 'todo',
          description: validatedData.description || undefined,
          loftId: validatedData.loft_id || undefined,
          loftName
        },
        session.user.id,
        session.user.full_name || 'a manager'
      )
    } catch (notificationError) {
      logger.error("Failed to create enhanced task assignment notification", notificationError)
      // Don't throw error - task creation should succeed even if notification fails
    }
  }
    
  redirect("/tasks")
}

export async function updateTask(id: string, data: unknown) {
  const session = await requireRole(["admin", "manager", "member"])
  
  const supabase = await createClient() // Create client here
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !task) {
    console.error("Error fetching task:", fetchError);
    throw new Error("Task not found or error fetching it.");
  }

  // Use enhanced permission validation
  const { TaskPermissionService } = await import('@/lib/services/task-permissions')
  
  if (!TaskPermissionService.canEditTask(task, session.user.role, session.user.id)) {
    throw new Error("You are not authorized to update this task.");
  }

  // Store original values for comparison
  const originalAssignedTo = task.assigned_to;
  const originalStatus = task.status;
  const originalTitle = task.title;
  const originalDueDate = task.due_date;

  let updateData: Partial<Task> = {};
  let validatedData: any;

  // Get editable fields for this user
  const editableFields = TaskPermissionService.getEditableFields(task, session.user.role, session.user.id);

  if (session.user.role === 'admin' || session.user.role === 'manager') {
    // Admins and managers can update all fields
    validatedData = taskSchema.parse(data);

    // Validate loft_id if provided
    if (validatedData.loft_id) {
      const { data: loft, error: loftError } = await supabase
        .from("lofts")
        .select("id")
        .eq("id", validatedData.loft_id)
        .single()

      if (loftError || !loft) {
        throw new Error("Invalid loft ID provided")
      }
    }

    updateData = {
      ...validatedData,
      due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
    };
  } else {
    // Members can only update specific fields
    validatedData = taskStatusUpdateSchema.parse(data);
    
    // Validate the update using permission service
    const validation = TaskPermissionService.validateTaskUpdate(
      task, 
      validatedData, 
      session.user.role, 
      session.user.id
    );

    if (!validation.isValid) {
      throw new Error(`Permission denied: ${validation.errors.join(', ')}`);
    }

    // Only include fields that the user can edit
    updateData = {};
    Object.keys(validatedData).forEach(field => {
      if (editableFields.includes(field)) {
        updateData[field as keyof Task] = validatedData[field];
      }
    });
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("Error updating task:", error)
    throw error
  }

  // Handle notifications for different types of updates using enhanced notification system
  try {
    const { EnhancedTaskNotificationService } = await import('@/lib/services/enhanced-task-notifications')
    
    // Get loft information if available
    let loftName = undefined
    if (task.loft_id) {
      const { data: loft } = await supabase
        .from('lofts')
        .select('name')
        .eq('id', task.loft_id)
        .single()
      loftName = loft?.name
    }

    const enhancedTaskData = {
      taskId: task.id,
      taskTitle: task.title,
      assignedTo: task.assigned_to || undefined,
      createdBy: task.user_id,
      dueDate: task.due_date || undefined,
      status: task.status,
      description: task.description || undefined,
      loftId: task.loft_id || undefined,
      loftName
    }

    // 1. Task reassignment notification
    if (validatedData.assigned_to && validatedData.assigned_to !== originalAssignedTo) {
      await EnhancedTaskNotificationService.notifyTaskReassignment(
        enhancedTaskData,
        originalAssignedTo || '',
        validatedData.assigned_to,
        session.user.id,
        session.user.full_name || 'a manager'
      )
    }

    // 2. Status change notification
    if (validatedData.status && validatedData.status !== originalStatus) {
      await EnhancedTaskNotificationService.notifyTaskStatusChange(
        enhancedTaskData,
        originalStatus,
        validatedData.status,
        session.user.id,
        session.user.full_name || 'a user'
      )
    }

    // 3. Due date change notification (for admins/managers updating tasks)
    if (session.user.role === 'admin' || session.user.role === 'manager') {
      const newDueDate = validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null
      if (newDueDate !== originalDueDate) {
        const updatedTaskData = {
          ...enhancedTaskData,
          dueDate: newDueDate || undefined
        }
        
        // Use the existing notification system for due date changes
        const currentAssignee = validatedData.assigned_to || originalAssignedTo
        if (currentAssignee && currentAssignee !== session.user.id) {
          await createNotification(
            currentAssignee,
            "Task Due Date Updated",
            "taskDueDateUpdatedMessage",
            'info',
            `/tasks/${id}`,
            session.user.id,
            undefined,
            { 
              taskTitle: originalTitle, 
              newDueDate: newDueDate ? new Date(newDueDate).toLocaleDateString() : ''
            }
          )
        }
      }
    }

    logger.info("Enhanced task update notifications processed successfully", { taskId: id })
  } catch (notificationError) {
    logger.error("Failed to create enhanced task update notifications", notificationError, { taskId: id })
    // Don't throw error - task update should succeed even if notifications fail
  }
}

export async function getTasksByLoft(loftId: string) {
  const session = await requireRole(["admin", "manager", "member"])
  const supabase = await createClient()
  
  // Get all tasks for the loft first
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      lofts!loft_id (
        id,
        name,
        address
      )
    `)
    .eq("loft_id", loftId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting tasks by loft:", error)
    throw error
  }

  if (!allTasks || allTasks.length === 0) {
    return []
  }

  // Apply role-based filtering using DataFilterService
  const { DataFilterService } = await import('@/lib/services/data-filter')
  const filterConfig = {
    userRole: session.user.role,
    userId: session.user.id,
    assignedLoftIds: [loftId], // User has access to this specific loft
    teamIds: []
  }

  const filteredResult = DataFilterService.filterTasks(allTasks, filterConfig)
  return filteredResult.data
}

export async function getTasksWithoutLoft() {
  const session = await requireRole(["admin", "manager", "member"])
  const supabase = await createClient()
  
  // Get all tasks without loft first
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      lofts!loft_id (
        id,
        name,
        address
      )
    `)
    .is("loft_id", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting tasks without loft:", error)
    throw error
  }

  if (!allTasks || allTasks.length === 0) {
    return []
  }

  // Apply role-based filtering using DataFilterService
  const { DataFilterService } = await import('@/lib/services/data-filter')
  const filterConfig = {
    userRole: session.user.role,
    userId: session.user.id,
    assignedLoftIds: [],
    teamIds: []
  }

  const filteredResult = DataFilterService.filterTasks(allTasks, filterConfig)
  return filteredResult.data
}

// Get tasks with extended loft information for API responses
export async function getTasksWithLoftInfo() {
  const session = await requireRole(["admin", "manager", "member"])
  const supabase = await createClient()
  
  // Get all tasks first
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting tasks:", error)
    throw error
  }

  if (!allTasks || allTasks.length === 0) {
    return []
  }

  // Apply role-based filtering using DataFilterService
  const { DataFilterService } = await import('@/lib/services/data-filter')
  const filterConfig = {
    userRole: session.user.role,
    userId: session.user.id,
    assignedLoftIds: [], // Will be populated based on user's task assignments
    teamIds: []
  }

  const filteredResult = DataFilterService.filterTasks(allTasks, filterConfig)
  const tasks = filteredResult.data

  // Get unique loft IDs from filtered tasks
  const loftIds = [...new Set(tasks.map(task => task.loft_id).filter(Boolean))]
  
  if (loftIds.length === 0) {
    return tasks.map(task => ({ ...task, loft: null }))
  }

  // Get loft information with extended details
  const { data: lofts, error: loftsError } = await supabase
    .from("lofts")
    .select("id, name, address, description, status")
    .in("id", loftIds)

  if (loftsError) {
    console.error("Error getting lofts:", loftsError)
    return tasks.map(task => ({ ...task, loft: null }))
  }

  // Create a map for quick loft lookup
  const loftMap = new Map(lofts?.map(loft => [loft.id, loft]) || [])

  // Combine tasks with extended loft information
  return tasks.map(task => ({
    ...task,
    loft: task.loft_id ? loftMap.get(task.loft_id) || null : null
  }))
}

// Get tasks with orphaned loft references (loft_id exists but loft doesn't)
export async function getTasksWithOrphanedLofts() {
  const session = await requireRole(["admin", "manager"])
  const supabase = await createClient()
  
  // Get all tasks with loft_id
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .not("loft_id", "is", null)

  if (tasksError) {
    console.error("Error getting tasks:", tasksError)
    throw tasksError
  }

  if (!tasks || tasks.length === 0) {
    return []
  }

  // Get all existing loft IDs
  const { data: existingLofts, error: loftsError } = await supabase
    .from("lofts")
    .select("id")

  if (loftsError) {
    console.error("Error getting lofts:", loftsError)
    throw loftsError
  }

  const existingLoftIds = new Set(existingLofts?.map(loft => loft.id) || [])

  // Filter tasks with orphaned loft references
  const orphanedTasks = tasks.filter(task => 
    task.loft_id && !existingLoftIds.has(task.loft_id)
  )

  return orphanedTasks.map(task => ({
    ...task,
    loft: null,
    isOrphaned: true,
    orphanedLoftId: task.loft_id
  }))
}

// Clean up orphaned loft references by setting them to NULL
export async function cleanupOrphanedLoftReferences() {
  const session = await requireRole(["admin"])
  const supabase = await createClient()

  // Get orphaned tasks
  const orphanedTasks = await getTasksWithOrphanedLofts()
  
  if (orphanedTasks.length === 0) {
    return { cleaned: 0, tasks: [] }
  }

  // Update all orphaned tasks to set loft_id to NULL
  const orphanedTaskIds = orphanedTasks.map(task => task.id)
  
  const { error } = await supabase
    .from("tasks")
    .update({ loft_id: null })
    .in("id", orphanedTaskIds)

  if (error) {
    console.error("Error cleaning up orphaned loft references:", error)
    throw error
  }

  return { 
    cleaned: orphanedTasks.length, 
    tasks: orphanedTasks.map(task => ({
      id: task.id,
      title: task.title,
      orphanedLoftId: task.orphanedLoftId
    }))
  }
}

// Reassign orphaned tasks to a new loft
export async function reassignOrphanedTasksToLoft(newLoftId: string, taskIds: string[]) {
  const session = await requireRole(["admin", "manager"])
  const supabase = await createClient()

  // Validate that the new loft exists
  const { data: loft, error: loftError } = await supabase
    .from("lofts")
    .select("id, name")
    .eq("id", newLoftId)
    .single()

  if (loftError || !loft) {
    throw new Error("Invalid loft ID provided for reassignment")
  }

  // Update the specified tasks
  const { error } = await supabase
    .from("tasks")
    .update({ loft_id: newLoftId })
    .in("id", taskIds)

  if (error) {
    console.error("Error reassigning tasks to loft:", error)
    throw error
  }

  return {
    reassigned: taskIds.length,
    loft: loft,
    taskIds: taskIds
  }
}

export async function deleteTask(id: string) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("tasks").delete().eq("id", id)

  if (error) {
    console.error("Error updating task:", error)
    throw error
  }

  redirect("/tasks")
}
