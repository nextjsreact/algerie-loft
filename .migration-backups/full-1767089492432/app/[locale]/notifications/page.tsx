import React from 'react';
import { getNotifications } from '@/app/actions/notifications';
import { getSession } from '@/lib/auth';
import { NotificationsWrapper } from '@/components/notifications/notifications-wrapper';
import { redirect } from 'next/navigation';

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: initialNotifications } = await getNotifications(session.user.id);

  return (
    <NotificationsWrapper notifications={initialNotifications || []} />
  );
}
