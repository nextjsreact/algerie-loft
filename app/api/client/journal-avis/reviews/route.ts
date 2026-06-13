import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { requireRoleAPI, type AuthSession } from "@/lib/auth"

type Customer = {
  id: string
  email: string | null
}

type ReviewPayload = {
  booking_id?: string | null
  loft_id?: string | null
  rating?: number | null
  review_text?: string | null
}

function normalizeReview(row: any, booking: any, loft: any) {
  return {
    id: row.id,
    booking_id: row.booking_id,
    loft_id: row.loft_id,
    client_id: row.client_id,
    rating: row.rating,
    review_text: row.review_text,
    created_at: row.created_at,
    is_published: row.is_published,
    response_text: row.response_text ?? null,
    response_date: row.response_date ?? null,
    loft_name: loft?.name ?? booking?.loft?.name ?? null,
    loft_address: loft?.address ?? booking?.loft?.address ?? null,
    booking_check_in: booking?.check_in ?? null,
    booking_check_out: booking?.check_out ?? null,
  }
}

async function fetchCustomer(supabase: any, session: AuthSession): Promise<Customer | null> {
  const email = session.user.email?.trim().toLowerCase()
  if (!email) return null

  const { data: customerByEmail } = await supabase
    .from("customers")
    .select("id, email")
    .eq("email", email)
    .maybeSingle()

  if (customerByEmail) return customerByEmail

  const { data: customerById } = await supabase
    .from("customers")
    .select("id, email")
    .eq("id", session.user.id)
    .maybeSingle()

  return customerById
}

async function fetchBookingForClient(supabase: any, customerId: string, bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, loft_id, client_id, check_in, check_out, status, payment_status, booking_reference, created_at, loft:loft_id(id, name, address)")
    .eq("id", bookingId)
    .eq("client_id", customerId)
    .single()

  if (error || !data) return null
  return data
}

export async function POST(request: Request) {
  try {
    const session = await requireRoleAPI(["client"])

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = (await request.json()) as ReviewPayload
    const bookingId = typeof body.booking_id === "string" ? body.booking_id : null
    const rating = typeof body.rating === "number" ? body.rating : null
    const reviewText = typeof body.review_text === "string" ? body.review_text.trim() : null

    if (!bookingId) {
      return NextResponse.json({ error: "Séjour obligatoire" }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Note invalide" }, { status: 400 })
    }

    const supabase = await createClient(true)
    const customer = await fetchCustomer(supabase, session)
    const customerId = customer?.id || session.user.id
    const booking = await fetchBookingForClient(supabase, customerId, bookingId)

    if (!booking) {
      return NextResponse.json({ error: "Séjour introuvable" }, { status: 404 })
    }

    // Accepter completed OU confirmed avec check-out dépassé
    const checkOutPast = booking.check_out ? new Date(booking.check_out) < new Date() : false
    const isEligible = booking.status === "completed" || (booking.status === "confirmed" && checkOutPast)

    if (!isEligible) {
      return NextResponse.json({ error: "Seuls les séjours terminés peuvent être évalués" }, { status: 400 })
    }

    const existingReview = await supabase
      .from("loft_reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("client_id", customerId)
      .maybeSingle()

    if (existingReview.error) throw existingReview.error

    if (existingReview.data) {
      return NextResponse.json({ error: "Vous avez déjà évalué ce séjour" }, { status: 409 })
    }

    const { data: insertedReview, error: insertError } = await supabase
      .from("loft_reviews")
      .insert({
        booking_id: bookingId,
        loft_id: booking.loft_id,
        client_id: customerId,
        rating,
        review_text: reviewText || null,
        is_published: true,
      })
      .select("id, booking_id, loft_id, client_id, rating, review_text, created_at, is_published, response_text, response_date")
      .single()

    if (insertError) throw insertError

    return NextResponse.json(normalizeReview(insertedReview, booking, null), { status: 201 })
  } catch (error) {
    console.error("POST /api/client/journal-avis/reviews failed:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
