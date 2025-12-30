"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  CheckCircle, 
  PlayCircle, 
  ListTodo,
  AlertCircle,
  Shield,
  Lock
} from 'lucide-react'
import { TaskPermissionService } from '@/lib/services/task-permissions'
import { UserRole, Task } from '@/lib/types'

interface TaskActionsProps {
  task: Task
  userRole: UserRole
  currentUserId: string
  onStatusUpdate?: (taskId: string, newStatus: string) => void
  compact?: boolean
}

export function TaskActions({ 
  task, 
  userRole, 
  currentUserId, 
  onStatusUpdate,
  compact = false 
}: TaskActionsProps) {
  const t = useTranslations('tasks')
  const [isUpdating, setIsUpdating] = useState(false)

  // Get user permissions for this task
  const permissions = TaskPermissionService.getAvailableActions(task, userRole, currentUserId)

  const handleStatusUpdate = async (newStatus: string) => {
    if (!permissions.canUpdateStatus || !onStatusUpdate) return

    setIsUpdating(true)
    try {
      await onStatusUpdate(task.id, newStatus)
    } catch (error) {
      console.error('Failed to update task status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'in_progress': return <PlayCircle className="h-3 w-3" />
      case 'todo': return <ListTodo className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('status.completed')
      case 'in_progress': return t('status.inProgress')
      case 'todo': return t('status.todo')
      default: return status
    }
  }

  // If user has no permissions, show restricted access indicator
  if (!permissions.canView) {
    return (
      <div className="flex items-center gap-2 pt-2 text-gray-400">
        <Lock className="h-3 w-3" />
        <span className="text-xs">{t('restrictedAccess')}</span>
      </div>
    )
  }

  // Compact view for dashboard cards
  if (compact) {
    return (
      <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {permissions.canView && (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/tasks/${task.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              {t('viewTask')}
            </Link>
          </Button>
        )}
        
        {permissions.canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/${task.id}/edit`}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>
        )}

        {permissions.canUpdateStatus && permissions.allowedStatusTransitions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isUpdating}>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {permissions.allowedStatusTransitions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon(status)}
                  {t('markAs')} {getStatusLabel(status)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  // Full view for task detail pages
  return (
    <div className="space-y-4">
      {/* Permission indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="h-4 w-4" />
        <span>
          {userRole === 'admin' || userRole === 'manager' 
            ? t('fullAccess') 
            : task.assigned_to === currentUserId 
              ? t('assignedAccess')
              : t('viewOnlyAccess')
          }
        </span>
      </div>

      {/* Status update section */}
      {permissions.canUpdateStatus && permissions.allowedStatusTransitions.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('updateStatus')}</label>
          <Select 
            value={task.status} 
            onValueChange={handleStatusUpdate}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={task.status} disabled>
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  {getStatusLabel(task.status)} ({t('current')})
                </div>
              </SelectItem>
              <DropdownMenuSeparator />
              {permissions.allowedStatusTransitions.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    {getStatusLabel(status)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {permissions.canView && (
          <Button variant="outline" asChild>
            <Link href={`/tasks/${task.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              {t('viewDetails')}
            </Link>
          </Button>
        )}

        {permissions.canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/tasks/${task.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              {t('editTask')}
            </Link>
          </Button>
        )}
      </div>

      {/* Permission summary */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <h4 className="text-sm font-medium text-gray-700">{t('yourPermissions')}</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Badge variant={permissions.canView ? "default" : "secondary"} className="text-xs">
              {permissions.canView ? t('allowed') : t('denied')}
            </Badge>
            <span>{t('view')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={permissions.canEdit ? "default" : "secondary"} className="text-xs">
              {permissions.canEdit ? t('allowed') : t('denied')}
            </Badge>
            <span>{t('edit')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={permissions.canUpdateStatus ? "default" : "secondary"} className="text-xs">
              {permissions.canUpdateStatus ? t('allowed') : t('denied')}
            </Badge>
            <span>{t('updateStatus')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={permissions.canReassign ? "default" : "secondary"} className="text-xs">
              {permissions.canReassign ? t('allowed') : t('denied')}
            </Badge>
            <span>{t('reassign')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}