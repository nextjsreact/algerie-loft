"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/components/providers/notification-context"
import { CheckCheck, Bell, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface AirbnbNotification {
  id: string
  type: 'new' | 'updated' | 'cancelled' | 'conflict' | 'error'
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata: {
    guest_name?: string
    check_in?: string
    check_out?: string
    total_price?: number
    loft_name?: string
  }
  lofts?: {
    id: string
    name: string
  }
  reservations?: {
    id: string
    guest_name: string
  }
}

interface UnifiedNotificationBellProps {
  userRole?: string
}

export function UnifiedNotificationBell({ userRole }: UnifiedNotificationBellProps) {
  const locale = useLocale()
  const router = useRouter()
  const { unreadCount: normalUnreadCount, markAllAsRead, refreshNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const [normalNotifications, setNormalNotifications] = useState<any[]>([])
  const [airbnbNotifications, setAirbnbNotifications] = useState<AirbnbNotification[]>([])
  const [airbnbUnreadCount, setAirbnbUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const [lastAirbnbNotificationId, setLastAirbnbNotificationId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Vérifier le rôle
  const staffRoles = ['admin', 'manager', 'member', 'executive']
  const isStaff = userRole && staffRoles.includes(userRole)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Fetch Airbnb notifications
  const fetchAirbnbNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/airbnb/notifications?unread=true&limit=20')
      if (res.ok) {
        const data = await res.json()
        
        // Show toast for new notifications
        if (data.notifications.length > 0 && data.notifications[0].id !== lastAirbnbNotificationId) {
          const latestNotif = data.notifications[0]
          if (lastAirbnbNotificationId !== null) {
            toast.success(latestNotif.title, {
              description: latestNotif.message,
              duration: 5000,
            })
          }
          setLastAirbnbNotificationId(latestNotif.id)
        }
        
        setAirbnbNotifications(data.notifications || [])
        setAirbnbUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching Airbnb notifications:', error)
    }
  }, [lastAirbnbNotificationId])

  // Fetch normal notifications
  const fetchNormalNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setNormalNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching normal notifications:', error)
    }
  }, [])

  // Fetch all notifications
  const fetchAllNotifications = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchNormalNotifications(),
      fetchAirbnbNotifications()
    ])
    setLoading(false)
  }, [fetchNormalNotifications, fetchAirbnbNotifications])

  // Polling for Airbnb notifications (every 30 seconds)
  useEffect(() => {
    fetchAirbnbNotifications()
    const interval = setInterval(fetchAirbnbNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchAirbnbNotifications])

  // Sync bell state when other components (e.g. Notifications page) mark an Airbnb notif as read
  useEffect(() => {
    const handler = () => {
      fetchAirbnbNotifications()
      fetchNormalNotifications()
    }
    window.addEventListener('airbnb-notifications-changed', handler)
    return () => window.removeEventListener('airbnb-notifications-changed', handler)
  }, [fetchAirbnbNotifications, fetchNormalNotifications])

  const handleOpen = () => {
    setOpen(v => {
      if (!v) fetchAllNotifications()
      return !v
    })
  }

  const handleMarkAllNormal = async () => {
    setMarking(true)
    setNormalNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await markAllAsRead()
    setMarking(false)
  }

  const handleMarkAllAirbnb = async () => {
    setMarking(true)
    try {
      const res = await fetch('/api/airbnb/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        setAirbnbNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setAirbnbUnreadCount(0)
        window.dispatchEvent(new CustomEvent('airbnb-notifications-changed'))
        toast.success('Toutes les notifications Airbnb ont été marquées comme lues')
      } else {
        toast.error('Erreur lors du marquage des notifications')
      }
    } catch (error) {
      console.error('Error marking all Airbnb notifications as read:', error)
      toast.error('Erreur lors du marquage des notifications')
    }
    setMarking(false)
  }

  const handleMarkOneNormal = async (id: string) => {
    setNormalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    refreshNotifications()
  }

  const handleMarkOneAirbnb = async (n: AirbnbNotification) => {
    try {
      const res = await fetch(`/api/airbnb/notifications/${n.id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        setAirbnbNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
        setAirbnbUnreadCount(prev => Math.max(0, prev - 1))
        window.dispatchEvent(new CustomEvent('airbnb-notifications-changed'))

        if (n.reservations?.id) {
          setOpen(false)
          router.push(`/${locale}/reservations/${n.reservations.id}`)
        }
      } else {
        let errorMessage = 'Erreur inconnue'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData)
          console.error('Error marking Airbnb notification as read:', {
            status: res.status,
            statusText: res.statusText,
            error: errorData
          })
        } catch (e) {
          console.error('Error parsing error response:', e)
          errorMessage = `HTTP ${res.status}: ${res.statusText}`
        }
        toast.error(`Erreur: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Network error marking Airbnb notification as read:', error)
      toast.error('Erreur réseau lors du marquage de la notification')
    }
  }

  const totalUnreadCount = normalUnreadCount + airbnbUnreadCount
  const normalUnread = normalNotifications.filter(n => !n.is_read).length
  const airbnbUnread = airbnbNotifications.filter(n => !n.is_read).length

  // Get type color for Airbnb notifications
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'new': return 'bg-green-50 border-l-4 border-green-500'
      case 'updated': return 'bg-blue-50 border-l-4 border-blue-500'
      case 'cancelled': return 'bg-red-50 border-l-4 border-red-500'
      case 'conflict': return 'bg-orange-50 border-l-4 border-orange-500'
      case 'error': return 'bg-red-50 border-l-4 border-red-500'
      default: return 'bg-gray-50 border-l-4 border-gray-500'
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "À l'instant"
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    }
    const days = Math.floor(diffInSeconds / 86400)
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  }

  // Ne rien afficher pour les non-staff (clients, guests...)
  if (!isStaff) return null

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {totalUnreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[480px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
              {totalUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnreadCount}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {totalUnreadCount > 0 && (
                <button
                  onClick={() => {
                    handleMarkAllNormal()
                    handleMarkAllAirbnb()
                  }}
                  disabled={marking}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lire
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Airbnb Notifications Section */}
                {airbnbNotifications.length > 0 && (
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        🏠 Airbnb ({airbnbUnread} non lues)
                      </span>
                      {airbnbUnread > 0 && (
                        <button
                          onClick={handleMarkAllAirbnb}
                          disabled={marking}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          Tout marquer
                        </button>
                      )}
                    </div>
                    {airbnbNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkOneAirbnb(n)}
                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${getTypeColor(n.type)} ${!n.is_read ? 'font-medium' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[11px] text-gray-400">{formatTimeAgo(n.created_at)}</p>
                            {!n.is_read && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Nouveau</span>
                            )}
                          </div>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Normal Notifications Section */}
                {normalNotifications.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        📢 Notifications ({normalUnread} non lues)
                      </span>
                      {normalUnread > 0 && (
                        <button
                          onClick={handleMarkAllNormal}
                          disabled={marking}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          Tout marquer
                        </button>
                      )}
                    </div>
                    {normalNotifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkOneNormal(n.id)}
                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.is_read ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}
                      >
                        <div className="mt-1.5 flex-shrink-0">
                          {!n.is_read
                            ? <span className="block w-2 h-2 rounded-full bg-blue-500" />
                            : <span className="block w-2 h-2 rounded-full bg-gray-200" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                            {n.title_key || n.title || "Notification"}
                          </p>
                          {(n.message_key || n.message) && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message_key || n.message}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {n.created_at ? new Date(n.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {normalNotifications.length === 0 && airbnbNotifications.length === 0 && (
                  <div className="py-10 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm">Aucune notification</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {(normalNotifications.length > 0 || airbnbNotifications.length > 0) && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-center bg-gray-50 dark:bg-gray-800">
              <Link
                href={`/${locale}/notifications`}
                onClick={() => setOpen(false)}
                className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
              >
                Voir toutes les notifications
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
