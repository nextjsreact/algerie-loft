import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { requireRoleAPI, type AuthSession } from "@/lib/auth"
import { type AirbnbNotificationItem } from "@/components/notifications/notifications-wrapper"
import { type Notification, type UserRole } from "@/lib/types"

type Review = {
  id: string
  booking_id: string | null
  loft_id: string
  client_id: string | null
  rating: number | null
  review_text: string | null
  created_at: string
  is_published: boolean
  response_text: string | null
  response_date: string | null
  loft_name: string | null
  loft_address: string | null
  booking_check_in: string | null
  booking_check_out: string | null
}

type Booking = {
  id: string
  loft_id: string | null
  loft_name: string | null
  loft_address: string | null
  check_in: string | null
  check_out: string | null
  guests: number | null
  total_price: number | null
  status: string | null
  payment_status: string | null
  booking_reference: string | null
  created_at: string
}

type JournalAvisPayload = {
  user: {
    id: string
    email: string | null
    full_name: string | null
    role: UserRole
  }
  notifications: Notification[]
  airbnbNotifications: AirbnbNotificationItem[]
  reviews: Review[]
  bookings: Booking[]
}

type ContactAliases = {
  emails: string[]
  phones: string[]
}

const airbnbNotificationTypes = new Set<AirbnbNotificationItem["type"]>(["new", "updated", "cancelled", "conflict", "error"])

function asEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null
}

function normalizeNotification(row: any): Notification {
  return {
    id: row.id,
    title_key: row.title_key ?? null,
    message_key: row.message_key ?? null,
    title: row.title ?? row.title_key ?? "",
    message: row.message ?? row.message_key ?? "",
    title_payload: row.title_payload ?? undefined,
    message_payload: row.message_payload ?? undefined,
    is_read: Boolean(row.is_read),
    read_at: row.read_at ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    user_id: row.user_id,
    link: row.link ?? null,
    sender_id: row.sender_id ?? null,
    type: row.type ?? "info",
    notification_category: row.notification_category ?? "general",
    priority: row.priority ?? "normal",
    booking_id: row.booking_id ?? null,
    metadata: row.metadata ?? undefined,
    sender: row.sender ?? undefined,
  }
}

function normalizeBooking(row: any, lofts: Map<string, any>): Booking {
  const loft = lofts.get(row.loft_id)
  return {
    id: row.id,
    loft_id: row.loft_id ?? null,
    loft_name: loft?.name ?? null,
    loft_address: loft?.address ?? null,
    check_in: row.check_in ?? row.check_in_date ?? null,
    check_out: row.check_out ?? row.check_out_date ?? null,
    guests: row.guests ?? null,
    total_price: typeof row.total_price === "number" ? row.total_price : typeof row.total_amount === "number" ? row.total_amount : null,
    status: row.status ?? null,
    payment_status: row.payment_status ?? null,
    booking_reference: row.booking_reference ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
  }
}

function normalizeReview(row: any, lofts: Map<string, any>, bookings: Map<string, Booking>): Review {
  const loft = lofts.get(row.loft_id)
  const booking = bookings.get(row.booking_id)
  return {
    id: row.id,
    booking_id: row.booking_id ?? null,
    loft_id: row.loft_id,
    client_id: row.client_id ?? null,
    rating: row.rating ?? null,
    review_text: row.review_text ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    is_published: Boolean(row.is_published),
    response_text: row.response_text ?? null,
    response_date: row.response_date ?? null,
    loft_name: loft?.name ?? booking?.loft_name ?? null,
    loft_address: loft?.address ?? booking?.loft_address ?? null,
    booking_check_in: booking?.check_in ?? null,
    booking_check_out: booking?.check_out ?? null,
  }
}

function normalizeAirbnbNotificationType(value: string | null | undefined): AirbnbNotificationItem["type"] {
  if (value && airbnbNotificationTypes.has(value as AirbnbNotificationItem["type"])) {
    return value as AirbnbNotificationItem["type"]
  }
  return "updated"
}

