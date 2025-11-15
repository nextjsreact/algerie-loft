import { PartnerRegisterHeader } from '@/components/partner/partner-register-header'

export default async function RejectedLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Unwrap params Promise for Next.js 15
  const { locale } = await params
  
  return (
    <div className="min-h-screen flex flex-col">
      <PartnerRegisterHeader locale={locale} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
