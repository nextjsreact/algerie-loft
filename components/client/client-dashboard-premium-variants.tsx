"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo } from "react"
import {
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Compass,
  Wallet,
  Search,
  MessageSquareHeart,
  ChevronRight,
  Heart,
  Globe,
  Sunrise,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/* ─── helpers ─────────────────────────────────────────────── */

function fmtDate(value: string | undefined, locale: string) {
  if (!value) return "—"
  const loc = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR"
  return new Date(value).toLocaleDateString(loc, { day: "numeric", month: "short" })
}

function nights(a?: string, b?: string) {
  if (!a || !b) return null
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Number.isNaN(ms) ? null : Math.max(0, Math.round(ms / 864e5))
}

function statusCfg(s: string) {
  const m: Record<string, { l: string; c: string; i: typeof Clock }> = {
    pending:    { l: "En attente",   c: "bg-amber-50 text-amber-700 border-amber-200", i: Clock },
    confirmed:  { l: "Confirmée",    c: "bg-emerald-50 text-emerald-700 border-emerald-200", i: CheckCircle2 },
    completed:  { l: "Terminée",     c: "bg-sky-50 text-sky-700 border-sky-200", i: CheckCircle2 },
    cancelled:  { l: "Annulée",      c: "bg-rose-50 text-rose-700 border-rose-200", i: Star },
  }
  return m[s] || m.pending
}

function Pill({ status }: { status: string }) {
  const { l, c, i: I } = statusCfg(status)
  return (
    <Badge className={`${c} border font-medium rounded-full px-3 py-1 text-xs`}>
      <I className="h-3 w-3 mr-1" />{l}
    </Badge>
  )
}

/* ═══════════════════════════════════════════════════════════════
   VARIANT A — « ELEGANT »
   Inspired by Airbnb / Linear — warm, refined, lots of breathing room
   ═══════════════════════════════════════════════════════════════ */

function ElegantDashboard({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = useMemo(() =>
    bookings.filter(b => b.status !== "cancelled" && new Date(b.check_in) >= new Date()),
  [bookings])
  const completed = useMemo(() => bookings.filter(b => b.status === "completed"), [bookings])
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])
  const next = upcoming[0]

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* ── hero ── */}
      <div className="relative overflow-hidden bg-[#1a1a1a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(199,165,110,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:px-8">
          <p className="text-sm font-medium tracking-[0.2em] text-[#c7a56e]/80 uppercase">Loft Algérie</p>
          <h1 className="mt-6 max-w-2xl text-5xl font-light leading-tight text-white lg:text-7xl">
            {clientName.split(" ")[0]},<br />
            <span className="font-normal text-[#c7a56e]">bonjour.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/50 leading-relaxed">
            Votre espace de voyage, pensé comme un concierge privé. Réservations, découvertes et souvenirs au même endroit.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-8 py-6 text-sm font-medium tracking-wide">
                <Compass className="mr-2 h-4 w-4" /> Découvrir les lofts
              </Button>
            </Link>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-6 text-sm font-medium tracking-wide">
                <MessageSquareHeart className="mr-2 h-4 w-4" /> Mon journal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── stats ── */}
      <div className="mx-auto max-w-7xl px-6 -mt-10 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Home, label: "Séjours", v: bookings.length },
            { icon: Sunrise, label: "À venir", v: upcoming.length },
            { icon: CheckCircle2, label: "Terminés", v: completed.length },
            { icon: Wallet, label: "Dépensé", v: `${totalSpent.toLocaleString("fr-DZ")} DA` },
          ].map(s => (
            <Card key={s.label} className="border-0 bg-white shadow-lg shadow-black/5 rounded-3xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5f0e8] text-[#c7a56e]">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">{s.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900">{s.v}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── next stay ── */}
      {next && (
        <div className="mx-auto max-w-7xl px-6 mt-12 lg:px-8">
          <h2 className="text-sm font-medium tracking-[0.2em] text-neutral-400 uppercase mb-6">Prochain séjour</h2>
          <Link href={`/${locale}/client/bookings/${next.id}`} className="group block">
            <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/5">
              <div className="grid lg:grid-cols-[1fr_1.2fr]">
                <div className="relative h-64 lg:h-auto">
                  {next.lofts?.loft_photos?.[0]?.url ? (
                    <Image src={next.lofts.loft_photos[0].url} alt={next.lofts?.name || ""} fill className="object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                      <Home className="h-16 w-16 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <Pill status={next.status} />
                  <h3 className="mt-4 text-3xl font-light text-neutral-900">{next.lofts?.name || "Séjour"}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" /> {next.lofts?.address}
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-neutral-50 p-4 text-center">
                      <p className="text-[10px] tracking-widest text-neutral-400 uppercase">Arrivée</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">{fmtDate(next.check_in, locale)}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4 text-center">
                      <p className="text-[10px] tracking-widest text-neutral-400 uppercase">Départ</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">{fmtDate(next.check_out, locale)}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4 text-center">
                      <p className="text-[10px] tracking-widest text-neutral-400 uppercase">Durée</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">{nights(next.check_in, next.check_out) || "—"} nuits</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[#c7a56e] group-hover:gap-3 transition-all">
                    Voir les détails <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── all bookings ── */}
      <div className="mx-auto max-w-7xl px-6 mt-16 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-light text-neutral-900">Mes séjours</h2>
            <p className="mt-1 text-sm text-neutral-500">Historique de vos réservations</p>
          </div>
          <Link href={`/${locale}/client/bookings`}>
            <Button variant="ghost" className="text-neutral-500 hover:text-neutral-900">
              Tout voir <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 py-20 text-center">
            <Home className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-neutral-500">Aucun séjour pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.slice(0, 6).map(b => (
              <Link key={b.id} href={`/${locale}/client/bookings/${b.id}`} className="group block">
                <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white transition hover:shadow-lg hover:shadow-black/5">
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    {b.lofts?.loft_photos?.[0]?.url ? (
                      <Image src={b.lofts.loft_photos[0].url} alt={b.lofts?.name || ""} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Home className="h-12 w-12 text-neutral-300" /></div>
                    )}
                    <div className="absolute left-3 top-3"><Pill status={b.status} /></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium text-neutral-900">{b.lofts?.name || "Loft"}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500"><MapPin className="h-3 w-3" />{b.lofts?.address}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                      <span className="text-sm text-neutral-500">{fmtDate(b.check_in, locale)} → {fmtDate(b.check_out, locale)}</span>
                      <span className="text-sm font-semibold text-neutral-900">{Number(b.total_price || 0).toLocaleString("fr-DZ")} DA</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── footer CTA ── */}
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] bg-[#1a1a1a] p-12 text-center lg:p-20">
          <Globe className="mx-auto h-8 w-8 text-[#c7a56e]" />
          <h2 className="mt-6 text-3xl font-light text-white lg:text-4xl">Prêt pour la prochaine aventure ?</h2>
          <p className="mt-4 text-white/50">Explorez nos lofts à travers toute l&apos;Algérie</p>
          <Link href={`/${locale}/client/lofts`}>
            <Button className="mt-8 bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-10 py-6">
              Explorer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   VARIANT B — « GLASS »
   Glassmorphism, gradients, floating cards — ultra modern
   ═══════════════════════════════════════════════════════════════ */

function GlassDashboard({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = useMemo(() =>
    bookings.filter(b => b.status !== "cancelled" && new Date(b.check_in) >= new Date()),
  [bookings])
  const completed = useMemo(() => bookings.filter(b => b.status === "completed"), [bookings])
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])
  const next = upcoming[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ── hero ── */}
      <div className="relative overflow-hidden px-6 pt-20 pb-32 lg:px-8">
        {/* floating orbs */}
        <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute top-40 right-[15%] h-96 w-96 rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute bottom-0 left-[40%] h-64 w-64 rounded-full bg-pink-500/10 blur-[80px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="tracking-widest uppercase">Espace client</span>
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white lg:text-7xl">
            Salut {clientName.split(" ")[0]} <span className="inline-block animate-bounce">✦</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/50">
            Tout ce dont vous avez besoin pour vos voyages, dans une interface pensée pour vous.
          </p>

          {/* quick actions */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-white text-slate-900 hover:bg-white/90 rounded-full px-8 py-6 font-medium shadow-lg shadow-white/10">
                <Search className="mr-2 h-4 w-4" /> Réserver un loft
              </Button>
            </Link>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-6 font-medium">
                <MessageSquareHeart className="mr-2 h-4 w-4" /> Journal & avis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── stats ── */}
      <div className="mx-auto max-w-7xl px-6 -mt-20 relative z-10 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Home, label: "Séjours", v: bookings.length, bg: "from-blue-500/20 to-cyan-500/20" },
            { icon: Sunrise, label: "À venir", v: upcoming.length, bg: "from-emerald-500/20 to-teal-500/20" },
            { icon: CheckCircle2, label: "Terminés", v: completed.length, bg: "from-violet-500/20 to-purple-500/20" },
            { icon: Wallet, label: "Dépensé", v: `${totalSpent.toLocaleString("fr-DZ")} DA`, bg: "from-amber-500/20 to-orange-500/20" },
          ].map(s => (
            <Card key={s.label} className="border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${s.bg}`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/40">{s.label}</p>
                  <p className="text-2xl font-semibold text-white">{s.v}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── next stay ── */}
      {next && (
        <div className="mx-auto max-w-7xl px-6 mt-12 lg:px-8">
          <h2 className="text-sm font-medium tracking-[0.2em] text-white/30 uppercase mb-6">Prochain séjour</h2>
          <Link href={`/${locale}/client/bookings/${next.id}`} className="group block">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="grid lg:grid-cols-[1fr_1.2fr]">
                <div className="relative h-64 lg:h-auto">
                  {next.lofts?.loft_photos?.[0]?.url ? (
                    <Image src={next.lofts.loft_photos[0].url} alt={next.lofts?.name || ""} fill className="object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                      <Home className="h-16 w-16 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <Pill status={next.status} />
                  <h3 className="mt-4 text-3xl font-semibold text-white">{next.lofts?.name || "Séjour"}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-white/40">
                    <MapPin className="h-3.5 w-3.5" /> {next.lofts?.address}
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[
                      { label: "Arrivée", v: fmtDate(next.check_in, locale) },
                      { label: "Départ", v: fmtDate(next.check_out, locale) },
                      { label: "Durée", v: `${nights(next.check_in, next.check_out) || "—"} nuits` },
                    ].map(x => (
                      <div key={x.label} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur">
                        <p className="text-[10px] tracking-widest text-white/30 uppercase">{x.label}</p>
                        <p className="mt-1 text-sm font-medium text-white">{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-purple-300 group-hover:gap-3 transition-all">
                    Voir les détails <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── all bookings ── */}
      <div className="mx-auto max-w-7xl px-6 mt-16 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Mes séjours</h2>
            <p className="mt-1 text-sm text-white/40">Historique de vos réservations</p>
          </div>
          <Link href={`/${locale}/client/bookings`}>
            <Button variant="ghost" className="text-white/40 hover:text-white">
              Tout voir <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center">
            <Home className="mx-auto h-12 w-12 text-white/20" />
            <p className="mt-4 text-white/40">Aucun séjour pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.slice(0, 6).map(b => (
              <Link key={b.id} href={`/${locale}/client/bookings/${b.id}`} className="group block">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:bg-white/10">
                  <div className="relative aspect-[4/3] bg-white/5">
                    {b.lofts?.loft_photos?.[0]?.url ? (
                      <Image src={b.lofts.loft_photos[0].url} alt={b.lofts?.name || ""} fill className="object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Home className="h-12 w-12 text-white/10" /></div>
                    )}
                    <div className="absolute left-3 top-3"><Pill status={b.status} /></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium text-white">{b.lofts?.name || "Loft"}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/40"><MapPin className="h-3 w-3" />{b.lofts?.address}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm text-white/40">{fmtDate(b.check_in, locale)} → {fmtDate(b.check_out, locale)}</span>
                      <span className="text-sm font-semibold text-white">{Number(b.total_price || 0).toLocaleString("fr-DZ")} DA</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── footer CTA ── */}
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-12 text-center lg:p-20">
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative">
            <Sparkles className="mx-auto h-8 w-8 text-white" />
            <h2 className="mt-6 text-3xl font-bold text-white lg:text-4xl">Explorez l&apos;Algérie autrement</h2>
            <p className="mt-4 text-white/70">Des lofts uniques, des expériences inoubliables</p>
            <Link href={`/${locale}/client/lofts`}>
              <Button className="mt-8 bg-white text-slate-900 hover:bg-white/90 rounded-full px-10 py-6 font-medium shadow-lg shadow-black/20">
                Explorer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   VARIANT C — « EDITORIAL »
   Magazine-style, strong typography, asymmetric layout — premium feel
   ═══════════════════════════════════════════════════════════════ */

function EditorialDashboard({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = useMemo(() =>
    bookings.filter(b => b.status !== "cancelled" && new Date(b.check_in) >= new Date()),
  [bookings])
  const completed = useMemo(() => bookings.filter(b => b.status === "completed"), [bookings])
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])
  const next = upcoming[0]

  return (
    <div className="min-h-screen bg-white">
      {/* ── hero — split layout ── */}
      <div className="grid lg:grid-cols-2">
        {/* Left: text */}
        <div className="flex flex-col justify-center px-8 py-20 lg:px-16 lg:py-28">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#e85d04] uppercase">Loft Algérie</p>
          <h1 className="mt-6 text-5xl font-bold leading-[1.1] text-neutral-950 lg:text-7xl">
            {clientName.split(" ")[0]},<br />
            <span className="text-neutral-400">bonjour.</span>
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-neutral-500">
            Votre espace de voyage. Réservations, découvertes et souvenirs, pensés pour vous.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-neutral-950 text-white hover:bg-neutral-800 rounded-full px-8 py-6 text-sm font-medium">
                Réserver un loft
              </Button>
            </Link>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline" className="rounded-full px-8 py-6 text-sm font-medium border-neutral-200">
                Mon journal
              </Button>
            </Link>
          </div>
        </div>
        {/* Right: image / gradient */}
        <div className="relative hidden lg:block">
          {next?.lofts?.loft_photos?.[0]?.url ? (
            <Image src={next.lofts.loft_photos[0].url} alt="" fill className="object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-br from-neutral-100 to-neutral-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
          {/* floating stat card */}
          {next && (
            <div className="absolute bottom-12 left-12 rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-2xl max-w-xs">
              <p className="text-[10px] tracking-widest text-neutral-400 uppercase">Prochain séjour</p>
              <p className="mt-2 text-xl font-semibold text-neutral-900">{next.lofts?.name || "Séjour"}</p>
              <p className="mt-1 text-sm text-neutral-500">{fmtDate(next.check_in, locale)} → {fmtDate(next.check_out, locale)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── stats — editorial strip ── */}
      <div className="border-y border-neutral-100">
        <div className="mx-auto max-w-7xl grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100">
          {[
            { icon: Home, label: "Séjours", v: bookings.length },
            { icon: Sunrise, label: "À venir", v: upcoming.length },
            { icon: CheckCircle2, label: "Terminés", v: completed.length },
            { icon: Wallet, label: "Dépensé", v: `${totalSpent.toLocaleString("fr-DZ")} DA` },
          ].map(s => (
            <div key={s.label} className="px-8 py-8 text-center">
              <s.icon className="mx-auto h-5 w-5 text-neutral-300" />
              <p className="mt-3 text-3xl font-bold text-neutral-900">{s.v}</p>
              <p className="mt-1 text-xs tracking-widest text-neutral-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── all bookings — masonry-like ── */}
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-[#e85d04] uppercase">Collection</p>
            <h2 className="mt-3 text-4xl font-bold text-neutral-950">Mes séjours</h2>
          </div>
          <Link href={`/${locale}/client/bookings`}>
            <Button variant="ghost" className="text-neutral-500 hover:text-neutral-900">
              Tout voir <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 py-20 text-center">
            <Home className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-neutral-500">Aucun séjour pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.slice(0, 6).map((b, i) => (
              <Link key={b.id} href={`/${locale}/client/bookings/${b.id}`} className="group block">
                <div className={`overflow-hidden ${i === 0 ? 'rounded-[2rem]' : 'rounded-3xl'}`}>
                  <div className={`relative ${i === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'} bg-neutral-100`}>
                    {b.lofts?.loft_photos?.[0]?.url ? (
                      <Image src={b.lofts.loft_photos[0].url} alt={b.lofts?.name || ""} fill className="object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Home className="h-12 w-12 text-neutral-300" /></div>
                    )}
                    <div className="absolute left-4 top-4"><Pill status={b.status} /></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-sm font-medium text-white">{Number(b.total_price || 0).toLocaleString("fr-DZ")} DA</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-neutral-900">{b.lofts?.name || "Loft"}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500"><MapPin className="h-3.5 w-3.5" />{b.lofts?.address}</p>
                    <p className="mt-3 text-sm text-neutral-400">{fmtDate(b.check_in, locale)} → {fmtDate(b.check_out, locale)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── footer CTA ── */}
      <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-0 overflow-hidden rounded-[2rem]">
          <div className="bg-neutral-950 p-12 lg:p-16 flex flex-col justify-center">
            <Compass className="h-8 w-8 text-[#e85d04]" />
            <h2 className="mt-6 text-3xl font-bold text-white">Nouvelles découvertes</h2>
            <p className="mt-4 text-white/50 leading-relaxed">Explorez des lofts uniques à travers toute l&apos;Algérie</p>
            <Link href={`/${locale}/client/lofts`}>
              <Button className="mt-8 bg-white text-neutral-950 hover:bg-white/90 rounded-full w-fit px-8 py-6 font-medium">
                Explorer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="bg-neutral-100 p-12 lg:p-16 flex flex-col justify-center">
            <Heart className="h-8 w-8 text-[#e85d04]" />
            <h2 className="mt-6 text-3xl font-bold text-neutral-950">Vos favoris</h2>
            <p className="mt-4 text-neutral-500 leading-relaxed">Retrouvez les lofts qui vous ont marqué</p>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline" className="mt-8 rounded-full w-fit px-8 py-6 font-medium border-neutral-300">
                Voir mon journal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════ */

export type PremiumVariant = "elegant" | "glass" | "editorial"

export function ClientDashboardPremiumVariants({
  bookings,
  locale,
  clientName,
  variant,
}: {
  bookings: any[]
  locale: string
  clientName: string
  variant: PremiumVariant
}) {
  switch (variant) {
    case "glass":
      return <GlassDashboard bookings={bookings} locale={locale} clientName={clientName} />
    case "editorial":
      return <EditorialDashboard bookings={bookings} locale={locale} clientName={clientName} />
    case "elegant":
    default:
      return <ElegantDashboard bookings={bookings} locale={locale} clientName={clientName} />
  }
}
