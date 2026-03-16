'use client'

import { TaskForm } from '@/components/forms/task-form'
import { TaskFormData, TaskStatusUpdateData } from '@/lib/validations'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { useTranslations } from 'next-intl';
import type { User } from '@/lib/types'

interface NewTaskFormProps {
  users: User[]
}

export default function NewTaskForm({ users }: NewTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const t = useTranslations();

  const handleCreateTask = async (data: TaskFormData | TaskStatusUpdateData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur serveur')
      }

      toast({
        title: `✅ ${t('common.success')}`,
        description: `${t('tasks.title')} "${'title' in data ? data.title : 'Task'}" ${t('tasks.createSuccess')}`,
        duration: 3000,
      })
      router.push('/tasks')
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast({
        title: `❌ ${t('common.error')}`,
        description: error.message || t('tasks.createError'),
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return <TaskForm users={users} onSubmit={handleCreateTask} isSubmitting={isSubmitting} />
}
