'use client'

import { useState } from 'react'
import { LoftSearch } from '@/components/client/loft-search'
import { LoftDetail } from '@/components/client/loft-detail'
import { ClientLoftView } from '@/lib/types'

interface ClientSearchPageProps {
  locale: string
}

export function ClientSearchPage({ locale }: ClientSearchPageProps) {
  const [selectedLoft, setSelectedLoft] = useState<ClientLoftView | null>(null)

  const handleLoftSelect = (loft: ClientLoftView) => {
    setSelectedLoft(loft)
  }

  const handleBack = () => {
    setSelectedLoft(null)
  }

  const handleBookingStart = (loft: ClientLoftView) => {
    // TODO: Navigate to booking flow
    console.log('Start booking for loft:', loft.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {selectedLoft ? (
          <LoftDetail
            loft={selectedLoft}
            onBack={handleBack}
            onBookingStart={handleBookingStart}
          />
        ) : (
          <LoftSearch onLoftSelect={handleLoftSelect} />
        )}
      </div>
    </div>
  )
}