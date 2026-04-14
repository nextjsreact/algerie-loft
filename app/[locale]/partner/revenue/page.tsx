'use client'
import { use } from 'react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { PartnerRevenueReports } from '@/components/partner/partner-revenue-reports'

export default function PartnerRevenuePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  return (
    <ResponsivePartnerLayout locale={locale}>
      <PartnerRevenueReports locale={locale} />
    </ResponsivePartnerLayout>
  )
}
