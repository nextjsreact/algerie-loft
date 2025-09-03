"use client"

import { useState, useEffect } from "react"
import { getTask, deleteTask } from "@/app/actions/tasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import type { Task, AuthSession } from "@/lib/types"
import { getSession } from "@/lib/auth"
import { DeleteTaskButton } from './delete-button'
import { useTranslations } from 'next-intl';

export default function TaskPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const t = useTranslations();

  const [task, setTask] = useState<Task | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [sessionData, taskData] = await Promise.all([
          getSession(),
          getTask(id),
        ])
        if (!taskData) {
          return notFound()
        }
        setSession(sessionData)
        setTask(taskData)
      } catch (error) {
        console.error("Failed to fetch task data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

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
    return <div>{t('common.loading')}</div>
  }

  if (!task || !session) {
    return notFound()
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'manager' && task.assigned_to !== session.user.id) {
    return notFound();
  }

  const taskStatusTranslationKeys = {
    todo: "tasks.status.todo",
    in_progress: "tasks.status.inProgress",
    completed: "tasks.status.completed",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <CardDescription>
                {task.due_date ? t('tasks:dueDateFormat', { date: new Date(task.due_date).toLocaleDateString() }) : t('tasks.noDueDate')}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(task.status)}>
              {t(taskStatusTranslationKeys[task.status])}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{task.description}</p>
          <div className="mt-6 flex gap-4">
            {session.user.role === "admin" && (
              <DeleteTaskButton taskId={task.id} />
            )}
            <Button asChild variant="outline">
              <Link href={`/tasks/${task.id}/edit`}>
                {session.user.role === "member" ? t('tasks.updateStatus') : t('tasks.editTask')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/tasks">{t('common.back')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}