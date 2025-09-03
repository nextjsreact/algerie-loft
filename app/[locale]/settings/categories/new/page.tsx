import { requireRole } from "@/lib/auth"
import { NewCategoryForm } from "@/components/settings/new-category-form"

export default async function NewCategoryPage() {
  await requireRole(["admin", "manager"])

  return (
    <div className="container mx-auto py-8">
      <NewCategoryForm />
    </div>
  )
}