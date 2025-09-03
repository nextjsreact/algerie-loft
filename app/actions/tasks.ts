"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/types"
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
  
  let query = supabase.from("tasks").select("*")
  
  // Members can only see tasks assigned to them
  if (session.user.role === "member") {
    query = query.eq("assigned_to", session.user.id)
  }
  
  const { data: tasks, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting tasks:", error)
    throw error
  }

  return tasks
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

  return task
}

export async function createTask(data: unknown) {
  const session = await requireRole(["admin", "manager"])
  const validatedData = taskSchema.parse(data);

  const supabase = await createClient() // Create client here
  const { data: newTask, error } = await supabase.from("tasks").insert({
    ...validatedData,
    due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
    created_by: session.user.id,
  }).select().single()

  if (error) {
    console.error("Error creating task:", error)
    throw error
  }

  // Create a notification for the assigned user
  if (validatedData.assigned_to && newTask && validatedData.assigned_to !== session.user.id) {
    try {
      await notifyTaskAssignment(
        {
          taskId: newTask.id,
          taskTitle: validatedData.title,
          assignedTo: validatedData.assigned_to,
          createdBy: session.user.id,
          dueDate: validatedData.due_date || undefined,
          status: 'todo',
          description: validatedData.description || undefined
        },
        validatedData.assigned_to,
        session.user.id
      );
    } catch (notificationError) {
      logger.error("Failed to create task assignment notification", notificationError);
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

  if (session.user.role !== 'admin' && session.user.role !== 'manager' && task.assigned_to !== session.user.id) {
    throw new Error("You are not authorized to update this task.");
  }

  // Store original values for comparison
  const originalAssignedTo = task.assigned_to;
  const originalStatus = task.status;
  const originalTitle = task.title;
  const originalDueDate = task.due_date;

  let updateData: Partial<Task> = {};
  let validatedData: any;

  if (session.user.role === 'admin' || session.user.role === 'manager') {
    // Admins and managers can update all fields
    validatedData = taskSchema.parse(data);
    updateData = {
      ...validatedData,
      due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
    };
  } else {
    // Members can only update status
    validatedData = taskStatusUpdateSchema.parse(data);
    updateData = {
      status: validatedData.status,
    };
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("Error updating task:", error)
    throw error
  }

  // Handle notifications for different types of updates
  try {
    // 1. Task reassignment notification
    if (validatedData.assigned_to && validatedData.assigned_to !== originalAssignedTo) {
      // Notify the newly assigned user (if not the person making the change)
      if (validatedData.assigned_to !== session.user.id) {
        logger.info("Creating task reassignment notification", { 
          taskId: id, 
          newAssignee: validatedData.assigned_to,
          oldAssignee: originalAssignedTo,
          updatedBy: session.user.id 
        });

        await createNotification(
          validatedData.assigned_to,
          "Task Assigned to You",
          `You have been assigned to task: "${originalTitle}"${validatedData.due_date ? ` (Due: ${new Date(validatedData.due_date).toLocaleDateString()})` : ''}`,
          'info',
          `/tasks/${id}`
        );
      }

      // Notify the previously assigned user (if there was one and it's not the person making the change)
      if (originalAssignedTo && originalAssignedTo !== session.user.id && originalAssignedTo !== validatedData.assigned_to) {
        await createNotification(
          originalAssignedTo,
          "Task Reassigned",
          `Task "${originalTitle}" has been reassigned to someone else by ${session.user.full_name || 'a manager'}.`,
          'warning',
          `/tasks/${id}`
        );
      }
    }

    // 2. Status change notification
    if (validatedData.status && validatedData.status !== originalStatus) {
      // Notify the task creator if they're not the one making the change
      if (task.created_by && task.created_by !== session.user.id) {
        await createNotification(
          task.created_by,
          "Task Status Updated",
          `Task "${originalTitle}" status changed from "${originalStatus}" to "${validatedData.status}" by ${session.user.full_name || 'a user'}.`,
          validatedData.status === 'completed' ? 'success' : 'info',
          `/tasks/${id}`
        );
      }

      // If someone else is assigned and they're not the one making the change, notify them too
      const currentAssignee = validatedData.assigned_to || originalAssignedTo;
      if (currentAssignee && currentAssignee !== session.user.id && currentAssignee !== task.created_by) {
        await createNotification(
          currentAssignee,
          "Your Task Status Updated",
          `Status of your assigned task "${originalTitle}" has been updated to "${validatedData.status}".`,
          validatedData.status === 'completed' ? 'success' : 'info',
          `/tasks/${id}`
        );
      }
    }

    // 3. Due date change notification (for admins/managers updating tasks)
    if (session.user.role === 'admin' || session.user.role === 'manager') {
      const newDueDate = validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null;
      if (newDueDate !== originalDueDate) {
        const currentAssignee = validatedData.assigned_to || originalAssignedTo;
        if (currentAssignee && currentAssignee !== session.user.id) {
          const dueDateText = newDueDate 
            ? `Due date updated to: ${new Date(newDueDate).toLocaleDateString()}`
            : 'Due date removed';
          
          await createNotification(
            currentAssignee,
            "Task Due Date Updated",
            `Due date for task "${originalTitle}" has been updated. ${dueDateText}`,
            'info',
            `/tasks/${id}`
          );
        }
      }
    }

    logger.info("Task update notifications processed successfully", { taskId: id });
  } catch (notificationError) {
    logger.error("Failed to create task update notifications", notificationError, { taskId: id });
    // Don't throw error - task update should succeed even if notifications fail
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
