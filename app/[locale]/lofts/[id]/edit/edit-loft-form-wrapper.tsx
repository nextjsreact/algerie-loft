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
    console.log('=== LOFT UPDATE START ===')
    console.log('Loft ID:', loft.id)
    console.log('Data to update:', data)
    
    try {
      console.log('Calling updateLoft...')
      const result = await updateLoft(loft.id, data)
      console.log('Update result:', result)
      
      if (result?.success) {
        console.log('Update successful!')
        toast.success(tLofts('loftUpdated'), {
          description: tLofts('loftUpdatedDescription'),
          duration: 4000,
        })
        setTimeout(() => {
          router.push("/lofts")
        }, 1500)
      } else {
        console.error('Update failed:', result?.error)
        toast.error(tCommon('error'), {
          description: result?.error || tLofts('updateError'),
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('=== LOFT UPDATE ERROR ===')
      console.error('Error updating loft:', error)
      toast.error(tCommon('systemError'), {
        description: error instanceof Error ? error.message : tLofts('systemErrorDescription'),
        duration: 6000,
      })
    }
  }

  return <LoftForm key={loft.id} loft={loft} owners={owners} zoneAreas={zoneAreas} internetConnectionTypes={internetConnectionTypes} onSubmit={handleSubmit} />
}
