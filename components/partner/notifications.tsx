"use client"

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Settings, Filter, Trash2, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { PartnerNotification, PartnerNotificationType, PartnerNotificationPreferences } from '@/lib/services/partner-notification-service';

interface NotificationBellProps {
  partnerId: string;
  unreadCount: number;
  onNotificationClick: () => void;
}

export function NotificationBell({ partnerId, unreadCount, onNotificationClick }: NotificationBellProps) {
  return (
    <button
      onClick={onNotificationClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

interface NotificationPanelProps {
  partnerId: string;
  isOpen: boolean;
  onClose: () => void;
  notifications: PartnerNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function NotificationPanel({
  partnerId,
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onLoadMore,
  hasMore,
  loading
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high':
        return notification.priority === 'high' || notification.priority === 'urgent';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bell className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDeleteNotification}
                  />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={onLoadMore}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: PartnerNotification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getNotificationIcon = (type: PartnerNotificationType) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'registration_approved':
        return <Check className={`${iconClass} text-green-500`} />;
      case 'registration_rejected':
        return <X className={`${iconClass} text-red-500`} />;
      case 'new_reservation':
        return <Bell className={`${iconClass} text-blue-500`} />;
      case 'payment_received':
        return <Check className={`${iconClass} text-green-500`} />;
      case 'system_maintenance':
        return <Settings className={`${iconClass} text-orange-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`p-4 border-l-4 ${notification.read ? 'bg-white' : getPriorityColor(notification.priority)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              {notification.data && (
                <div className="mt-2">
                  {notification.type === 'new_reservation' && notification.data.property_name && (
                    <div className="text-xs text-gray-500">
                      Property: {notification.data.property_name}
                    </div>
                  )}
                  {notification.type === 'payment_received' && notification.data.amount && (
                    <div className="text-xs text-green-600 font-medium">
                      +{notification.data.amount} {notification.data.currency}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(notification.created_at)}
            </span>
            
            <div className="flex items-center space-x-1">
              {notification.channels.includes('email') && (
                <Mail className="w-3 h-3 text-gray-400" title="Email sent" />
              )}
              {notification.channels.includes('sms') && (
                <Smartphone className="w-3 h-3 text-gray-400" title="SMS sent" />
              )}
              {notification.channels.includes('in_app') && (
                <MessageSquare className="w-3 h-3 text-gray-400" title="In-app notification" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationPreferencesProps {
  partnerId: string;
  preferences: PartnerNotificationPreferences;
  onUpdatePreferences: (preferences: Partial<PartnerNotificationPreferences>) => void;
  onClose: () => void;
}

export function NotificationPreferences({
  partnerId,
  preferences,
  onUpdatePreferences,
  onClose
}: NotificationPreferencesProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleChannelToggle = (channel: 'email' | 'in_app' | 'sms' | 'push', enabled: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [`${channel}_enabled`]: enabled
    }));
  };

  const handleNotificationTypeToggle = (type: PartnerNotificationType, enabled: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: {
          ...prev.preferences[type],
          enabled
        }
      }
    }));
  };

  const handleSave = () => {
    onUpdatePreferences(localPreferences);
    onClose();
  };

  const notificationTypes: { type: PartnerNotificationType; label: string; description: string }[] = [
    { type: 'registration_approved', label: 'Registration Approved', description: 'When your partner application is approved' },
    { type: 'registration_rejected', label: 'Registration Rejected', description: 'When your partner application is rejected' },
    { type: 'property_added', label: 'Property Added', description: 'When a new property is added to your portfolio' },
    { type: 'property_updated', label: 'Property Updated', description: 'When your property details are updated' },
    { type: 'new_reservation', label: 'New Reservations', description: 'When you receive a new booking' },
    { type: 'reservation_cancelled', label: 'Cancelled Reservations', description: 'When a booking is cancelled' },
    { type: 'payment_received', label: 'Payments', description: 'When you receive payments' },
    { type: 'revenue_report', label: 'Revenue Reports', description: 'Monthly revenue summaries' },
    { type: 'system_maintenance', label: 'System Maintenance', description: 'Scheduled maintenance notifications' },
    { type: 'security_alert', label: 'Security Alerts', description: 'Important security notifications' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Channel Preferences */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Notification Channels</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-xs text-gray-500">Receive notifications via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.email_enabled}
                      onChange={(e) => handleChannelToggle('email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">In-App</p>
                      <p className="text-xs text-gray-500">Show notifications in the dashboard</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.in_app_enabled}
                      onChange={(e) => handleChannelToggle('in_app', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS</p>
                      <p className="text-xs text-gray-500">Receive text messages for urgent notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.sms_enabled}
                      onChange={(e) => handleChannelToggle('sms', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Notification Types</h3>
              <div className="space-y-4">
                {notificationTypes.map(({ type, label, description }) => (
                  <div key={type} className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={localPreferences.preferences[type]?.enabled ?? true}
                        onChange={(e) => handleNotificationTypeToggle(type, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}