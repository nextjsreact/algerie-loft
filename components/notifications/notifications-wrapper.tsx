"use client"

import { useTranslations } from "next-intl"
import { useNotifications } from "@/components/providers/notification-context"
import NotificationsListOptimized from '@/components/notifications/notifications-list-optimized'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck } from "lucide-react"
import { Notification, UserRole } from "@/lib/types"
import { useState, useEffect, useRef } from "react"

interface NotificationsWrapperProps {
  notifications: Notification[]
  userRole: UserRole
  userId: string
  assignedTaskIds?: string[]
  onNotificationRead?: (id: string) => Promise<void>
  onMarkAllRead?: () => Promise<void>
}

export function NotificationsWrapper({ 
  notifications, 
  userRole, 
  userId, 
  assignedTaskIds = [],
  onNotificationRead,
  onMarkAllRead,
}: NotificationsWrapperProps) {
  const t = useTranslations("notifications")
  const { markAllAsRead } = useNotifications()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const [isMarking, setIsMarking] = useState(false)
  const initialSynced = useRef(false)

  // Only sync from parent on initial load (when data first arrives)
  useEffect(() => {
    if (!initialSynced.current && notifications.length > 0) {
      setLocalNotifications(notifications)
      initialSynced.current = true
    }
  }, [notifications])

  const unreadCount_local = localNotifications.filter(n => !n.is_read).length

  const handleMarkAllAsRead = async () => {
    if (isMarking) return
    setIsMarking(true)

    // Optimistically mark all as read in local state immediately
    setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    try {
      await markAllAsRead()
      if (onMarkAllRead) await onMarkAllRead()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      // Revert on error
      setLocalNotifications(notifications)
    } finally {
      setIsMarking(false)
    }
  }

  const handleNotificationRead = async (id: string) => {
    // Optimistically mark as read locally
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    if (onNotificationRead) await onNotificationRead(id)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-1">{t('description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount_local > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {t('unreadCount', { count: unreadCount_local })}
            </Badge>
          )}
          {unreadCount_local > 0 && (
            <Button 
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              disabled={isMarking}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              {t('markAllAsRead')}
            </Button>
          )}
        </div>
      </div>
      
      <NotificationsListOptimized 
        notifications={localNotifications}
        userRole={userRole}
        userId={userId}
        assignedTaskIds={assignedTaskIds}
        onNotificationRead={handleNotificationRead}
      />
    </div>
  )
}
