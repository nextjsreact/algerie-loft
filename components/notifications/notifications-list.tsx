"use client"

import { useLocale, useTranslations } from "next-intl"
import { useEffect } from "react"
import { markNotificationAsRead } from "@/app/actions/notifications"
import { useNotifications } from "@/components/providers/notification-context"
import { useFilteredNotifications, useNotificationTypeLabels } from "@/hooks/use-filtered-notifications"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle, Clock, AlertTriangle, Info, XCircle, Shield, AlertCircle } from "lucide-react"
import { Notification, UserRole } from "@/lib/types"

interface NotificationsListProps {
  notifications: Notification[]
  userRole: UserRole
  userId: string
  assignedTaskIds?: string[]
}

export default function NotificationsList({ 
  notifications, 
  userRole, 
  userId, 
  assignedTaskIds = [] 
}: NotificationsListProps) {
  const t = useTranslations("notifications")
  const tTasks = useTranslations("tasks")
  const locale = useLocale()
  const { refreshNotifications } = useNotifications()

  // Use enhanced notification filtering
  const {
    filteredNotifications,
    stats,
    isNotificationVisible,
    getNotificationPriority,
    getFallbackMessage
  } = useFilteredNotifications(notifications, {
    userRole,
    userId,
    assignedTaskIds,
    showOnlyUnread: false,
    priorityFilter: 'all'
  })

  const typeLabels = useNotificationTypeLabels(userRole)

  // Helper function to parse and translate old notification messages
  const parseAndTranslateOldMessage = (messageKey: string) => {
    // Pattern for "Due date for task..."
    const dueDatePattern = /Due date for task "([^"]+)" has been updated\. Due date updated to: (.+)/;
    let match = messageKey.match(dueDatePattern);
    if (match) {
      const taskTitle = match[1];
      const newDueDate = match[2];
      return t('taskDueDateUpdatedMessage', { taskTitle, newDueDate }); // Removed 'notifications.' prefix
    }

    // Pattern for "Status of your assigned task..."
    const statusPattern = /Status of your assigned task "([^"]+)" has been updated to "([^"]+)"\./;
    match = messageKey.match(statusPattern);
    if (match) {
      const taskTitle = match[1];
      const status = match[2];
      // Use the existing static key 'taskStatusUpdatedMessage'
      return t('taskStatusUpdatedMessage', { taskTitle, newStatus: tTasks(`statusOptions.${status}`) });
    }

    // If no pattern matches, return the original message key
    return messageKey;
  };

  // Mark all unread filtered notifications as read when the component mounts
  useEffect(() => {
    const markUnreadAsRead = async () => {
      const unreadNotifications = filteredNotifications.filter(n => !n.is_read)
      
      for (const notification of unreadNotifications) {
        try {
          await markNotificationAsRead(notification.id)
        } catch (error) {
          console.error('Error marking notification as read:', error)
        }
      }
      
      if (unreadNotifications.length > 0) {
        // Refresh the notifications context to update the badge
        await refreshNotifications()
      }
    }

    markUnreadAsRead()
  }, [filteredNotifications, refreshNotifications])

  const getNotificationIcon = (notification: Notification) => {
    const priority = getNotificationPriority(notification)
    const { type } = notification

    // High priority notifications get special icons
    if (priority === 'high') {
      switch (type) {
        case 'error':
        case 'critical_alert':
          return <XCircle className="h-5 w-5 text-red-500" />
        case 'task_overdue':
          return <AlertCircle className="h-5 w-5 text-red-500" />
        default:
          return <AlertTriangle className="h-5 w-5 text-red-500" />
      }
    }

    // Standard icons based on type
    switch (type) {
      case 'success':
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
      case 'task_overdue':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'task_assigned':
      case 'newTaskAssigned':
        return <Shield className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationColor = (notification: Notification) => {
    const priority = getNotificationPriority(notification)
    const { type } = notification

    // High priority notifications get red styling
    if (priority === 'high') {
      return 'border-red-200 bg-red-50'
    }

    // Medium priority gets orange/yellow styling
    if (priority === 'medium') {
      return 'border-orange-200 bg-orange-50'
    }

    // Standard colors based on type
    switch (type) {
      case 'success':
      case 'task_completed':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  if (filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('noNotifications')}
        </h3>
        <p className="text-gray-500 text-center max-w-sm">
          {getFallbackMessage()}
        </p>
        {stats.total > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            {stats.total} notifications filtered based on your role permissions
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics summary for admin/manager roles */}
      {['admin', 'manager'].includes(userRole) && stats.total > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-1 font-medium">{stats.total}</span>
            </div>
            <div>
              <span className="text-gray-500">Unread:</span>
              <span className="ml-1 font-medium text-blue-600">{stats.unread}</span>
            </div>
            <div>
              <span className="text-gray-500">High Priority:</span>
              <span className="ml-1 font-medium text-red-600">{stats.byPriority.high}</span>
            </div>
            <div>
              <span className="text-gray-500">Medium Priority:</span>
              <span className="ml-1 font-medium text-orange-600">{stats.byPriority.medium}</span>
            </div>
          </div>
        </div>
      )}

      {filteredNotifications.map((notification) => {
        const priority = getNotificationPriority(notification)
        
        return (
          <Card 
            key={notification.id} 
            className={`transition-all duration-200 hover:shadow-md ${
              !notification.is_read ? 'ring-2 ring-blue-200' : ''
            } ${getNotificationColor(notification)} ${
              priority === 'high' ? 'border-l-4 border-l-red-500' : 
              priority === 'medium' ? 'border-l-4 border-l-orange-500' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getNotificationIcon(notification)}
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {t(notification.title_key, notification.title_payload)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.created_at).toLocaleString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      High Priority
                    </Badge>
                  )}
                  {!notification.is_read && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {t('new')}
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {typeLabels[notification.type] || notification.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-700 leading-relaxed">
                {notification.message_payload
                  ? t(notification.message_key, notification.message_payload)
                  : parseAndTranslateOldMessage(notification.message_key)}
              </p>
              {notification.link && (
                <div className="mt-3">
                  <a 
                    href={notification.link}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t('viewDetails')} →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}