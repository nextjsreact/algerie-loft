'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, taskStatusUpdateSchema, TaskFormData, TaskStatusUpdateData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FormWrapper, FormSection } from '@/components/ui/form-wrapper'
import { useRouter } from 'next/navigation'
import type { Task, User, AuthSession } from '@/lib/types'
import { getSession } from '@/lib/auth'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface TaskFormProps {
  task?: Task
  users: User[]
  onSubmit: (data: TaskFormData | TaskStatusUpdateData) => Promise<void>
  isSubmitting?: boolean
}

export function TaskForm({ task, users, onSubmit, isSubmitting = false }: TaskFormProps) {
  const router = useRouter()
  const [session, setSession] = useState<AuthSession | null>(null)
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  useEffect(() => {
    async function fetchSession() {
      const sessionData = await getSession();
      setSession(sessionData);
    }
    fetchSession();
  }, []);

  // Use different validation schema based on user role
  const isMember = session?.user?.role === 'member'
  const validationSchema = isMember ? taskStatusUpdateSchema : taskSchema
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<TaskFormData | TaskStatusUpdateData>({
    resolver: zodResolver(validationSchema),
    defaultValues: task ? (
      isMember ? {
        status: task.status
      } : {
        ...task,
        description: task.description ?? undefined, // Convert null to undefined
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
        assigned_to: task.assigned_to ?? 'unassigned', // Convert null to 'unassigned'
      }
    ) : { status: 'todo', due_date: new Date().toISOString().split('T')[0] },
  })

  return (
    <FormWrapper 
      maxWidth="2xl"
      title={task ? (session?.user?.role === 'member' ? t('form.updateTaskStatus') : t('form.editTask')) : t('form.addNewTask')}
      description={task ? 
        (session?.user?.role === 'member' ? t('form.updateStatusDescription') : t('form.updateTaskInfo')) : 
        t('form.createNewTask')
      }
      icon="📋"
    >
      <FormSection 
        title={t('taskDetails')}
        description={session?.user?.role === 'member' ? t('memberCanOnlyUpdateStatus') : t('fillTaskInformation')}
        icon="✅"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Only show title and description fields for admins and managers */}
          {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">{t('taskTitle')}</Label>
                <Input 
                  id="title" 
                  {...register('title')}
                  className="bg-white"
                />
                {(errors as any).title && <p className="text-sm text-red-500">{(errors as any).title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('taskDescription')}</Label>
                <Textarea 
                  id="description" 
                  {...register('description')}
                  className="bg-white"
                />
                {(errors as any).description && <p className="text-sm text-red-500">{(errors as any).description.message}</p>}
              </div>
            </>
          )}

          {/* Show read-only title and description for members */}
          {session?.user?.role === 'member' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">{t('taskTitle')}</Label>
                <Input id="title" value={task?.title || ''} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('taskDescription')}</Label>
                <Textarea id="description" value={task?.description || ''} disabled className="bg-muted" />
              </div>
            </>
          )}

          {/* Status field - editable for all roles */}
          <div className="space-y-2">
            <Label htmlFor="status">{t('taskStatus')}</Label>
            <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={task?.status}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={tCommon('selectOption')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">{t('status.todo')}</SelectItem>
                <SelectItem value="in_progress">{t('status.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('status.completed')}</SelectItem>
              </SelectContent>
            </Select>
            {(errors as any).status && <p className="text-sm text-red-500">{(errors as any).status.message}</p>}
          </div>

          {/* Due date and assignment - only for admins and managers */}
          {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="due_date">{t('taskDueDate')}</Label>
                <Input 
                  id="due_date" 
                  type="date" 
                  {...register('due_date')}
                  placeholder="jj/mm/aaaa"
                  className="bg-white"
                />
                {(errors as any).due_date && <p className="text-sm text-red-500">{(errors as any).due_date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">{t('assignTo')}</Label>
                <Select onValueChange={(value) => setValue('assigned_to', value === 'unassigned' ? null : value)} defaultValue={task?.assigned_to || 'unassigned'}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={tCommon('selectOption')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{tCommon('none')}</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(errors as any).assigned_to && <p className="text-sm text-red-500">{(errors as any).assigned_to.message}</p>}
              </div>
            </>
          )}

          {/* Read-only due date and assignment for members */}
          {session?.user?.role === 'member' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="due_date_readonly">{t('taskDueDate')}</Label>
                <Input 
                  id="due_date_readonly" 
                  value={task?.due_date ? new Date(task.due_date).toLocaleDateString() : t('noDueDate')} 
                  disabled 
                  className="bg-muted" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to_readonly">{t('assignedTo')}</Label>
                <Input 
                  id="assigned_to_readonly" 
                  value={task?.assigned_to ? users.find(u => u.id === task.assigned_to)?.full_name || 'Unknown User' : tCommon('none')} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : 
               task ? (session?.user?.role === 'member' ? t('updateStatus') : t('updateTask')) : 
               t('createTask')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/tasks')}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </FormSection>
    </FormWrapper>
  )
}
