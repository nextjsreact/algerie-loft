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
    queries.push(supabase.from("profiles").select("email").eq("id", session.user.id))
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

const mockJournalAvisEmails = new Set([
  "habib.belkacemi@loftalgerie.com",
  ...(process.env.MOCK_CLIENT_JOURNAL_AVIS_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
])

function shouldUseJournalAvisMocks(session: AuthSession, aliases: ContactAliases) {
  const candidateEmails = [session.user.email, ...aliases.emails]
    .map(asEmail)
    .filter((email): email is string => Boolean(email))
  return candidateEmails.some((email) => mockJournalAvisEmails.has(email))
}

function isoFromToday(daysFromToday: number, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

function applyJournalAvisMocks(payload: JournalAvisPayload): JournalAvisPayload {
  const userId = payload.user.id
  const mockLofts = {
    oran: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Loft Prestige Oran",
      address: "Front de mer, Oran",
    },
    alger: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Loft Hydra Alger",
      address: "Hydra, Alger",
    },
    airbnb: {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Loft Airbnb Sidi Bel Abbès",
      address: "Sidi Bel Abbès",
    },
  }

  const mockBookings: Booking[] = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      loft_id: mockLofts.oran.id,
      loft_name: mockLofts.oran.name,
      loft_address: mockLofts.oran.address,
      check_in: isoFromToday(35, 15),
      check_out: isoFromToday(38, 11),
      guests: 4,
      total_price: 84000,
      status: "confirmed",
      payment_status: "paid",
      booking_reference: "BK-MOCK-ORAN-001",
      created_at: isoFromToday(-12, 9),
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      loft_id: mockLofts.alger.id,
      loft_name: mockLofts.alger.name,
      loft_address: mockLofts.alger.address,
      check_in: isoFromToday(-34, 15),
      check_out: isoFromToday(-31, 11),
      guests: 2,
      total_price: 62000,
      status: "completed",
      payment_status: "paid",
      booking_reference: "BK-MOCK-ALGER-001",
      created_at: isoFromToday(-45, 14),
    },
  ]

  const mockReviews: Review[] = [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      booking_id: mockBookings[1].id,
      loft_id: mockLofts.alger.id,
      client_id: userId,
      rating: 5,
      review_text: "Séjour excellent. L’appartement était propre, bien situé et l’équipe a été très réactive.",
      created_at: isoFromToday(-28, 18),
      is_published: true,
      response_text: "Merci Habib pour votre retour. Ravi que votre séjour à Alger se soit bien passé.",
      response_date: isoFromToday(-27, 9),
      loft_name: mockLofts.alger.name,
      loft_address: mockLofts.alger.address,
      booking_check_in: mockBookings[1].check_in,
      booking_check_out: mockBookings[1].check_out,
    },
  ]

  const mockNotifications: Notification[] = [
    {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      user_id: userId,
      title: "Réservation confirmée",
      message: `Votre séjour au ${mockLofts.oran.name} du 18 juillet au 21 juillet a été confirmé.`,
      is_read: false,
      read_at: null,
      created_at: isoFromToday(-2, 10),
      type: "success",
      notification_category: "booking",
      priority: "high",
      booking_id: mockBookings[0].id,
      link: `/fr/client/bookings/${mockBookings[0].id}`,
    },
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      user_id: userId,
      title: "Paiement reçu",
      message: `Nous avons bien reçu le paiement de votre réservation ${mockBookings[0].booking_reference}.`,
      is_read: true,
      read_at: isoFromToday(-1, 11),
      created_at: isoFromToday(-3, 16),
      type: "success",
      notification_category: "payment",
      priority: "normal",
      booking_id: mockBookings[0].id,
      link: `/fr/client/bookings/${mockBookings[0].id}`,
    },
    {
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      user_id: userId,
      title: "Réponse à votre avis",
      message: "L’équipe Loft Algérie a répondu à votre appréciation concernant Loft Hydra Alger.",
      is_read: false,
      read_at: null,
      created_at: isoFromToday(-27, 9),
      type: "info",
      notification_category: "review",
      priority: "normal",
      booking_id: mockBookings[1].id,
      link: "/fr/client/journal-avis",
    },
  ]

  const mockAirbnbNotifications: AirbnbNotificationItem[] = [
    {
      id: "airbnb-mock-001",
      type: "new",
      title: "Réservation Airbnb",
      message: `${mockLofts.airbnb.name} • 12 août 2026 → 15 août 2026 • 72 000 DZD`,
      is_read: false,
      created_at: isoFromToday(-1, 8),
      metadata: {
        source: "mock_airbnb_reservation",
        booking_id: "airbnb-mock-001",
        loft_id: mockLofts.airbnb.id,
        check_in_date: isoFromToday(60, 15),
        check_out_date: isoFromToday(63, 11),
        status: "confirmed",
        amount: 72000,
        currency: "DZD",
        guest_name: "Habib Belkacemi",
      },
      lofts: { id: mockLofts.airbnb.id, name: mockLofts.airbnb.name },
      reservations: {
        id: "airbnb-mock-001",
        guest_name: "Habib Belkacemi",
        check_in_date: isoFromToday(60, 15),
        check_out_date: isoFromToday(63, 11),
        total_amount: 72000,
        status: "confirmed",
      },
    },
  ]

  return {
    ...payload,
    notifications: [...mockNotifications, ...payload.notifications],
    airbnbNotifications: [...mockAirbnbNotifications, ...payload.airbnbNotifications],
    reviews: [...mockReviews, ...payload.reviews],
    bookings: [...mockBookings, ...payload.bookings],
  }
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

    const shouldUseMocks = shouldUseJournalAvisMocks(session, aliases)
    return NextResponse.json(shouldUseMocks ? applyJournalAvisMocks(payload) : payload)
  } catch (error) {
    console.error("GET /api/client/journal-avis failed:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
