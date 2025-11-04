import { requireRole } from "@/lib/auth"
import { EmployeeManagement } from "@/components/admin/employee-management"

export default async function EmployeesManagementPage() {
  const session = await requireRole(["admin"])

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Employés
          </h1>
          <p className="text-gray-600">
            Gérer les comptes et mots de passe des employés
          </p>
        </div>
        
        <EmployeeManagement session={session} />
      </div>
    </div>
  )
}