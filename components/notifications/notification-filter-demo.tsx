"use client"

import { useState } from 'react'
import { useFilteredNotifications } from '@/hooks/use-filtered-notifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Notification, UserRole } from '@/lib/types'
import { Filter, Users, Shield, Eye, EyeOff } from 'lucide-react'

interface NotificationFilterDemoProps {
  notifications: Notification[]
  currentUserRole: UserRole
  currentUserId: string
}

export function NotificationFilterDemo({ 
  notifications, 
  currentUserRole, 
  currentUserId 
}: NotificationFilterDemoProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUserRole)
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const {
    filteredNotifications,
    stats,
    getFallbackMessage
  } = useFilteredNotifications(notifications, {
    userRole: selectedRole,
    userId: currentUserId,
    assignedTaskIds: [], // Demo purposes
    showOnlyUnread,
    priorityFilter
  })

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrator', description: 'Full access to all notifications' },
    { value: 'manager', label: 'Manager', description: 'Access to operational and administrative notifications' },
    { value: 'executive', label: 'Executive', description: 'Access to executive reports and critical alerts' },
    { value: 'member', label: 'Member', description: 'Access to task-related notifications only' },
    { value: 'guest', label: 'Guest', description: 'No notification access' }
  ]

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'executive': return 'bg-purple-100 text-purple-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'guest': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Role-Based Notification Filtering Demo
        </CardTitle>
        <CardDescription>
          See how notifications are filtered based on different user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User Role</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority Filter</label>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority Only</SelectItem>
                <SelectItem value="medium">Medium Priority Only</SelectItem>
                <SelectItem value="low">Low Priority Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Button
              variant={showOnlyUnread ? "default" : "outline"}
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className="w-full justify-start"
            >
              {showOnlyUnread ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showOnlyUnread ? 'Unread Only' : 'All Notifications'}
            </Button>
          </div>
        </div>

        {/* Current Role Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Current Role:</span>
            <Badge className={getRoleColor(selectedRole)}>
              {roles.find(r => r.value === selectedRole)?.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {roles.find(r => r.value === selectedRole)?.description}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Visible</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.byPriority.high}</div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.byPriority.medium}</div>
            <div className="text-sm text-gray-500">Medium Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.byPriority.low}</div>
            <div className="text-sm text-gray-500">Low Priority</div>
          </div>
        </div>

        {/* Filtered Results */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">
            Filtered Notifications ({filteredNotifications.length})
          </h4>
          
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{getFallbackMessage()}</p>
              {stats.total === 0 && notifications.length > 0 && (
                <p className="text-xs mt-2">
                  {notifications.length} notifications filtered out based on role permissions
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredNotifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-2 bg-white border rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title_key}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {notification.type} • {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {!notification.is_read && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredNotifications.length > 5 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  ... and {filteredNotifications.length - 5} more notifications
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}