function formatMoney(value: any, currency = "DZD") {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  return `${amount.toLocaleString("fr-DZ")} ${currency}`
}

function shortDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function toAirbnbNotification(row: any, source: string, lofts: Map<string, any>): AirbnbNotificationItem | null {
  const status = String(row.status ?? "").toLowerCase()
  const checkIn = row.check_in_date ?? row.check_in ?? null
  const checkOut = row.check_out_date ?? row.check_out ?? null
  const loft = lofts.get(row.loft_id)
  const pricing = row.pricing && typeof row.pricing === "object" ? row.pricing : {}
  const amount = row.total_amount ?? row.amount ?? pricing.total_amount ?? null
  const currency = row.currency_code ?? row.currency ?? pricing.currency ?? "DZD"
  const guestName = row.guest_name ?? row.metadata?.guest_name ?? "Client"
  const type: AirbnbNotificationItem["type"] = status === "cancelled" ? "cancelled" : status === "confirmed" ? "new" : "updated"
  const parts = [loft?.name || "Loft Airbnb"]
  if (checkIn && checkOut) parts.push(`${shortDate(checkIn)} → ${shortDate(checkOut)}`)
  const money = formatMoney(amount, currency)
  if (money) parts.push(money)

  return {
    id: `${source}-${row.id}`,
    type,
    title: "Réservation Airbnb",
    message: parts.join(" • "),
    is_read: status === "cancelled" || status === "completed" || status === "checked_out",
    created_at: row.created_at ?? row.synced_at ?? new Date().toISOString(),
    metadata: {
      source,
      booking_id: row.id,
      loft_id: row.loft_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      status,
      amount,
      currency,
      guest_name: guestName,
    },
    lofts: loft ? { id: loft.id, name: loft.name } : null,
    reservations: {
      id: row.id,
      guest_name: guestName,
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_amount: amount,
      status,
    },
  }
}

function toAdminAirbnbNotification(row: any, lofts: Map<string, any>): AirbnbNotificationItem | null {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {}
  const reservationId = row.reservation_id ?? metadata.reservation_id ?? metadata.booking_id ?? null
  const loftId = row.loft_id ?? metadata.loft_id ?? null
  const loft = lofts.get(loftId)
  const checkIn = metadata.check_in_date ?? metadata.check_in ?? null
  const checkOut = metadata.check_out_date ?? metadata.check_out ?? null
  const guestName = metadata.guest_name ?? "Client"
  const parts = [loft?.name || "Loft Airbnb"]
  if (checkIn && checkOut) parts.push(`${shortDate(checkIn)} → ${shortDate(checkOut)}`)
  const money = formatMoney(metadata.total_amount, metadata.currency ?? "DZD")
  if (money) parts.push(money)

  return {
    id: `airbnb-notification-${row.id}`,
    type: normalizeAirbnbNotificationType(row.type),
    title: row.title || "Notification Airbnb",
    message: row.message || parts.filter(Boolean).join(" • "),
    is_read: Boolean(row.is_read ?? metadata.is_read),
    created_at: row.created_at ?? new Date().toISOString(),
    metadata: {
      source: "airbnb_notification",
      booking_id: reservationId,
      loft_id: loftId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      status: metadata.status ?? null,
      amount: metadata.total_amount ?? null,
      currency: metadata.currency ?? "DZD",
      guest_name: guestName,
    },
    lofts: loft ? { id: loft.id, name: loft.name } : null,
    reservations: reservationId
      ? {
          id: reservationId,
          guest_name: guestName,
          check_in_date: checkIn,
          check_out_date: checkOut,
          total_amount: metadata.total_amount ?? null,
          status: metadata.status ?? null,
        }
      : null,
  }
}

