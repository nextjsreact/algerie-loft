"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { deleteOwner } from "@/app/actions/owners"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from 'next-intl';

export function DeleteOwnerButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('owners');
  const tCommon = useTranslations('common');

  const handleDelete = async () => {
    if (confirm(t('deleteConfirm'))) {
      try {
        await deleteOwner(id)
        toast({
          title: t('deleteSuccessTitle'),
          description: t('deleteSuccessDescription'),
        })
        router.push("/owners")
      } catch (error) {
        toast({
          title: tCommon('error'),
          description: error instanceof Error ? error.message : t('deleteError'),
          variant: "destructive"
        })
      }
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
    >
      {t('deleteOwner')}
    </Button>
  )
}
