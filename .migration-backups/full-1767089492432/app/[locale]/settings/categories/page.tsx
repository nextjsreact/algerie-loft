import { requireRole } from "@/lib/auth"
import { getCategories } from "@/app/actions/categories"
import { CategoriesWrapper } from "@/components/settings/categories-wrapper"
import type { Category } from "@/lib/types"

export default async function CategoriesPage() {
  const session = await requireRole(["admin", "manager"])
  const categories = await getCategories()

  return (
    <CategoriesWrapper categories={categories} />
  )
}
