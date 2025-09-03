import { getUsers } from '@/app/actions/users'
import NewTaskForm from './new-task-form'

export default async function NewTaskPage() {
  const users = await getUsers()

  return <NewTaskForm users={users} />
}
