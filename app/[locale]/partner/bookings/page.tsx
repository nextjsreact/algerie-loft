import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { PartnerReservationsView } from '@/components/partner/partner-reservations-view'
import { getPartnerInfo } from '@/lib/partner-auth'
import { redirect } from 'next/navigation'

export default async function PartnerBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const partnerInfo = await getPartnerInfo()

  if (!partnerInfo) {
    redirect(`/${locale}/login`)
  }

  return (
    <ResponsivePartnerLayout locale={locale}>
      <PartnerReservationsView locale={locale} partnerId={partnerInfo.ownerId} />
    </ResponsivePartnerLayout>
  )
}
