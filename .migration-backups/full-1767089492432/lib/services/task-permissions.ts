import { UserRole, Task } from '@/lib/types';

/**
 * Task permission validation service
 */
export class TaskPermissionService {
  /**
   * Check if user can view a specific task
   */
  static canViewTask(task: Task, userRole: UserRole, userId: string): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Full access to all tasks

      case 'executive':
        return false; // Executives don't need task details

      case 'member':
        // Members can only view tasks assigned to them or created by them
        return task.assigned_to === userId || task.user_id === userId;

      case 'guest':
      default:
        return false; // No task access for guests
    }
  }

  /**
   * Check if user can edit a specific task
   */
  static canEditTask(task: Task, userRole: UserRole, userId: string): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Full edit access

      case 'member':
        // Members can only edit tasks assigned to them
        return task.assigned_to === userId;

      case 'executive':
      case 'guest':
      default:
        return false; // No edit access
    }
  }

  /**
   * Check if user can update task status
   */
  static canUpdateTaskStatus(task: Task, userRole: UserRole, userId: string): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Full status update access

      case 'member':
        // Members can update status of tasks assigned to them
        return task.assigned_to === userId;

      case 'executive':
      case 'guest':
      default:
        return false; // No status update access
    }
  }

  /**
   * Check if user can create tasks
   */
  static canCreateTask(userRole: UserRole): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can create tasks

      case 'member':
      case 'executive':
      case 'guest':
      default:
        return false; // Cannot create tasks
    }
  }

  /**
   * Check if user can delete tasks
   */
  static canDeleteTask(task: Task, userRole: UserRole, userId: string): boolean {
    switch (userRole) {
      case 'admin':
        return true; // Admins can delete any task

      case 'manager':
        // Managers can delete tasks they created or are assigned to manage
        return task.user_id === userId;

      case 'member':
      case 'executive':
      case 'guest':
      default:
        return false; // Cannot delete tasks
    }
  }

  /**
   * Check if user can assign tasks to others
   */
  static canAssignTask(userRole: UserRole): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can assign tasks

      case 'member':
      case 'executive':
      case 'guest':
      default:
        return false; // Cannot assign tasks
    }
  }

  /**
   * Check if user can reassign tasks
   */
  static canReassignTask(task: Task, userRole: UserRole, userId: string): boolean {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can reassign any task

      case 'member':
      case 'executive':
      case 'guest':
      default:
        return false; // Cannot reassign tasks
    }
  }

  /**
   * Get allowed task status transitions for a user role
   */
  static getAllowedStatusTransitions(
    currentStatus: string, 
    userRole: UserRole, 
    isAssignedUser: boolean
  ): string[] {
    const allStatuses = ['todo', 'in_progress', 'completed'];

    switch (userRole) {
      case 'admin':
      case 'manager':
        // Admins and managers can transition to any status
        return allStatuses.filter(status => status !== currentStatus);

      case 'member':
        if (!isAssignedUser) {
          return []; // Members can only update tasks assigned to them
        }

        // Members can transition through the normal workflow
        switch (currentStatus) {
          case 'todo':
            return ['in_progress'];
          case 'in_progress':
            return ['completed', 'todo']; // Can go back to todo or complete
          case 'completed':
            return ['in_progress']; // Can reopen if needed
          default:
            return [];
        }

      case 'executive':
      case 'guest':
      default:
        return []; // No status update permissions
    }
  }

  /**
   * Check if user can update specific task fields
   */
  static getEditableFields(task: Task, userRole: UserRole, userId: string): string[] {
    switch (userRole) {
      case 'admin':
      case 'manager':
        // Full field access
        return [
          'title',
          'description',
          'status',
          'due_date',
          'assigned_to',
          'loft_id'
        ];

      case 'member':
        if (task.assigned_to !== userId) {
          return []; // No edit access if not assigned
        }
        
        // Members can only update status and add comments/descriptions
        return ['status', 'description'];

      case 'executive':
      case 'guest':
      default:
        return []; // No edit access
    }
  }

  /**
   * Validate task update data based on user permissions
   */
  static validateTaskUpdate(
    task: Task,
    updateData: Partial<Task>,
    userRole: UserRole,
    userId: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const editableFields = this.getEditableFields(task, userRole, userId);

    // Check if user can edit this task
    if (!this.canEditTask(task, userRole, userId)) {
      errors.push('You do not have permission to edit this task');
      return { isValid: false, errors };
    }

    // Check each field in the update data
    Object.keys(updateData).forEach(field => {
      if (!editableFields.includes(field)) {
        errors.push(`You do not have permission to update the '${field}' field`);
      }
    });

    // Validate status transitions
    if (updateData.status && updateData.status !== task.status) {
      const allowedTransitions = this.getAllowedStatusTransitions(
        task.status,
        userRole,
        task.assigned_to === userId
      );

      if (!allowedTransitions.includes(updateData.status)) {
        errors.push(`Invalid status transition from '${task.status}' to '${updateData.status}'`);
      }
    }

    // Validate assignment changes
    if (updateData.assigned_to && updateData.assigned_to !== task.assigned_to) {
      if (!this.canReassignTask(task, userRole, userId)) {
        errors.push('You do not have permission to reassign this task');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get task actions available to a user
   */
  static getAvailableActions(task: Task, userRole: UserRole, userId: string): {
    canView: boolean;
    canEdit: boolean;
    canUpdateStatus: boolean;
    canDelete: boolean;
    canReassign: boolean;
    allowedStatusTransitions: string[];
    editableFields: string[];
  } {
    return {
      canView: this.canViewTask(task, userRole, userId),
      canEdit: this.canEditTask(task, userRole, userId),
      canUpdateStatus: this.canUpdateTaskStatus(task, userRole, userId),
      canDelete: this.canDeleteTask(task, userRole, userId),
      canReassign: this.canReassignTask(task, userRole, userId),
      allowedStatusTransitions: this.getAllowedStatusTransitions(
        task.status,
        userRole,
        task.assigned_to === userId
      ),
      editableFields: this.getEditableFields(task, userRole, userId)
    };
  }

  /**
   * Filter task list based on user permissions and preferences
   */
  static filterTasksForUser(
    tasks: Task[],
    userRole: UserRole,
    userId: string,
    options: {
      showOnlyAssigned?: boolean;
      showOnlyCreated?: boolean;
      includeCompleted?: boolean;
    } = {}
  ): Task[] {
    const {
      showOnlyAssigned = false,
      showOnlyCreated = false,
      includeCompleted = true
    } = options;

    return tasks.filter(task => {
      // Basic permission check
      if (!this.canViewTask(task, userRole, userId)) {
        return false;
      }

      // Filter by assignment
      if (showOnlyAssigned && task.assigned_to !== userId) {
        return false;
      }

      // Filter by creator
      if (showOnlyCreated && task.user_id !== userId) {
        return false;
      }

      // Filter by completion status
      if (!includeCompleted && task.status === 'completed') {
        return false;
      }

      return true;
    });
  }
}