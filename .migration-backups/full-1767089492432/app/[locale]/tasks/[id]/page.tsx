'use client'

import { useState, useEffect } from "react"
import { getTask } from "@/app/actions/tasks"
import { getNotifications, markNotificationAsReadAndNotifySender } from "@/app/actions/notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditHistory } from "@/components/audit/audit-history"
import { AuditPermissionManager } from "@/lib/permissions/audit-permissions"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import type { Task, AuthSession } from "@/lib/types"
import { getSession } from "@/lib/auth"
import { DeleteTaskButton } from './delete-button'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, MapPin, AlertCircle, ExternalLink, Clock } from "lucide-react"

export default function TaskPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [task, setTask] = useState<(Task & { loft?: { id: string; name: string; address: string } | null; isOrphaned?: boolean; orphanedLoftId?: string }) | null>(null)
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

  // Check if user can view audit history
  const canViewAudit = AuditPermissionManager.canViewEntityAuditHistory(
    session.user.role, 
    'tasks', 
    task.id
  );

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
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Task Details</TabsTrigger>
          {canViewAudit && (
            <TabsTrigger value="audit">Audit History</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
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

          {/* Loft Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {t('associatedLoft')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.loft ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('loftName')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">{task.loft.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {t('loftAddress')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">{task.loft.address}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    {(session.user.role === 'admin' || session.user.role === 'manager') ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/lofts/${task.loft.id}`} className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {t('viewLoftDetails')}
                        </Link>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500 italic">
                          Loft details are restricted for members
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/tasks/${task.id}/history`} className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            View Task History
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : task.isOrphaned ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      {t('loftDeleted')}
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {t('loftDeletedDescription')} (ID: {task.orphanedLoftId})
                    </p>
                    {(session.user.role === 'admin' || session.user.role === 'manager') && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href={`/tasks/${task.id}/edit`}>
                          {t('reassignLoft')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('noLoftAssociated')}
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                      {t('noLoftAssociatedDescription')}
                    </p>
                    {(session.user.role === 'admin' || session.user.role === 'manager') && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href={`/tasks/${task.id}/edit`}>
                          {t('assignLoft')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewAudit && (
          <TabsContent value="audit" className="space-y-4">
            <AuditHistory 
              tableName="tasks" 
              recordId={task.id}
              className="w-full"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}