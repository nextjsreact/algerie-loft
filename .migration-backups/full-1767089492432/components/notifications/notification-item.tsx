'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, MessageSquare, Calendar, CreditCard, AlertTriangle, Info, CheckCircle, X, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Notification } from '@/lib/types'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
  onMarkAsRead?: () => void
  onDelete?: () => void
  className?: string
}

export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  className
}: NotificationItemProps) {
  const getNotificationIcon = () => {
    switch (notification.notification_category) {
      case 'booking':
        return <Calendar className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      default:
        return <Info className="h-3 w-3 text-blue-500" />
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'normal':
        return 'border-l-blue-500'
      case 'low':
        return 'border-l-gray-300'
      default:
        return 'border-l-blue-500'
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.()
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkAsRead?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <div
      className={cn(
        'relative p-3 border-l-2 hover:bg-muted/50 cursor-pointer transition-colors',
        getPriorityColor(),
        !notification.is_read && 'bg-muted/30',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 p-1.5 rounded-full',
          notification.notification_category === 'booking' && 'bg-blue-100 text-blue-600',
          notification.notification_category === 'payment' && 'bg-green-100 text-green-600',
          notification.notification_category === 'message' && 'bg-purple-100 text-purple-600',
          notification.notification_category === 'system' && 'bg-gray-100 text-gray-600',
          !notification.notification_category && 'bg-gray-100 text-gray-600'
        )}>
          {getNotificationIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getTypeIcon()}
                <h4 className={cn(
                  'text-sm font-medium truncate',
                  !notification.is_read && 'font-semibold'
                )}>
                  {notification.title}
                </h4>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {notification.message}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                  
                  {notification.notification_category && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {notification.notification_category}
                    </Badge>
                  )}
                  
                  {notification.priority !== 'normal' && (
                    <Badge 
                      variant={notification.priority === 'urgent' || notification.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {notification.priority}
                    </Badge>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {!notification.is_read && onMarkAsRead && (
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    {notification.is_read && onMarkAsRead && (
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        Mark as unread
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification.sender_id && (
        <div className="mt-2 text-xs text-muted-foreground">
          From: {notification.sender?.full_name || notification.sender?.email || 'System'}
        </div>
      )}
    </div>
  )
}