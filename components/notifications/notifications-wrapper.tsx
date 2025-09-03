"use client"

import { useTranslations } from "next-intl"
import NotificationsList from '@/components/notifications/notifications-list'

interface NotificationsWrapperProps {
  notifications: any[]
}

export function NotificationsWrapper({ notifications }: NotificationsWrapperProps) {
  const t = useTranslations("notifications");

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <NotificationsList notifications={notifications} />
    </div>
  )
}