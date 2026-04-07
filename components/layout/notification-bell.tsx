"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { useNotifications } from "@/components/providers/notification-context"
import { CheckCheck, Bell, ExternalLink } from "lucide-react"

export function NotificationBell() {
  const locale = useLocale()
  const { unreadCount, markAllAsRead, refreshNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  const handleOpen = () => {
    setOpen(v => {
      if (!v) fetchNotifications()
      return !v
    })
  }

  const handleMarkAll = async () => {
    setMarking(true)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await markAllAsRead()
    setMarking(false)
  }

  const handleMarkOne = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    refreshNotifications()
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
              {unread > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={marking}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lire
                </button>
              )}
              <Link
                href={`/${locale}/notifications`}
                onClick={() => setOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Aucune notification</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkOne(n.id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.is_read ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}
                >
                  {/* Dot */}
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
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-center">
              <Link
                href={`/${locale}/notifications`}
                onClick={() => setOpen(false)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
