"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from 'next-intl';

export function DeleteButton({ 
  id,
  onDelete,
  loftName
}: {
  id: string
  onDelete: (id: string) => Promise<void>
  loftName?: string
}) {
  const router = useRouter()
  const t = useTranslations();

  const handleClick = async () => {
    if (confirm(t('deleteConfirm', { loftName: loftName || '' }))) {
      const confirmation = prompt(t('deleteConfirmationPrompt'))
      
      if (confirmation === t('deleteConfirmationKeyword')) {
        try {
          toast.loading(t('deletingInProgress'), {
            description: t('deletingDescription'),
            duration: 2000,
          })
          
          await onDelete(id)
          
          toast.success(t('deleteSuccess', { loftName: loftName || '' }), {
            description: t('deleteSuccessDescription'),
            duration: 4000,
          })
          
          setTimeout(() => {
            router.push("/lofts")
          }, 1500)
        } catch (error) {
          console.error("Delete failed:", error)
          toast.error(t('deleteError'), {
            description: t('deleteErrorDescription'),
            duration: 6000,
          })
        }
      } else if (confirmation !== null) {
        toast.warning(t('deleteCancelled'), {
          description: t('deleteCancelledDescription'),
          duration: 3000,
        })
      }
    }
  }

  return (
    <Button 
      variant="destructive"
      onClick={handleClick}
      className="bg-red-600 hover:bg-red-700 text-white font-medium"
    >
      {t('deleteLoft')}
    </Button>
  )
}
