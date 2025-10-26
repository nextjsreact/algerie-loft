'use client'

import { useRouter } from 'next/navigation'
import { BookingDetail } from '@/components/client/booking-detail'

interface BookingDetailPageProps {
  locale: string
  bookingId: string
}

export function BookingDetailPage({ locale, bookingId }: BookingDetailPageProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(`/${locale}/client/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <BookingDetail
          bookingId={bookingId}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}