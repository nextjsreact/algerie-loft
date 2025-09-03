"use client"

import { Button } from "@/components/ui/button"
import { deleteTask } from "@/app/actions/tasks"

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const handleDelete = async () => {
    await deleteTask(taskId)
  }

  return (
    <form action={handleDelete}>
      <Button variant="destructive" type="submit">
        Delete
      </Button>
    </form>
  )
}
