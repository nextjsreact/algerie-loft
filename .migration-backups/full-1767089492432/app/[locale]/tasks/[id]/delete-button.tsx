"use client"

import { Button } from "@/components/ui/button"
import { deleteTask } from "@/app/actions/tasks"
import { useTranslations } from 'next-intl'

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const tCommon = useTranslations('common')

  const handleDelete = async () => {
    await deleteTask(taskId)
  }

  return (
    <form action={handleDelete}>
      <Button variant="destructive" type="submit">
        {tCommon('delete')}
      </Button>
    </form>
  )
}
