"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquareHeart,
  Home,
  Wallet,
  Sunrise,
  Sparkles,
  ChevronRight,
  Globe,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { getZoneAreas } from "@/app/actions/zone-areas"
import { useTranslations, useLocale } from "next-intl"

/* ─── helpers ─────────────────────────────────────────────── */

function fmtDate(value: string | undefined, locale: string) {
  if (!value) return "—"
  const loc = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR"
  return new Date(value).toLocaleDateString(loc, { day: "numeric", month: "short" })
}

function fmtDateFull(value: string | undefined, locale: string) {
  if (!value) return "—"
  const loc = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR"
  return new Date(value).toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })
}

function nights(a?: string, b?: string) {
  if (!a || !b) return null
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Number.isNaN(ms) ? null : Math.max(0, Math.round(ms / 864e5))
}

function statusCfg(s: string) {
  const m: Record<string, { l: string; c: string; dc: string; i: typeof Clock }> = {
    pending:   { l: "En attente",  c: "bg-amber-50 text-amber-700 border-amber-200",  dc: "dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",  i: Clock },
    confirmed: { l: "Confirmée",   c: "bg-emerald-50 text-emerald-700 border-emerald-200", dc: "dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", i: CheckCircle2 },
    completed: { l: "Terminée",    c: "bg-sky-50 text-sky-700 border-sky-200",       dc: "dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",       i: CheckCircle2 },
    cancelled: { l: "Annulée",     c: "bg-rose-50 text-rose-700 border-rose-200",     dc: "dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",     i: XCircle },
  }
  return m[s] || m.pending
}

function Pill({ status }: { status: string }) {
  const { l, c, dc, i: I } = statusCfg(status)
  return (
    <Badge className={`${c} ${dc} border font-medium rounded-full px-2.5 py-0.5 text-[11px]`}>
      <I className="h-3 w-3 mr-1" />{l}
    </Badge>
  )
}

