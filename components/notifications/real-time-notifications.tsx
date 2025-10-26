'use client'

import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  type: 'booking' | 'payment' | 'message' | 'review' | 'system' | 'promotion'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

interface RealTimeNotificationsProps {
  userId: string
  userRole: 'client' | 'partner' | 'admin'
}

export function RealTimeNotifications({ userId, userRole }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all')
  const wsRef = useRef<WebSocket | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    setupWebSocket()
    setupClickOutside()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [userId])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocket = () => {
    // In a real implementation, you would connect to a WebSocket server
    // For demo purposes, we'll simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 5 seconds
        addMockNotification()
      }
    }, 5000)

    return () => clearInterval(interval)
  }

  const addMockNotification = () => {
    const mockNotifications = [
      {
        type: 'booking' as const,
        title: 'Nouvelle réservation',
        message: 'Vous avez reçu une nouvelle réservation pour votre loft.',
        priority: 'high' as const
      },
      {
        type: 'payment' as const,
        title: 'Paiement reçu',
        message: 'Un paiement de 250€ a été traité avec succès.',
        priority: 'medium' as const
      },
      {
        type: 'message' as const,
        title: 'Nouveau message',
        message: 'Vous avez reçu un message de votre client.',
        priority: 'medium' as const
      },
      {
        type: 'review' as const,
        title: 'Nouvel avis',
        message: 'Un client a laissé un avis 5 étoiles !',
        priority: 'low' as const
      }
    ]

    const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)]
    
    const newNotification: Notification = {
      id: Date.now().toString(),
      ...randomNotification,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: '/dashboard',
      actionLabel: 'Voir détails'
    }

    setNotifications(prev => [newNotification, ...prev])
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(randomNotification.title, {
        body: randomNotification.message,
        icon: '/favicon.ico'
      })
    }
  }

  const setupClickOutside = () => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📅'
      case 'payment': return '💰'
      case 'message': return '💬'
      case 'review': return '⭐'
      case 'system': return '⚙️'
      case 'promotion': return '🎉'
      default: return '🔔'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626'
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read)
      case 'important':
        return notifications.filter(n => ['high', 'urgent'].includes(n.priority))
      default:
        return notifications
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return date.toLocaleDateString('fr-FR')
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown)
          requestNotificationPermission()
        }}
        style={{
          position: 'relative',
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1.5rem',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0.25rem',
              right: '0.25rem',
              backgroundColor: '#EF4444',
              color: 'white',
              borderRadius: '50%',
              width: '1.25rem',
              height: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '400px',
            maxHeight: '500px',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { key: 'all', label: 'Toutes', count: notifications.length },
                { key: 'unread', label: 'Non lues', count: unreadCount },
                { key: 'important', label: 'Importantes', count: notifications.filter(n => ['high', 'urgent'].includes(n.priority)).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: filter === tab.key ? '#EBF8FF' : 'transparent',
                    color: filter === tab.key ? '#3B82F6' : '#6B7280',
                    border: filter === tab.key ? '1px solid #3B82F6' : '1px solid transparent',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Chargement...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #F3F4F6',
                    backgroundColor: notification.read ? 'white' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#F8FAFC'}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                        <h4 style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: notification.read ? '500' : '600', 
                          margin: 0,
                          color: notification.read ? '#6B7280' : '#111827'
                        }}>
                          {notification.title}
                        </h4>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              backgroundColor: getPriorityColor(notification.priority)
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            style={{
                              padding: '0.125rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: '#9CA3AF'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#6B7280', 
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.625rem', color: '#9CA3AF' }}>
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        
                        {notification.actionUrl && (
                          <button
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.625rem',
                              cursor: 'pointer'
                            }}
                          >
                            {notification.actionLabel || 'Voir'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div style={{ padding: '0.75rem', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#3B82F6',
                  border: '1px solid #3B82F6',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}