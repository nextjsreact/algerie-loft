import { redirect } from 'next/navigation'
import { requireVerifiedPartner } from '@/lib/partner-auth'

export default async function PartnerPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Ensure user has a verified partner profile
  await requireVerifiedPartner()
  
  // Redirect to dashboard
  redirect(`/${locale}/partner/dashboard`)
}