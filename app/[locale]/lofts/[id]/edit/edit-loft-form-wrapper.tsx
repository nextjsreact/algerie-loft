"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { LoftForm } from "@/components/forms/loft-form"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"

export function EditLoftFormWrapper({ loft, owners, zoneAreas, internetConnectionTypes }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const tLofts = useTranslations('lofts');
  const tCommon = useTranslations('common');

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/lofts/${loft.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        toast.error(tCommon('error'), {
          description: result.error || tLofts('updateError'),
          duration: 5000,
        })
        return
      }

      toast.success(tLofts('loftUpdated'), {
        description: tLofts('loftUpdatedDescription'),
        duration: 4000,
      })
      
      // Récupérer le paramètre returnPage de l'URL
      const returnPage = searchParams.get('returnPage')
      const redirectUrl = returnPage ? `/${locale}/lofts?page=${returnPage}` : `/${locale}/lofts`
      
      setTimeout(() => {
        router.push(redirectUrl)
      }, 1500)
    } catch (error) {
      console.error('Error updating loft:', error)
      toast.error(tCommon('systemError'), {
        description: error instanceof Error ? error.message : tLofts('systemErrorDescription'),
        duration: 6000,
      })
    }
  }

  return <LoftForm key={loft.id} loft={loft} owners={owners} zoneAreas={zoneAreas} internetConnectionTypes={internetConnectionTypes} onSubmit={handleSubmit} />
}
