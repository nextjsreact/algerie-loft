import { requireRole } from "@/lib/auth"
import { getTasks } from "@/app/actions/tasks"
import { getUsers } from "@/app/actions/users"
import { ModernTasksPage } from "@/components/tasks/modern-tasks-page"

export default async function TasksPage() {
  try {
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
  } catch (error) {
    console.error("Error loading tasks page:", error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-gray-600">
            Une erreur s'est produite lors du chargement des tâches.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez rafraîchir la page ou contacter l'administrateur.
          </p>
        </div>
      </div>
    )
  }
}
