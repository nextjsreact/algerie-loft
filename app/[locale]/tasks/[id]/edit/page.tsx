import { getTask, updateTask } from '@/app/actions/tasks'
import { getUsers } from '@/app/actions/users'
import EditTaskForm from './edit-task-form'
import { notFound } from 'next/navigation'
import { getSession } from "@/lib/auth" // Import getSession

interface EditTaskPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const task = await getTask(id)
  const users = await getUsers()
  const session = await getSession(); // Fetch session

  if (!task) {
    notFound()
  }

  if (!session) { // Redirect if no session
    notFound();
  }

  // Ensure only authorized users can edit
  if (session.user.role !== 'admin' && session.user.role !== 'manager' && task.assigned_to !== session.user.id) {
    notFound();
  }

  return <EditTaskForm initialTask={task} users={users} />
}
