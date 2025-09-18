"use client"

import { useTranslations } from "next-intl"
import { useNotifications } from "@/components/providers/notification-context"
import NotificationsListOptimized from '@/components/notifications/notifications-list-optimized'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck } from "lucide-react"
import { Notification, UserRole } from "@/lib/types"

interface NotificationsWrapperProps {
  notifications: Notification[]
  userRole: UserRole
  userId: string
  assignedTaskIds?: string[]
}

export function NotificationsWrapper({ 
  notifications, 
  userRole, 
  userId, 
  assignedTaskIds = [] 
}: NotificationsWrapperProps) {
  const t = useTranslations("notifications")
  const { unreadCount, markAllAsRead } = useNotifications()

  const unreadNotifications = notifications.filter(n => !n.is_read)

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
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {t('unreadCount', { count: unreadCount })}
            </Badge>
          )}
          {unreadNotifications.length > 0 && (
            <Button 
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              {t('markAllAsRead')}
            </Button>
          )}
        </div>
      </div>
      
      <NotificationsListOptimized 
        notifications={notifications}
        userRole={userRole}
        userId={userId}
        assignedTaskIds={assignedTaskIds}
      />
    </div>
  )
}