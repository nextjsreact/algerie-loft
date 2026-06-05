'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'new' | 'updated' | 'cancelled' | 'conflict' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: {
    guest_name?: string;
    check_in?: string;
    check_out?: string;
    total_price?: number;
    loft_name?: string;
  };
  reservations?: {
    id: string;
    guest_name: string;
  };
  lofts?: {
    id: string;
    name: string;
  };
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export function AirbnbNotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/airbnb/notifications?unread=true&limit=20');
      
      if (!res.ok) {
        console.error('Erreur lors de la récupération des notifications');
        return;
      }

      const data: NotificationsResponse = await res.json();
      
      // Si nouvelle notification, afficher un toast
      if (data.notifications.length > 0 && data.notifications[0].id !== lastNotificationId) {
        const latestNotif = data.notifications[0];
        
        // Ne pas afficher de toast au premier chargement
        if (lastNotificationId !== null) {
          toast.success(latestNotif.title, {
            description: latestNotif.message,
            duration: 5000,
            action: {
              label: 'Voir',
              onClick: () => {
                setIsOpen(true);
              }
            }
          });
        }
        
        setLastNotificationId(latestNotif.id);
      }
      
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  }, [lastNotificationId]);

  // Polling toutes les 30 secondes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/airbnb/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (res.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/airbnb/notifications/read-all', {
        method: 'POST'
      });

      if (res.ok) {
        await fetchNotifications();
        toast.success('Toutes les notifications ont été marquées comme lues');
      } else {
        toast.error('Erreur lors du marquage des notifications');
      }
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      toast.error('Erreur lors du marquage des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Formater le temps écoulé
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  // Obtenir la couleur selon le type
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'new':
        return 'bg-green-50 border-green-200';
      case 'updated':
        return 'bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'conflict':
        return 'bg-orange-50 border-orange-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-accent"
          title="Notifications Airbnb"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div>
            <h3 className="font-semibold text-base">Notifications Airbnb</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unreadCount > 0 
                ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} notification${unreadCount > 1 ? 's' : ''}`
                : 'Aucune nouvelle notification'
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer
            </Button>
          )}
        </div>

        {/* Liste des notifications */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune nouvelle notification
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les nouvelles réservations Airbnb apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors border-l-4 ${getTypeColor(notif.type)}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight mb-1">
                        {notif.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-snug mb-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                        {!notif.is_read && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/50">
          <Button 
            variant="ghost" 
            className="w-full justify-between text-sm"
            onClick={() => {
              setIsOpen(false);
              router.push('/admin/airbnb/notifications');
            }}
          >
            Voir toutes les notifications
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
