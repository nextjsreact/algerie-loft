"use client"

import { ClientAuthProvider } from '@/contexts/ClientAuthContext'
import { ReservationEntry } from '@/components/reservations/reservation-entry'
import type { ClientAuthSession } from '@/lib/types/client-auth'

export default function TestClientAuthPage() {
  const handleAuthSuccess = (session: ClientAuthSession) => {
    console.log('Authentication successful:', session.user)
  }

  const handleProceedToReservation = () => {
    console.log('Proceeding to reservation flow...')
    // This would navigate to the actual reservation page
  }

  return (
    <ClientAuthProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Client Authentication Test</h1>
            <p className="text-muted-foreground">
              Test the client authentication flow for the reservation system
            </p>
          </div>
          
          <ReservationEntry
            onAuthSuccess={handleAuthSuccess}
            onProceedToReservation={handleProceedToReservation}
          />
        </div>
      </div>
    </ClientAuthProvider>
  )
}