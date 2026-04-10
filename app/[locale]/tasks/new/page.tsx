import { getStaffUsers } from '@/app/actions/users'
import NewTaskForm from './new-task-form'

export default async function NewTaskPage() {
  const users = await getStaffUsers()

  return <NewTaskForm users={users} />
}
