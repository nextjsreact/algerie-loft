import { requireRole } from "@/lib/auth"
import { getTasks } from "@/app/actions/tasks"
import { getUsers } from "@/app/actions/users"
import { ModernTasksPage } from "@/components/tasks/modern-tasks-page"

export default async function TasksPage() {
  const session = await requireRole(["admin", "manager", "member"])
  const tasks = await getTasks()
  const users = await getUsers()

  return (
    <ModernTasksPage 
      tasks={tasks}
      users={users}
      userRole={session.user.role}
      currentUserId={session.user.id}
    />
  )
}
