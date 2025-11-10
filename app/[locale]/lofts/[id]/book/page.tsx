import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { BookingForm } from "@/components/bookings/booking-form"

export default async function BookLoftPage({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}) {
  const awaitedParams = await params
  const { id, locale } = awaitedParams
  
  // Seuls les clients peuvent réserver
  const session = await requireRole(["client"], locale)
  
  const supabase = await createClient()
  
  // Récupérer les informations du loft
  const { data: loft, error } = await supabase
    .from("lofts")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error || !loft) {
    redirect(`/${locale}/lofts`)
  }
  
  // Vérifier que le loft est disponible
  if (loft.status !== 'available' || !loft.is_published) {
    redirect(`/${locale}/lofts/${id}`)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <BookingForm 
          loft={loft}
          clientId={session.user.id}
          locale={locale}
        />
      </div>
    </div>
  )
}
