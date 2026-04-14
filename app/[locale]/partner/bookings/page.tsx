'use client'
import { use } from 'react'
import { useTranslations } from 'next-intl'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { PartnerReservationsView } from '@/components/partner/partner-reservations-view'

export default function PartnerBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  return (
    <ResponsivePartnerLayout locale={locale}>
      <PartnerReservationsView locale={locale} />
    </ResponsivePartnerLayout>
  )
}
