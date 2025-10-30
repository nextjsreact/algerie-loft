import { ClientAvailabilityCalendarDemo } from '@/components/availability/client-availability-calendar-demo'

export default function TestAvailabilityCalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Client Availability Calendar Test
        </h1>
        <ClientAvailabilityCalendarDemo />
      </div>
    </div>
  )
}