import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OwnerForm } from "@/components/forms/owner-form"
import { createOwner } from "@/app/actions/owners"
import { getTranslations } from "next-intl/server"

export default async function NewOwnerPage() {
  return (
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
  )
}
