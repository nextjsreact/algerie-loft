'use client'
import { use } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function PartnerMessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()

  // Redirect to main conversations page
  useEffect(() => {
    router.push(`/${locale}/conversations`)
  }, [locale, router])

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="p-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Redirection vers les conversations...</p>
          </CardContent>
        </Card>
      </div>
    </ResponsivePartnerLayout>
  )
}
