"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { 
  CheckCircle, 
  PlayCircle, 
  ListTodo,
  AlertCircle,
  Clock,
  User,
  Bell,
  Shield
} from 'lucide-react'
import { TaskPermissionService } from '@/lib/services/task-permissions'
import { UserRole, Task } from '@/lib/types'
import { updateTask } from '@/app/actions/tasks'
import { toast } from 'sonner'

interface TaskStatusUpdaterProps {
  task: Task
  userRole: UserRole
  currentUserId: string
  onStatusUpdate?: (newStatus: string) => void
}

export function TaskStatusUpdater({ 
  task, 
  userRole, 
  currentUserId, 
  onStatusUpdate 
}: TaskStatusUpdaterProps) {
  const t = useTranslations('tasks')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(task.status)

  // Get user permissions for this task
  const permissions = TaskPermissionService.getAvailableActions(task, userRole, currentUserId)

  const handleStatusUpdate = async (newStatus: string) => {
    if (!permissions.canUpdateStatus) {
      toast.error(t('noPermissionToUpdateStatus'))
      return
    }

    setIsUpdating(true)
    try {
      await updateTask(task.id, { status: newStatus })
      setSelectedStatus(newStatus)
      onStatusUpdate?.(newStatus)
      
      // Show success message based on status
      const statusMessages = {
        'todo': t('statusUpdatedToTodo'),
        'in_progress': t('statusUpdatedToInProgress'),
        'completed': t('statusUpdatedToCompleted')
      }
      
      toast.success(statusMessages[newStatus as keyof typeof statusMessages] || t('statusUpdated'))
    } catch (error) {
      console.error('Failed to update task status:', error)
      toast.error(t('failedToUpdateStatus'))
      setSelectedStatus(task.status) // Reset to original status
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <PlayCircle className="h-4 w-4" />
      case 'todo': return <ListTodo className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getNextRecommendedStatus = () => {
    switch (selectedStatus) {
      case 'todo': return 'in_progress'
      case 'in_progress': return 'completed'
      case 'completed': return null
      default: return null
    }
  }

  const nextStatus = getNextRecommendedStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          {t('taskStatus')}
        </CardTitle>
        <CardDescription>
          {permissions.canUpdateStatus 
            ? t('updateTaskStatusDescription')
            : t('viewOnlyStatusDescription')
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(selectedStatus)}
            <div>
              <p className="font-medium">{t('currentStatus')}</p>
              <Badge className={getStatusColor(selectedStatus)}>
                {getStatusLabel(selectedStatus)}
              </Badge>
            </div>
          </div>
          {task.assigned_to === currentUserId && (
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <User className="h-3 w-3" />
              <span>{t('assignedToYou')}</span>
            </div>
          )}
        </div>

        {/* Status Update Section */}
        {permissions.canUpdateStatus && permissions.allowedStatusTransitions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{t('updateStatus')}</span>
            </div>

            {/* Quick Action for Next Status */}
            {nextStatus && permissions.allowedStatusTransitions.includes(nextStatus) && (
              <Button
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={isUpdating}
                className="w-full"
                size="lg"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(nextStatus)}
                  <span>{t('markAs')} {getStatusLabel(nextStatus)}</span>
                </div>
              </Button>
            )}

            {/* Full Status Selector */}
            {permissions.allowedStatusTransitions.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('orSelectStatus')}</label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={selectedStatus} disabled>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedStatus)}
                        {getStatusLabel(selectedStatus)} ({t('current')})
                      </div>
                    </SelectItem>
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
          </div>
        )}

        {/* Permission Info */}
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-blue-800">{t('statusUpdatePermissions')}</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {permissions.canUpdateStatus ? (
              <>
                <p>✓ {t('canUpdateStatus')}</p>
                <p className="text-blue-600">
                  {t('allowedTransitions')}: {permissions.allowedStatusTransitions.map(getStatusLabel).join(', ')}
                </p>
              </>
            ) : (
              <p>✗ {t('cannotUpdateStatus')}</p>
            )}
          </div>
        </div>

        {/* Notification Info */}
        {permissions.canUpdateStatus && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">{t('notificationInfo')}</span>
            </div>
            <p className="text-xs text-yellow-700">
              {t('statusUpdateNotificationMessage')}
            </p>
          </div>
        )}

        {/* Task Timeline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('taskTimeline')}</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{t('created')}: {new Date(task.created_at).toLocaleDateString()}</span>
            </div>
            {task.due_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{t('dueDate')}: {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}