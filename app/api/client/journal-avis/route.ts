import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getSession } from "@/lib/auth"

type Review = {
  id: string
  rating: number | null
  review_text: string | null
  created_at: string
  is_published: boolean
  response_text: string | null
  response_date: string | null
  loft_id: string
  loft_name?: string | null
}

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const supabase = await createClient(true)

    // -------------------------
    // 1) Journal (notifications)
    // -------------------------
    // On réutilise la même logique que /app/[locale]/notifications/page.tsx :
    // - /api/notifications
    // - /api/airbnb/notifications
    // Ici, on renvoie au front les 2 lots séparés.
    //
    // NOTE: ces APIs existent côté serveur et appliquent déjà les règles d’accès.
    // Comme on ne peut pas faire de fetch “server-side” relatif fiable à l’URL,
    // on reconstruit directement les données de notifications via Supabase
    // uniquement si tables sont accessibles.
    //
    // Pour garder l’implémentation sûre et minimale, on renvoie des tableaux vides
    // si on ne trouve pas les tables (le front pourra quand même fonctionner).
    let notifications: any[] = []
    let airbnbNotifications: any[] = []

    // Notifications locales
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!error && data) notifications = data
    } catch {
      // ignore
    }

    // Airbnb notifications (si table existe)
    try {
      const { data, error } = await supabase
        .from("airbnb_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!error && data) airbnbNotifications = data
    } catch {
      // ignore
    }

    // ---------------------------------------------
    // 2) Avis : récupérer les lofts où le client
    //    a des bookings, puis charger les reviews
    //    de ces lofts via la table loft_reviews.
    // ---------------------------------------------
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("loft_id")
      .eq("client_id", userId)

    if (bookingsErr) {
      return NextResponse.json({
        notifications,
        airbnbNotifications,
        reviews: []
      })
    }

    const loftIds = Array.from(new Set((bookings || []).map((b: any) => b.loft_id).filter(Boolean)))

    if (loftIds.length === 0) {
      return NextResponse.json({
        notifications,
        airbnbNotifications,
        reviews: []
      })
    }

    const { data: reviews, error: reviewsErr } = await supabase
      .from("loft_reviews")
      .select(`
        id,
        loft_id,
        rating,
        review_text,
        created_at,
        is_published,
        response_text,
        response_date
      `)
      .in("loft_id", loftIds)
      .eq("is_published", true)
      .order("created_at", { ascending: false })

    if (reviewsErr) {
      return NextResponse.json({
        notifications,
        airbnbNotifications,
        reviews: []
      })
    }

    return NextResponse.json({
      notifications,
      airbnbNotifications,
      reviews: (reviews || []) satisfies Review[]
    })
  } catch (error) {
    console.error("GET /api/client/journal-avis failed:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
