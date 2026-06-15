import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { ClientDashboardView } from "@/components/client/client-dashboard-view"
import { ClientDashboardVariants } from "@/components/client/client-dashboard-variants"
import { ClientDashboardPremiumVariants, type PremiumVariant } from "@/components/client/client-dashboard-premium-variants"
import { ClientDashboardCustomVariants, type CustomVariant } from "@/components/client/client-dashboard-variants-custom"

const PREMIUM_VARIANTS = ["elegant", "glass", "editorial"]
const LEGACY_VARIANTS = ["executive", "luxury", "compact"]
const CUSTOM_VARIANTS: CustomVariant[] = ["cards", "master-detail", "progress"]


export default async function ClientDashboardPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ variant?: string }>
}) {
  const { locale } = await params
  const { variant } = await searchParams
  const session = await requireRole(["client"], locale)


  const supabase = await createClient(true)
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(12)

  const loftIds = bookingsData?.map(b => b.loft_id).filter(Boolean) || []
  let bookingLoftsData: any[] = []

  if (loftIds.length > 0) {
    const { data } = await supabase
      .from("lofts")
      .select("*, zone_areas!lofts_zone_area_id_fkey(name)")
      .in("id", loftIds)
    bookingLoftsData = data || []
  }

  const { data: bookingPhotosData } = await supabase
    .from("loft_photos")
    .select("loft_id, url, is_cover")
    .order("is_cover", { ascending: false })
    .order("created_at", { ascending: true })

  const bookings = (bookingsData || []).map(booking => {
    const loft = bookingLoftsData?.find(l => l.id === booking.loft_id)
    const loftPhotos = bookingPhotosData?.filter(p => p.loft_id === booking.loft_id) || []
    return {
      ...booking,
      lofts: loft ? { ...loft, loft_photos: loftPhotos } : null
    }
  })

  if (variant && PREMIUM_VARIANTS.includes(variant)) {
    return (
      <ClientDashboardPremiumVariants
        bookings={bookings || []}
        locale={locale}
        clientName={session.user.full_name || session.user.email}
        variant={variant as PremiumVariant}
      />
    )
  }

  if (variant && CUSTOM_VARIANTS.includes(variant as CustomVariant)) {
    return (
      <ClientDashboardCustomVariants
        bookings={bookings || []}
        locale={locale}
        clientName={session.user.full_name || session.user.email}
        variant={variant as CustomVariant}
      />
    )
  }

  if (variant && LEGACY_VARIANTS.includes(variant)) {
    return (
      <ClientDashboardVariants
        bookings={bookings || []}
        locale={locale}
        clientName={session.user.full_name || session.user.email}
        variant={variant as any}
      />
    )
  }


  return (
    <ClientDashboardView
      bookings={bookings || []}
      locale={locale}
      clientName={session.user.full_name || session.user.email}
    />
  )
}
