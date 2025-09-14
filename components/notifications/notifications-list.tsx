"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { markNotificationAsRead } from "@/app/actions/notifications"
import { useNotifications } from "@/components/providers/notification-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle, Clock, AlertTriangle, Info, XCircle } from "lucide-react"

interface NotificationsListProps {
  notifications: any[]
}

export default function NotificationsList({ notifications }: NotificationsListProps) {
  const t = useTranslations("notifications")
  const { refreshNotifications } = useNotifications()

  // Mark all unread notifications as read when the component mounts
  useEffect(() => {
    const markUnreadAsRead = async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      
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
  }, [notifications, refreshNotifications])

  const getNotificationIcon = (type: string) => {
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
  }

  const getNotificationColor = (type: string) => {
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
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('noNotifications')}
        </h3>
        <p className="text-gray-500 text-center max-w-sm">
          Vous recevrez ici les notifications importantes concernant vos tâches et activités.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
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
                    {notification.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(notification.created_at).toLocaleString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Nouveau
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {notification.type || 'info'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-700 leading-relaxed">
              {notification.message}
            </p>
            {notification.link && (
              <div className="mt-3">
                <a 
                  href={notification.link}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Voir les détails →
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}