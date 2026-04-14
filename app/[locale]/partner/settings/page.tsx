'use client'
import { use } from 'react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function PartnerSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" />
          Paramètres
        </h1>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Les paramètres du compte partenaire seront disponibles prochainement.</p>
          </CardContent>
        </Card>
      </div>
    </ResponsivePartnerLayout>
  )
}
