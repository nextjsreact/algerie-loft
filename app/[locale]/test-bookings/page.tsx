import { createClient } from "@/utils/supabase/server"

export default async function TestBookingsPage() {
  const supabase = await createClient(true)

  // Test 1: Compter les bookings
  const { count: bookingsCount, error: bookingsCountError } = await supabase
    .from("bookings")
    .select("*", { count: 'exact', head: true })

  // Test 2: Récupérer tous les bookings
  const { data: allBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Bookings Database</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Test 1: Count Bookings</h2>
          {bookingsCountError ? (
            <pre className="text-red-600">{JSON.stringify(bookingsCountError, null, 2)}</pre>
          ) : (
            <p className="text-2xl font-bold text-green-600">Total bookings: {bookingsCount}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Test 2: All Bookings (limit 10)</h2>
          {bookingsError ? (
            <pre className="text-red-600">{JSON.stringify(bookingsError, null, 2)}</pre>
          ) : (
            <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(allBookings, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
