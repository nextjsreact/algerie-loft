'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientDashboard } from '@/components/client/client-dashboard'

interface ClientDashboardPageProps {
  locale: string
}

export function ClientDashboardPage({ locale }: ClientDashboardPageProps) {
  const router = useRouter()

  const handleSearchLofts = () => {
    router.push(`/${locale}/client/search`)
  }

  const handleViewBooking = (bookingId: string) => {
    router.push(`/${locale}/client/bookings/${bookingId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ClientDashboard
          onSearchLofts={handleSearchLofts}
          onViewBooking={handleViewBooking}
        />
      </div>
    </div>
  )
}