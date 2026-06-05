'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReservationEditDialog } from '@/components/reservations/reservation-edit-dialog'
import { useTranslations } from 'next-intl'

interface ReservationEditButtonProps {
  reservation: any
  availableLofts?: Array<{ id: string; name: string; address?: string }>
}

export function ReservationEditButton({ reservation, availableLofts = [] }: ReservationEditButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations('reservations.details')

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Edit className="h-4 w-4 mr-2" />
        {t('editReservation')}
      </Button>
      <ReservationEditDialog
        reservation={reservation}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
        availableLofts={availableLofts}
      />
    </>
  )
}
