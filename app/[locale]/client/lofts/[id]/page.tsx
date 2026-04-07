'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LoftDetailPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export default function LoftDetailPage({ params }: LoftDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main reservations page with loft pre-selected
    const locale = resolvedParams.locale || 'fr'
    router.replace(`/${locale}/reservations?loftId=${resolvedParams.id}&action=new`)
  }, [resolvedParams.id, resolvedParams.locale, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-gray-500">Redirection vers le formulaire de réservation...</p>
      </div>
    </div>
  )
}