async function fetchContactAliases(supabase: any, session: AuthSession): Promise<ContactAliases> {
  const emails = new Set<string>()
  const phones = new Set<string>()
  const email = asEmail(session.user.email)
  if (email) emails.add(email)

  try {
    const queries: any[] = []
    queries.push(supabase.from("customers").select("email, phone, auth_user_id").eq("auth_user_id", session.user.id))
    if (email) queries.push(supabase.from("customers").select("email, phone, auth_user_id").eq("email", email))

    const results = await Promise.all(queries)
    for (const { data } of results) {
      for (const customer of data || []) {
        const customerEmail = asEmail(customer.email)
        if (customerEmail) emails.add(customerEmail)
        if (customer.phone) phones.add(customer.phone)
      }
    }
  } catch {
    return {
      emails: Array.from(emails),
      phones: Array.from(phones),
    }
  }

}

async function fetchLoftMap(supabase: any, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const map = new Map<string, any>()
  if (uniqueIds.length === 0) return map

  try {
    const { data } = await supabase
      .from("lofts")
      .select("id, name, address")
      .in("id", uniqueIds)

    for (const loft of data || []) {
      map.set(loft.id, loft)
    }
  } catch {
    return map
  }
}

async function fetchBookings(supabase: any, userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, loft_id, client_id, check_in, check_out, guests, total_price, status, payment_status, booking_reference, created_at")
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error

  const bookings = (data || []).map((booking: any) => normalizeBooking(booking, new Map()))
  const loftMap = await fetchLoftMap(supabase, bookings.map((booking) => booking.loft_id).filter(Boolean) as string[])

  return bookings.map((booking) => normalizeBooking({ ...booking, loft: loftMap.get(booking.loft_id) }, loftMap))
}

async function fetchReviews(supabase: any, userId: string, bookings: Booking[]): Promise<Review[]> {
  const bookingIds = bookings.map((booking) => booking.id)
  let query = supabase
    .from("loft_reviews")
    .select("id, booking_id, loft_id, client_id, rating, review_text, created_at, is_published, response_text, response_date")
    .eq("client_id", userId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(100)

  if (bookingIds.length > 0) {
    query = query.in("booking_id", bookingIds)
  }

  const { data, error } = await query
  if (error) throw error

  const reviews = (data || []).map((review: any) => normalizeReview(review, new Map(), new Map()))
  const loftMap = await fetchLoftMap(supabase, reviews.map((review) => review.loft_id).filter(Boolean) as string[])
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]))

  return reviews.map((review) => normalizeReview({ ...review, loft: loftMap.get(review.loft_id), booking: bookingMap.get(review.booking_id || "") }, loftMap, bookingMap))
}

async function fetchAirbnbBookingsByAliases(supabase: any, aliases: ContactAliases) {
  const rowsById = new Map<string, any>()

  for (const email of aliases.emails) {
    try {
      const { data } = await supabase
        .from("airbnb_bookings")
        .select("id, loft_id, external_id, guest_email, guest_name, guest_phone, status, check_in_date, check_out_date, amount, currency, created_at, synced_at, raw_data")
        .eq("guest_email", email)
        .order("created_at", { ascending: false })
        .limit(25)
      for (const row of data || []) rowsById.set(row.id, row)
    } catch {
      continue
    }
  }

  for (const phone of aliases.phones) {
    try {
      const { data } = await supabase
        .from("airbnb_bookings")
        .select("id, loft_id, external_id, guest_email, guest_name, guest_phone, status, check_in_date, check_out_date, amount, currency, created_at, synced_at, raw_data")
        .eq("guest_phone", phone)
        .order("created_at", { ascending: false })
        .limit(25)
      for (const row of data || []) rowsById.set(row.id, row)
    } catch {
      continue
    }
  }

  return Array.from(rowsById.values())
}

