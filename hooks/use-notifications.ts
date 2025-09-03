'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type Notification } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function useNotifications(initialSession: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!initialSession) {
      router.push('/login');
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as Notification;

          if (newNotification.user_id === initialSession.user.id) {
            setNotifications((prev) => [newNotification, ...prev]);
            
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.error("Error playing sound:", e));

            toast({
              title: newNotification.title,
              description: newNotification.message,
            });

            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialSession, toast, router]);

  return { notifications, setNotifications };
}
