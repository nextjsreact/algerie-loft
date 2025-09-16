"use client"

import { useLocale, useTranslations } from "next-intl"
import { useEffect, useCallback, useMemo, memo, useState } from "react"
import { markNotificationAsRead } from "@/app/actions/notifications"
import { useNotifications } from "@/components/providers/notification-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle, Clock, AlertTriangle, Info, XCircle } from "lucide-react"

interface NotificationsListProps {
  notifications: any[]
}

// Component to handle async message translation
const NotificationMessage = ({ notification, translateMessage }: { notification: any, translateMessage: any }) => {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    const loadMessage = async () => {
      try {
        const translatedMessage = await translateMessage(notification)
        setMessage(translatedMessage)
      } catch (error) {
        console.error('Error translating message:', error)
        setMessage(notification.message_key || 'Unknown message')
      }
    }

    loadMessage()
  }, [notification, translateMessage])

  return (
    <p className="text-gray-700 leading-relaxed">
      {message}
    </p>
  )
}

// Memoized notification card component to prevent re-renders
const NotificationCard = memo(({ 
  notification, 
  getNotificationIcon, 
  getNotificationColor,
  translateTitle,
  translateMessage,
  translateBadge,
  locale 
}: any) => {
  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        !notification.is_read ? 'ring-2 ring-blue-200' : ''
      } ${getNotificationColor(notification.type || 'info')}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getNotificationIcon(notification.type || 'info')}
            <div>
              <CardTitle className="text-base font-semibold">
                {translateTitle(notification)}
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
            {!notification.is_read && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {translateBadge('new')}
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {translateBadge(notification.type || 'info')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <NotificationMessage notification={notification} translateMessage={translateMessage} />
        {notification.link && (
          <div className="mt-3">
            <a
              href={notification.link}
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {translateBadge('viewDetails')} →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if notification data changes
  return prevProps.notification.id === nextProps.notification.id &&
         prevProps.notification.is_read === nextProps.notification.is_read
})

NotificationCard.displayName = 'NotificationCard'

export default function NotificationsListOptimized({ notifications }: NotificationsListProps) {
  const t = useTranslations("notifications")
  const tTasks = useTranslations("tasks")
  const locale = useLocale()
  const { refreshNotifications } = useNotifications()

  // Cache for parsed messages to avoid re-parsing
  const messageCache = useMemo(() => new Map<string, string>(), [])

  // Helper function to parse and translate old notification messages or direct keys
  const parseAndTranslateOldMessage = useCallback((messageKey: string) => {
    // Check cache first
    if (messageCache.has(messageKey)) {
      return messageCache.get(messageKey)!;
    }

    let result = messageKey;

    // Handle direct translation keys (notifications stored as raw keys in database)
    if (messageKey === 'taskStatusUpdatedMessage') {
      result = t('taskStatusUpdatedMessage', {
        taskTitle: t('task'),
        newStatus: t('status')
      });
    } else if (messageKey === 'taskDueDateUpdatedMessage') {
      result = t('taskDueDateUpdatedMessage', {
        taskTitle: t('task'),
        dueDate: t('updated')
      });
    } else if (messageKey === 'notificationReadMessage') {
      result = t('notificationReadMessage', {
        taskTitle: t('task'),
        userName: t('unknownUser')
      });
    } else if (messageKey === 'newTaskAssignedMessage') {
      result = t('newTaskAssignedMessage', {
        taskTitle: t('task'),
        dueDate: ''
      });
    } else {
      // Pattern for "Due date for task \"TITLE\" has been updated. Due date updated to: DATE"
      const dueDatePattern = /Due date for task "([^"]+)" has been updated\. Due date updated to: (.+)/;
      let match = messageKey.match(dueDatePattern);
      if (match) {
        const taskTitle = match[1];
        const newDueDate = match[2];
        result = t('taskDueDateUpdatedMessage', { taskTitle, newDueDate });
      } else {
        // Pattern for "Status of your assigned task \"TITLE\" has been updated to \"STATUS\"."
        const statusPattern = /Status of your assigned task "([^"]+)" has been updated to "([^"]+)"\./;
        match = messageKey.match(statusPattern);
        if (match) {
          const taskTitle = match[1];
          const status = match[2];
          result = t('taskStatusUpdatedMessage', { taskTitle, newStatus: tTasks(`statusOptions.${status}`) });
        } else {
          // Pattern for "Your notification for task "TITLE" has been read by USER."
          const notificationReadPattern = /Your notification for task "([^"]+)" has been read by (.+)\./;
          match = messageKey.match(notificationReadPattern);
          if (match) {
            const taskTitle = match[1];
            const userName = match[2];
            result = t('notificationReadMessage', { taskTitle, userName });
          } else {
            // If no pattern matches, try to translate as a direct key
            try {
              const translated = t(messageKey);
              if (translated !== messageKey) { // Only use if translation actually worked
                result = translated;
              } else {
                result = messageKey; // Fallback to original
              }
            } catch {
              result = messageKey; // Fallback to original if translation fails
            }
          }
        }
      }
    }

    messageCache.set(messageKey, result);
    return result;
  }, [t, tTasks, messageCache]);

  // OPTIMIZATION: Batch mark as read with a single API call
  const batchMarkAsRead = useCallback(async (notificationIds: string[]) => {
    console.log(`🚀 [OPTIMIZED] Marking ${notificationIds.length} notifications as read in batch`)
    const startTime = performance.now()
    
    try {
      // Create a batch update function on the server
      const response = await fetch('/api/notifications/batch-mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })
      
      if (!response.ok) {
        // Fallback to individual calls if batch API doesn't exist
        console.warn('⚠️ Batch API not available, falling back to parallel calls')
        
        // OPTIMIZATION: Use Promise.all for parallel execution instead of sequential
        await Promise.all(
          notificationIds.map(id => 
            markNotificationAsRead(id).catch(err => 
              console.error(`Failed to mark notification ${id} as read:`, err)
            )
          )
        )
      }
      
      const endTime = performance.now()
      console.log(`✅ [OPTIMIZED] Batch update completed in ${(endTime - startTime).toFixed(2)}ms`)
      
      await refreshNotifications()
    } catch (error) {
      console.error('Error in batch marking notifications:', error)
    }
  }, [refreshNotifications])

  // Mark all unread notifications as read when component mounts
  useEffect(() => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id)
    
    if (unreadIds.length > 0) {
      batchMarkAsRead(unreadIds)
    }
  }, []) // Empty dependency array - only run once on mount

  // Memoized icon getter
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }, [])

  // Memoized color getter
  const getNotificationColor = useCallback((type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }, [])

  // Memoized translation functions
  const translateTitle = useCallback((notification: any) => {
    return t(notification.title_key, notification.title_payload)
  }, [t])

  const translateMessage = useCallback(async (notification: any) => {
    // Prioritize message_payload if available, otherwise try to parse old message_key
    if (notification.message_payload && notification.message_key) {
      // Ensure message_payload has required variables, provide fallbacks if missing
      const payload = { ...notification.message_payload };
      if (notification.message_key === 'notificationReadMessage') {
        if (!payload.taskTitle) payload.taskTitle = 'Unknown Task';
        if (!payload.userName || payload.userName === 'unknownUser') payload.userName = t('unknownUser');
      }
      return t(notification.message_key, payload);
    }

    // Handle raw message keys that were stored in database without proper payload
    if (notification.message_key === 'taskStatusUpdatedMessage') {
      let taskTitle = t('task');
      let newStatus = t('updated');

      // Try to fetch actual task title from database
      if (notification.link) {
        const taskIdMatch = notification.link.match(/\/tasks\/([^\/]+)/);
        if (taskIdMatch) {
          try {
            // Fetch task data from Supabase
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: task } = await supabase
              .from('tasks')
              .select('title')
              .eq('id', taskIdMatch[1])
              .single();

            if (task?.title) {
              taskTitle = task.title;
            }
          } catch (error) {
            console.warn('Failed to fetch task title:', error);
            // Fallback to generic title
            taskTitle = `${t('task')} ${taskIdMatch[1].slice(0, 8)}...`;
          }
        }
      }

      return t('taskStatusUpdatedMessage', { taskTitle, newStatus });
    }

    return parseAndTranslateOldMessage(notification.message_key);
  }, [t, parseAndTranslateOldMessage])

  const translateBadge = useCallback((key: string) => {
    return t(key)
  }, [t])

  // Memoize empty state
  const emptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Bell className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('noNotifications')}
      </h3>
      <p className="text-gray-500 text-center max-w-sm">
        {t('noNotificationsMessage')}
      </p>
    </div>
  ), [t])

  if (notifications.length === 0) {
    return emptyState
  }

  return (
    <div className="space-y-4">
      {/* Performance indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-green-800 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {t('optimizedBanner.title')}
        </h4>
        <p className="text-green-700 text-sm mt-1">
          {t('optimizedBanner.description')}
        </p>
      </div>
      
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          getNotificationIcon={getNotificationIcon}
          getNotificationColor={getNotificationColor}
          translateTitle={translateTitle}
          translateMessage={translateMessage}
          translateBadge={translateBadge}
          locale={locale}
        />
      ))}
    </div>
  )
}