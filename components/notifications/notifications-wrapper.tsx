"use client"

import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/components/providers/notification-context"
import NotificationsListOptimized from '@/components/notifications/notifications-list-optimized'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck, Home, AlertTriangle, XCircle, RefreshCw, Edit3 } from "lucide-react"
import { Notification, UserRole } from "@/lib/types"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

export interface AirbnbNotificationItem {
  id: string
  type: 'new' | 'updated' | 'cancelled' | 'conflict' | 'error'
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, any>
  lofts?: { id: string; name: string } | null
  reservations?: { id: string; guest_name: string } | null
}

interface NotificationsWrapperProps {
  notifications: Notification[]
  userRole: UserRole
  userId: string
  assignedTaskIds?: string[]
  airbnbNotifications?: AirbnbNotificationItem[]
  onNotificationRead?: (id: string) => Promise<void>
  onMarkAllRead?: () => Promise<void>
  onAirbnbNotificationRead?: (id: string) => Promise<void>
  onAirbnbMarkAllRead?: () => Promise<void>
}

export function NotificationsWrapper({
  notifications,
  userRole,
  userId,
  assignedTaskIds = [],
  airbnbNotifications = [],
  onNotificationRead,
  onMarkAllRead,
  onAirbnbNotificationRead,
  onAirbnbMarkAllRead,
}: NotificationsWrapperProps) {
  const t = useTranslations("notifications")
  const locale = useLocale()
  const router = useRouter()
  const { markAllAsRead } = useNotifications()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)
  const [localAirbnb, setLocalAirbnb] = useState<AirbnbNotificationItem[]>(airbnbNotifications)
  const [isMarking, setIsMarking] = useState(false)
  const initialSynced = useRef(false)
  const initialAirbnbSynced = useRef(false)

  // Sync once from parent when the API payload is available, including empty arrays
  useEffect(() => {
    if (!initialSynced.current) {
      setLocalNotifications(notifications)
      initialSynced.current = true
    }
  }, [notifications])

  useEffect(() => {
    if (!initialAirbnbSynced.current) {
      setLocalAirbnb(airbnbNotifications)
      initialAirbnbSynced.current = true
    }
  }, [airbnbNotifications])

  const unreadCount_local = localNotifications.filter(n => !n.is_read).length
  const airbnbUnread = localAirbnb.filter(n => !n.is_read).length
  const totalUnread = unreadCount_local + airbnbUnread

  const handleMarkAllAsRead = async () => {
    if (isMarking) return
    setIsMarking(true)

    setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setLocalAirbnb(prev => prev.map(n => ({ ...n, is_read: true })))

    try {
      await Promise.all([
        markAllAsRead(),
        onMarkAllRead ? onMarkAllRead() : Promise.resolve(),
        onAirbnbMarkAllRead ? onAirbnbMarkAllRead() : Promise.resolve(),
      ])
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('airbnb-notifications-changed'))
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      setLocalNotifications(notifications)
      setLocalAirbnb(airbnbNotifications)
      toast.error('Erreur lors du marquage des notifications')
    } finally {
      setIsMarking(false)
    }
  }

  const handleNotificationRead = async (id: string) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    if (onNotificationRead) await onNotificationRead(id)
  }

  const handleAirbnbRead = async (n: AirbnbNotificationItem) => {
    setLocalAirbnb(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    if (onAirbnbNotificationRead) {
      try {
        await onAirbnbNotificationRead(n.id)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('airbnb-notifications-changed'))
        }
        if (n.reservations?.id) {
          router.push(`/${locale}/reservations/${n.reservations.id}`)
        }
      } catch (err) {
        console.error('Failed to mark Airbnb notification as read:', err)
        setLocalAirbnb(prev => prev.map(x => x.id === n.id ? { ...x, is_read: false } : x))
        toast.error('Erreur lors du marquage de la notification')
      }
    }
  }

  const getAirbnbTypeStyle = (type: string) => {
    switch (type) {
      case 'new': return { row: 'bg-green-50 border-l-4 border-green-500', icon: Home, iconColor: 'text-green-600' }
      case 'updated': return { row: 'bg-blue-50 border-l-4 border-blue-500', icon: Edit3, iconColor: 'text-blue-600' }
      case 'cancelled': return { row: 'bg-red-50 border-l-4 border-red-500', icon: XCircle, iconColor: 'text-red-600' }
      case 'conflict': return { row: 'bg-orange-50 border-l-4 border-orange-500', icon: AlertTriangle, iconColor: 'text-orange-600' }
      case 'error': return { row: 'bg-red-50 border-l-4 border-red-500', icon: AlertTriangle, iconColor: 'text-red-600' }
      default: return { row: 'bg-gray-50 border-l-4 border-gray-500', icon: RefreshCw, iconColor: 'text-gray-600' }
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "À l'instant"
    if (diff < 3600) { const m = Math.floor(diff / 60); return `Il y a ${m} minute${m > 1 ? 's' : ''}` }
    if (diff < 86400) { const h = Math.floor(diff / 3600); return `Il y a ${h} heure${h > 1 ? 's' : ''}` }
    const d = Math.floor(diff / 86400); return `Il y a ${d} jour${d > 1 ? 's' : ''}`
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
          {totalUnread > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {t('unreadCount', { count: totalUnread })}
            </Badge>
          )}
          {totalUnread > 0 && (
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

      {localAirbnb.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Airbnb
              {airbnbUnread > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  {airbnbUnread} non lue{airbnbUnread > 1 ? 's' : ''}
                </Badge>
              )}
            </h2>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {localAirbnb.map(n => {
              const style = getAirbnbTypeStyle(n.type)
              const Icon = style.icon
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleAirbnbRead(n)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${style.row} ${!n.is_read ? 'font-medium' : 'opacity-75'}`}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${style.iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-gray-400">{formatTimeAgo(n.created_at)}</p>
                      {n.lofts?.name && (
                        <span className="text-[11px] text-gray-500">· {n.lofts.name}</span>
                      )}
                      {!n.is_read && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Nouveau</span>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {localNotifications.length > 0 && (
        <div>
          {localAirbnb.length > 0 && (
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount_local > 0 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                  {unreadCount_local} non lue{unreadCount_local > 1 ? 's' : ''}
                </Badge>
              )}
            </h2>
          )}
          <NotificationsListOptimized
            notifications={localNotifications}
            userRole={userRole}
            userId={userId}
            assignedTaskIds={assignedTaskIds}
            disableFiltering
            onNotificationRead={handleNotificationRead}
          />
        </div>
      )}

      {localNotifications.length === 0 && localAirbnb.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Aucune notification</p>
        </div>
      )}
    </div>
  )
}
