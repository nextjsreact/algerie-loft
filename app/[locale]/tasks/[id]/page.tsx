'use client'

import { useState, useEffect } from "react"
import { getTask } from "@/app/actions/tasks"
import { getNotifications, markNotificationAsReadAndNotifySender } from "@/app/actions/notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import type { Task, AuthSession } from "@/lib/types"
import { getSession } from "@/lib/auth"
import { DeleteTaskButton } from './delete-button'
import { useLocale, useTranslations } from 'next-intl';

export default function TaskPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [task, setTask] = useState<Task | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData(session: AuthSession) {
      if (!id) return;
      try {
        const [taskData, notificationsData] = await Promise.all([
          getTask(id),
          getNotifications(session.user.id)
        ]);

        if (!taskData) {
          return notFound();
        }
        setTask(taskData);

        if (notificationsData.data) {
          const taskNotification = notificationsData.data.find(
            (n) => n.link === `/tasks/${id}` && !n.is_read
          );

          if (taskNotification) {
            await markNotificationAsReadAndNotifySender(taskNotification.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch task data or handle notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    getSession().then(sessionData => {
      if (sessionData) {
        setSession(sessionData);
        fetchData(sessionData);
      } else {
        setLoading(false);
      }
    });
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div>{tCommon('loading')}</div>
  }

  if (!task || !session) {
    return notFound()
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'manager' && task.assigned_to !== session.user.id) {
    return notFound();
  }

  const taskStatusTranslationKeys: { [key: string]: string } = {
    todo: "status.todo",
    in_progress: "status.inProgress",
    completed: "status.completed",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{t('taskTitle')}: {task.title}</CardTitle>
              <CardDescription>
                {task.due_date ? t('dueDateFormat', { date: new Date(task.due_date).toLocaleDateString(locale) }) : t('noDueDate')}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(task.status)}>
              {t(taskStatusTranslationKeys[task.status] || 'status.unknown')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('taskDescription')}: {task.description}</p>
          <div className="mt-6 flex gap-4">
            {session.user.role === "admin" && (
              <DeleteTaskButton taskId={task.id} />
            )}
            <Button asChild variant="outline">
              <Link href={`/tasks/${task.id}/edit`}>
                {session.user.role === "member" ? t('updateStatus') : t('editTask')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/tasks">{tCommon('back')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}