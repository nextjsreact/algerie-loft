// Extended notification types for the multi-role booking system

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  booking_confirmations: boolean;
  booking_reminders: boolean;
  payment_notifications: boolean;
  message_notifications: boolean;
  marketing_notifications: boolean;
  system_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject_template: string;
  body_template: string;
  template_type: 'booking' | 'payment' | 'reminder' | 'system';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  notification_id?: string;
  user_id: string;
  delivery_method: 'in_app' | 'email' | 'sms' | 'push';
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  delivery_attempt: number;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface ExtendedNotification {
  id: string;
  user_id: string;
  booking_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  notification_category: 'general' | 'booking' | 'payment' | 'message' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  link?: string;
  sender_id?: string;
  is_read: boolean;
  read_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface ExtendedBookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  message_type: 'text' | 'system' | 'attachment';
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// Notification service types
export interface CreateNotificationData {
  user_id: string;
  booking_id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  notification_category?: 'general' | 'booking' | 'payment' | 'message' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  link?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageData {
  booking_id: string;
  message: string;
  message_type?: 'text' | 'attachment';
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
}

export interface NotificationFilters {
  category?: string;
  unread_only?: boolean;
  booking_id?: string;
  page?: number;
  limit?: number;
}

export interface EmailNotificationData {
  to: string;
  template_key: string;
  variables: Record<string, any>;
  booking_id?: string;
  user_id?: string;
}