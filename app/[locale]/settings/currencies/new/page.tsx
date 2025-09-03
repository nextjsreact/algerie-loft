import { requireRole } from "@/lib/auth"
import { NewCurrencyForm } from "@/components/settings/new-currency-form"

export default async function NewCurrencyPage() {
  await requireRole(["admin", "manager"])

  return (
    <div className="container mx-auto py-8">
      <NewCurrencyForm />
    </div>
  )
}