"use server";

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { Database, Notification } from '@/lib/types';

export async function createNotification(
  userId: string,
  title_key: string,
  message_key: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  link?: string,
  sender_id?: string | null,
  title_payload?: Record<string, any>,
  message_payload?: Record<string, any>,
  supabaseClient?: SupabaseClient<Database>
) {
  // Always use service role for creating notifications to bypass RLS
  const supabase = supabaseClient || await createClient(true);
  
  console.log('Creating notification with service role:', {
    userId,
    title_key,
    type,
    sender_id
  });
  
  // Check if the notifications table has the 'type' column
  // If not, use basic structure for backward compatibility
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title_key,
      message_key,
      type,
      link,
      sender_id,
      title_payload,
      message_payload,
      is_read: false,
      created_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
  
  console.log('Notification created successfully:', data);
  return data;
}

export async function getUnreadNotificationsCount(
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<{ count: number | null; error: any }> {
  const supabase = supabaseClient || await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread notifications count:', error);
    return { count: null, error };
  }

  return { count, error: null };
}

export async function getNotifications(
  userId: string,
  supabaseClient?: SupabaseClient<Database> // Optional Supabase client
): Promise<{ data: Notification[] | null; error: any }> {
  const supabase = supabaseClient || await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function markNotificationAsRead(
  notificationId: string,
  supabaseClient?: SupabaseClient<Database> // Optional Supabase client
): Promise<{ data: Notification[] | null; error: any }> {
  const supabase = supabaseClient || await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();

  if (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function markNotificationAsReadAndNotifySender(
  notificationId: string
) {
  const supabase = await createClient(true);
  
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('id, title_key, message_key, title_payload, message_payload, is_read, created_at, user_id, link, sender_id, type')
    .eq('id', notificationId)
    .single();

  if (fetchError || !notification) {
    console.error('Error fetching notification:', fetchError);
    throw fetchError;
  }

  const { data: updatedNotification, error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();

  if (updateError) {
    console.error('Error marking notification as read:', updateError);
    throw updateError;
  }

  if (notification.sender_id && notification.title_key !== "Notification Read") {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', notification.user_id)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
    }

    let taskTitle = '';
    if (notification.link) {
      const taskId = notification.link.split('/').pop();
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', taskId)
        .single();
      if (task) {
        taskTitle = task.title;
      }
    }

    await createNotification(
      notification.sender_id,
      "Notification Read", // This is the title_key, which is fine
      "notificationReadMessage", // New message_key for translation
      'info',
      undefined,
      notification.user_id,
      undefined, // title_payload
      { taskTitle: taskTitle, userName: user?.full_name || 'unknownUser' }, // message_payload
      supabase
    );
  }

  return updatedNotification;
}
