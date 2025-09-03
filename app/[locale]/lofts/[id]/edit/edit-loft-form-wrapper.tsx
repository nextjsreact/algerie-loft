"use client"

import { useRouter } from "next/navigation"
import { LoftForm } from "@/components/forms/loft-form"
import { updateLoft } from "@/app/actions/lofts"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export function EditLoftFormWrapper({ loft, owners, zoneAreas, internetConnectionTypes }: any) {
  const router = useRouter()
  const tLofts = useTranslations('lofts');
  const tCommon = useTranslations('common');

  const handleSubmit = async (data: any) => {
    try {
      const result = await updateLoft(loft.id, data)
      if (result?.success) {
        toast.success(tLofts('loftUpdated'), {
          description: tLofts('loftUpdatedDescription'),
          duration: 4000,
        })
        setTimeout(() => {
          router.push("/lofts")
        }, 1500)
      } else {
        toast.error(tCommon('error'), {
          description: tLofts('updateError'),
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error updating loft:', error)
      toast.error(tCommon('systemError'), {
        description: tLofts('systemErrorDescription'),
        duration: 6000,
      })
    }
  }

  return <LoftForm key={loft.id} loft={loft} owners={owners} zoneAreas={zoneAreas} internetConnectionTypes={internetConnectionTypes} onSubmit={handleSubmit} />
}