async function fetchReservationsByAliases(supabase: any, aliases: ContactAliases) {
  const rowsById = new Map<string, any>()

  for (const email of aliases.emails) {
    try {
      const { data } = await supabase
        .from("reservations")
        .select("id, loft_id, guest_email, guest_name, guest_phone, status, source, airbnb_confirmation_code, check_in_date, check_out_date, created_at, total_amount, currency_code, pricing")
        .eq("guest_email", email)
        .order("created_at", { ascending: false })
        .limit(25)
      for (const row of data || []) {
        const source = String(row.source || "").toLowerCase()
        if (source.includes("airbnb") || row.airbnb_confirmation_code) rowsById.set(row.id, row)
      }
    } catch {
      continue
    }
  }

  for (const phone of aliases.phones) {
    try {
      const { data } = await supabase
        .from("reservations")
        .select("id, loft_id, guest_email, guest_name, guest_phone, status, source, airbnb_confirmation_code, check_in_date, check_out_date, created_at, total_amount, currency_code, pricing")
        .eq("guest_phone", phone)
        .order("created_at", { ascending: false })
        .limit(25)
      for (const row of data || []) {
        const source = String(row.source || "").toLowerCase()
        if (source.includes("airbnb") || row.airbnb_confirmation_code) rowsById.set(row.id, row)
      }
    } catch {
      continue
    }
  }

  return Array.from(rowsById.values())
}

async function fetchAdminAirbnbNotifications(supabase: any, reservationIds: string[]) {
  if (reservationIds.length === 0) return []

  try {
    const { data } = await supabase
      .from("airbnb_notifications")
      .select("id, reservation_id, loft_id, type, title, message, metadata, is_read, read_at, created_at")
      .in("reservation_id", reservationIds)
      .order("created_at", { ascending: false })
      .limit(25)
    return data || []
  } catch {
    return []
  }
}

async function fetchAirbnbNotifications(supabase: any, aliases: ContactAliases) {
  const [airbnbBookings, reservations] = await Promise.all([
    fetchAirbnbBookingsByAliases(supabase, aliases),
    fetchReservationsByAliases(supabase, aliases),
  ])

  const reservationIds = reservations.map((reservation: any) => reservation.id)
  const loadedAdminNotifications = await fetchAdminAirbnbNotifications(supabase, reservationIds)
  const rows = [
    ...airbnbBookings.map((row: any) => ({ ...row, __source: "airbnb_booking" })),
    ...reservations.map((row: any) => ({ ...row, __source: "reservation" })),
    ...loadedAdminNotifications.map((row: any) => ({ ...row, __source: "airbnb_notification" })),
  ]

  const loftMap = await fetchLoftMap(
    supabase,
    rows.map((row: any) => row.loft_id || row.metadata?.loft_id).filter(Boolean)
  )

  const items = rows
    .map((row: any) => {
      if (row.__source === "airbnb_notification") return toAdminAirbnbNotification(row, loftMap)
      return toAirbnbNotification(row, row.__source, loftMap)
    })
    .filter(Boolean) as AirbnbNotificationItem[]

  const seen = new Set<string>()
  return items
    .filter((item) => {
      const key = `${item.metadata?.source || "airbnb"}:${item.metadata?.booking_id || item.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  try {
    const session = await requireRoleAPI(["client"])

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const supabase = await createClient(true)

    const { data: notificationsData, error: notificationsError } = await supabase
      .from("notifications")
      .select("*, sender:sender_id(id, full_name, email, avatar_url)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100)

    if (notificationsError) throw notificationsError

    const [bookings, aliases] = await Promise.all([
      fetchBookings(supabase, session.user.id),
      fetchContactAliases(supabase, session),
    ])

    const reviews = await fetchReviews(supabase, session.user.id, bookings)
    const airbnbNotifications = await fetchAirbnbNotifications(supabase, aliases)

    const payload: JournalAvisPayload = {
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        role: session.user.role,
      },
      notifications: (notificationsData || []).map(normalizeNotification),
      airbnbNotifications,
      reviews,
      bookings,
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("GET /api/client/journal-avis failed:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
