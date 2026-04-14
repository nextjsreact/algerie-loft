'use client'
import { use } from 'react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function PartnerAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Analytiques
        </h1>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Les analytiques avancées seront disponibles prochainement.</p>
          </CardContent>
        </Card>
      </div>
    </ResponsivePartnerLayout>
  )
}
