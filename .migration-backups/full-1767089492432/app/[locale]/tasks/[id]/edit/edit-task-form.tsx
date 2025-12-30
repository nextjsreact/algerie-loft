'use client'

import { TaskForm } from '@/components/forms/task-form'
import { getTask, updateTask } from '@/app/actions/tasks'
import { TaskFormData, TaskStatusUpdateData } from '@/lib/validations'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/use-toast'
import type { Task, User } from '@/lib/types'

interface EditTaskFormProps {
  initialTask: Task | null;
  users: User[];
}

export default function EditTaskForm({ initialTask, users }: EditTaskFormProps) {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations();
  const id = params?.id as string
  const [task, setTask] = useState<Task | null>(initialTask)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // If initialTask is provided, we don't need to fetch it again on the client side
    // This useEffect is primarily for cases where initialTask might be null from the server
    // or to re-fetch if the ID changes for some reason (though not typical for edit pages)
    if (!initialTask && id) {
      getTask(id).then(setTask)
    }
  }, [id, initialTask])

  const handleUpdateTask = async (data: TaskFormData | TaskStatusUpdateData) => {
    console.log("handleUpdateTask called with data:", data);
    if (!id) return
    setIsSubmitting(true)
    try {
      await updateTask(id, data)
      toast({
        title: `✅ ${t('common.success')}`,
        description: `${t('tasks.title')} "${'title' in data ? data.title : task?.title}" ${t('tasks.updateSuccess')}`,
        duration: 3000,
      })
      setTimeout(() => {
        router.push(`/tasks/${id}`)
      }, 1000)
    } catch (error) {
      console.error(error)
      toast({
        title: `❌ ${t('common.error')}`,
        description: t('tasks.updateError'),
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!task) return <div>{t('common.loading')}</div>

  return <TaskForm task={task} users={users} onSubmit={handleUpdateTask} isSubmitting={isSubmitting} />
}
