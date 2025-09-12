'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function NewReservationPage() {
  const t = useTranslations('reservations')
  const searchParams = useSearchParams()
  const loftId = searchParams.get('loftId')

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{t('newReservation')}</h1>
      <p>{t('loft')}: {loftId}</p>
    </div>
  )
}