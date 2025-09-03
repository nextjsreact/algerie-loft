import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OwnerForm } from "@/components/forms/owner-form"
import { createOwner } from "@/app/actions/owners"
import { getTranslations } from "next-intl/server"

export default async function NewOwnerPage() {
  const t = await getTranslations('owners')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('addOwner')}</h1>
        <p className="text-muted-foreground">{t('createNewOwner')}</p>
      </div>

      <OwnerForm 
        action={async (formData: FormData) => {
          "use server"
          const result = await createOwner(formData)
          if (result?.success) {
            redirect("/owners")
          }
          return result
        }}
      />
    </div>
  )
}
