'use client'

import { useState, useCallback } from 'react'
import { Notification } from '@/lib/types'

interface NotificationFilters {
  category?: string
  unread_only?: boolean
  booking_id?: string
  page?: number
  limit?: number
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAsUnread: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  createNotification: (notification: Partial<Notification>) => Promise<void>
  refreshUnreadCount: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.unread_only) params.append('unread_only', 'true')
      if (filters.booking_id) params.append('booking_id', filters.booking_id)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/notifications?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications)
      setPagination(data.pagination)

      // Also refresh unread count
      await refreshUnreadCount()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))

    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }, [])

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: false }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as unread')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: false, read_at: null }
            : notification
        )
      )

      // Update unread count
      setUnreadCount(prev => prev + 1)

    } catch (err) {
      console.error('Error marking notification as unread:', err)
      throw err
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotificationIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)

      if (unreadNotificationIds.length === 0) return

      const response = await fetch('/api/notifications/batch-mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: unreadNotificationIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      )

      // Reset unread count
      setUnreadCount(0)

    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [notifications])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

    } catch (err) {
      console.error('Error deleting notification:', err)
      throw err
    }
  }, [notifications])

  const createNotification = useCallback(async (notification: Partial<Notification>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }

      const data = await response.json()
      
      // Add to local state if it's for the current user
      setNotifications(prev => [data.notification, ...prev])

    } catch (err) {
      console.error('Error creating notification:', err)
      throw err
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshUnreadCount
  }
}