function getProgress(b: any) {
  if (b.status === "cancelled") return 0
  if (b.status === "completed") return 100
  const now = Date.now()
  const start = new Date(b.check_in).getTime()
  const end = new Date(b.check_out).getTime()
  if (now < start) return 0
  if (now > end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

/* ─── component ───────────────────────────────────────────── */

interface ClientDashboardViewProps {
  bookings: any[]
  locale: string
  clientName: string
}

export function ClientDashboardView({ bookings, locale, clientName }: ClientDashboardViewProps) {
  const router = useRouter()
  const t = useTranslations("client.dashboard")
  const tStatus = useTranslations("client.bookingStatus")
  const currentLocale = useLocale()

  const [searchData, setSearchData] = useState({ destination: "", checkIn: "", checkOut: "", guests: 1 })
  const [zones, setZones] = useState<{ id: string; name: string }[]>([])
  const [lofts, setLofts] = useState<any[]>([])

  useEffect(() => { getZoneAreas().then(data => setZones(data)) }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/public/featured-lofts?limit=25&randomize=true", { signal: controller.signal })
      .then(r => r.json())
      .then(data => { if (data.lofts?.length > 0) setLofts(data.lofts) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const filteredLofts = useMemo(() => {
    if (!searchData.destination) return lofts
    return lofts.filter(loft => {
      const zone = loft.zone || loft.address
      return zone?.toLowerCase().includes(searchData.destination.toLowerCase())
    })
  }, [lofts, searchData.destination])

  const upcoming = useMemo(() =>
    bookings.filter(b => b.status !== "cancelled" && new Date(b.check_in) >= new Date()),
  [bookings])
  const completed = useMemo(() => bookings.filter(b => b.status === "completed"), [bookings])
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])
  const nextStay = upcoming[0]

  const handleSearch = () => {
    const params = new URLSearchParams({
      destination: searchData.destination,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: searchData.guests.toString(),
    })
    router.push(`/${locale}/client/search?${params}`)
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-neutral-950">
      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden bg-neutral-950 dark:bg-neutral-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(199,165,110,0.2),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_20%_50%,rgba(199,165,110,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-8">
          <h1 className="mt-5 max-w-2xl text-4xl font-light leading-tight text-white lg:text-6xl">
            Bonjour <span className="font-normal text-[#c7a56e]">{clientName.split(" ")[0]}</span>,
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/45 leading-relaxed">
            Conciergerie Loft Algérie<br />
            Check-in, besoins spécifiques, factures et assistance séjour centralisés.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-7 py-5 text-sm font-medium tracking-wide">
                <Search className="mr-2 h-4 w-4" /> Réserver un loft
              </Button>
            </Link>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline" className="border-white/15 text-white hover:bg-white/10 rounded-full px-7 py-5 text-sm font-medium tracking-wide">
                <MessageSquareHeart className="mr-2 h-4 w-4" /> Mon journal
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <Link href={`/${locale}/client/support`}>
              <span className="text-sm text-[#c7a56e] hover:underline cursor-pointer">Contacter le support</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ STATS ═══════ */}
      <div className="mx-auto max-w-7xl px-6 -mt-8 relative z-10 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Home, label: "Séjours", v: bookings.length, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" },
            { icon: Sunrise, label: "À venir", v: upcoming.length, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950" },
            { icon: CheckCircle2, label: "Terminés", v: completed.length, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950" },
            { icon: Wallet, label: "Dépensé", v: `${totalSpent.toLocaleString("fr-DZ")} DA`, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
          ].map(s => (
            <Card key={s.label} className="border-0 bg-white dark:bg-neutral-900 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-2xl">
              <CardContent className="p-5 flex items-center gap-3.5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{s.label}</p>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{s.v}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══════ NEXT STAY ═══════ */}
      {nextStay && (
        <div className="mx-auto max-w-7xl px-6 mt-10 lg:px-8">
          <h2 className="text-[10px] font-medium tracking-[0.3em] text-neutral-400 dark:text-neutral-500 uppercase mb-5">Prochain séjour</h2>
          <Link href={`/${locale}/client/bookings/${nextStay.id}`} className="group block">
            <div className="overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-black/5 dark:shadow-black/20">
              <div className="grid lg:grid-cols-[1fr_1.3fr]">
                <div className="relative h-56 lg:h-auto lg:min-h-[280px]">
                  {nextStay.lofts?.loft_photos?.[0]?.url ? (
                    <Image src={nextStay.lofts.loft_photos[0].url} alt={nextStay.lofts?.name || ""} fill className="object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
                      <Home className="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="p-7 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <Pill status={nextStay.status} />
                    {getProgress(nextStay) > 0 && getProgress(nextStay) < 100 && (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{getProgress(nextStay)}% en cours</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-2xl lg:text-3xl font-light text-neutral-900 dark:text-white">{nextStay.lofts?.name || "Séjour"}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    <MapPin className="h-3.5 w-3.5" /> {nextStay.lofts?.address}
                  </p>

                  {/* progress bar */}
                  {getProgress(nextStay) > 0 && getProgress(nextStay) < 100 && (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700" style={{ width: `${getProgress(nextStay)}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { l: "Arrivée", v: fmtDate(nextStay.check_in, locale) },
                      { l: "Départ", v: fmtDate(nextStay.check_out, locale) },
                      { l: "Durée", v: `${nights(nextStay.check_in, nextStay.check_out) || "—"} nuits` },
                    ].map(x => (
                      <div key={x.l} className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3.5 text-center">
                        <p className="text-[9px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">{x.l}</p>
                        <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{x.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#c7a56e] group-hover:gap-3 transition-all">
                    Voir les détails <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ═══════ BOOKINGS ═══════ */}
      <div className="mx-auto max-w-7xl px-6 mt-14 lg:px-8">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-2xl font-light text-neutral-900 dark:text-white">Mes séjours</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Historique de vos réservations</p>
          </div>
          <Link href={`/${locale}/client/bookings`}>
            <Button variant="ghost" className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm">
              Tout voir <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700 py-16 text-center">
            <Home className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">Aucun séjour pour le moment</p>
            <Link href={`/${locale}/client/lofts`}>
              <Button className="mt-6 bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-7">
                Découvrir les lofts <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.slice(0, 6).map((b, i) => {
              const progress = getProgress(b)
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <Link href={`/${locale}/client/bookings/${b.id}`} className="group block">
                    <div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30">
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                        {b.lofts?.loft_photos?.[0]?.url ? (
                          <Image src={b.lofts.loft_photos[0].url} alt={b.lofts?.name || ""} fill className="object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Home className="h-10 w-10 text-neutral-300 dark:text-neutral-600" /></div>
                        )}
                        <div className="absolute left-3 top-3"><Pill status={b.status} /></div>

                        {/* overlay price on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="text-sm font-semibold text-white">{Number(b.total_price || 0).toLocaleString("fr-DZ")} DA</p>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-medium text-neutral-900 dark:text-white truncate">{b.lofts?.name || "Loft"}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />{b.lofts?.address}
                        </p>

                        {/* mini progress */}
                        {progress > 0 && progress < 100 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-neutral-50 dark:border-neutral-800 pt-3">
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">{fmtDate(b.check_in, locale)} → {fmtDate(b.check_out, locale)}</span>
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{Number(b.total_price || 0).toLocaleString("fr-DZ")} DA</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════ SEARCH LOFTS ═══════ */}
      <div className="mx-auto max-w-7xl px-6 mt-16 lg:px-8">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-2xl font-light text-neutral-900 dark:text-white">
              {searchData.destination ? `Lofts à ${searchData.destination}` : "Découvrir nos lofts"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Sélection inspirante à travers l&apos;Algérie</p>
          </div>
          <Link href={`/${locale}/client/lofts`}>
            <Button variant="ghost" className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm">
              Tout voir <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* mini search bar */}
        <div className="mb-8 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={searchData.destination}
                onChange={e => setSearchData({ ...searchData, destination: e.target.value })}
                className="w-full rounded-xl border-0 bg-neutral-50 dark:bg-neutral-800 pl-9 pr-3 py-2.5 text-sm text-neutral-900 dark:text-white outline-none"
              >
                <option value="">Toutes les zones</option>
                {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input type="date" value={searchData.checkIn} onChange={e => setSearchData({ ...searchData, checkIn: e.target.value })} min={new Date().toISOString().split("T")[0]} className="pl-9 border-0 bg-neutral-50 dark:bg-neutral-800 rounded-xl" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input type="date" value={searchData.checkOut} onChange={e => setSearchData({ ...searchData, checkOut: e.target.value })} min={searchData.checkIn || new Date().toISOString().split("T")[0]} className="pl-9 border-0 bg-neutral-50 dark:bg-neutral-800 rounded-xl" />
            </div>
            <Button onClick={handleSearch} className="bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-xl py-5 font-medium">
              <Search className="h-4 w-4 mr-2" /> Rechercher
            </Button>
          </div>
        </div>

        {filteredLofts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700 py-16 text-center">
            <MapPin className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">Aucun loft trouvé</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLofts.slice(0, 6).map((loft: any, i: number) => (
              <motion.div
                key={loft.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Link href={`/${locale}/client/lofts/${loft.id}`} className="group block">
                  <div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30">
                    <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                      {loft.photo ? (
                        <Image src={loft.photo} alt={loft.name} fill sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><MapPin className="h-10 w-10 text-neutral-300 dark:text-neutral-600" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-neutral-900 dark:text-white truncate">{loft.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{loft.zone || loft.address}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-semibold text-neutral-900 dark:text-white">{loft.price_per_night?.toLocaleString()} DA</span>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">/ nuit</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ FOOTER CTA ═══════ */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-[2rem] bg-neutral-950 dark:bg-neutral-900 border border-neutral-800 p-12 text-center lg:p-16">
          <Globe className="mx-auto h-7 w-7 text-[#c7a56e]" />
          <h2 className="mt-5 text-2xl lg:text-3xl font-light text-white">Prêt pour la prochaine aventure ?</h2>
          <p className="mt-3 text-white/40">Des lofts uniques à travers toute l&apos;Algérie</p>
          <Link href={`/${locale}/client/lofts`}>
            <Button className="mt-7 bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-9 py-5 font-medium">
              Explorer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
