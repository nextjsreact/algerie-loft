"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquareHeart,
  Home,
  Wallet,
  Sunrise,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"

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

function relativeTime(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.round(diff / 864e5)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Demain"
  if (days === -1) return "Hier"
  if (days > 0) return `Dans ${days}j`
  return `Il y a ${Math.abs(days)}j`
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

  const [selectedId, setSelectedId] = useState<string | null>(bookings[0]?.id || null)
  const selected = bookings.find(b => b.id === selectedId) || bookings[0] || null

  const upcoming = useMemo(() =>
    bookings.filter(b => b.status !== "cancelled" && new Date(b.check_in) >= new Date()),
  [bookings])
  const completed = useMemo(() => bookings.filter(b => b.status === "completed"), [bookings])
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])

  const [lofts, setLofts] = useState<any[]>([])
  useEffect(() => {
    fetch("/api/public/featured-lofts?limit=20&randomize=true")
      .then(r => r.json())
      .then(data => { if (data.lofts) setLofts(data.lofts.filter((l: any) => l.photo)) })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* ═══════ TOP BAR ═══════ */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Bonjour {clientName.split(" ")[0]}</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Votre espace de voyage</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-5 py-2 text-xs font-medium">
                <Search className="mr-1.5 h-3.5 w-3.5" /> Réserver
              </Button>
            </Link>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline" className="rounded-full px-5 py-2 text-xs font-medium border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5" /> Journal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ STATS STRIP ═══════ */}
      <div className="border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto flex max-w-7xl divide-x divide-neutral-100 dark:divide-neutral-800 px-6 lg:px-8">
          {[
            { l: "Total", v: bookings.length },
            { l: "À venir", v: upcoming.length },
            { l: "Terminés", v: completed.length },
            { l: "Dépensé", v: `${totalSpent.toLocaleString("fr-DZ")} DA` },
          ].map(s => (
            <div key={s.l} className="flex-1 px-6 py-4">
              <p className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">{s.l}</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ MASTER-DETAIL ═══════ */}
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* ── LEFT: master list ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-widest text-neutral-400 dark:text-neutral-500 uppercase mb-4">
              Réservations ({bookings.length})
            </p>
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 py-12 text-center">
                <Home className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Aucune réservation</p>
                <Link href={`/${locale}/client/lofts`}>
                  <Button className="mt-4 bg-[#c7a56e] text-[#1a1a1a] hover:bg-[#d4b67a] rounded-full px-5 text-xs">
                    Découvrir les lofts
                  </Button>
                </Link>
              </div>
            ) : (
              bookings.map((b, i) => (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => setSelectedId(b.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    selectedId === b.id
                      ? "border-[#c7a56e] bg-white dark:bg-neutral-800 shadow-lg shadow-[#c7a56e]/10 dark:shadow-[#c7a56e]/5"
                      : "border-neutral-100 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-700">
                      {b.lofts?.loft_photos?.[0]?.url ? (
                        <Image src={b.lofts.loft_photos[0].url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Home className="h-5 w-5 text-neutral-300 dark:text-neutral-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                          {b.lofts?.name || "Loft"}
                        </h3>
                        <Pill status={b.status} />
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{b.lofts?.address}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                        {fmtDate(b.check_in, locale)} → {fmtDate(b.check_out, locale)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* ── RIGHT: detail panel ── */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-black/5 dark:shadow-black/20"
              >
                {/* photo */}
                <div className="relative h-64 lg:h-80">
                  {selected.lofts?.loft_photos?.[0]?.url ? (
                    <Image src={selected.lofts.loft_photos[0].url} alt={selected.lofts?.name || ""} fill className="object-cover" />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
                      <Home className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4"><Pill status={selected.status} /></div>
                  <div className="absolute right-4 top-4 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {relativeTime(selected.check_in)}
                  </div>
                </div>

                {/* info */}
                <div className="p-6 lg:p-8">
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{selected.lofts?.name || "Loft"}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    <MapPin className="h-4 w-4" /> {selected.lofts?.address}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { l: "Arrivée", v: fmtDate(selected.check_in, locale) },
                      { l: "Départ", v: fmtDate(selected.check_out, locale) },
                      { l: "Durée", v: `${nights(selected.check_in, selected.check_out) || "—"} nuits` },
                    ].map(x => (
                      <div key={x.l} className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4 text-center">
                        <p className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">{x.l}</p>
                        <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{x.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Voyageurs</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{selected.guests || 1}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#c7a56e] p-4">
                    <span className="text-sm text-[#1a1a1a]/70">Total</span>
                    <span className="text-lg font-semibold text-[#1a1a1a]">{Number(selected.total_price || 0).toLocaleString("fr-DZ")} DA</span>
                  </div>

                  {selected.special_requests && (
                    <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Demandes spéciales</p>
                      <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">{selected.special_requests}</p>
                    </div>
                  )}

                  <Link href={`/${locale}/client/bookings/${selected.id}`}>
                    <Button className="mt-6 w-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl py-6">
                      Voir la réservation complète <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700 py-20 text-center">
                <Home className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                <p className="mt-4 text-neutral-500 dark:text-neutral-400">Sélectionnez un séjour pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ CONCIERGE + DISCOVER ═══════ */}
      <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {/* Concierge */}
          <Card className="border-0 bg-neutral-950 dark:bg-neutral-800 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7a56e]/20 mb-4">
                <MessageSquareHeart className="h-5 w-5 text-[#c7a56e]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Conciergerie</h3>
              <p className="mt-2 text-sm text-white/50 leading-relaxed">
                Check-in, besoins spécifiques, factures et assistance séjour centralisés.
              </p>
              <div className="mt-5 space-y-2">
                <a href="tel:+213560362543" className="flex items-center gap-2 text-sm text-[#c7a56e] hover:underline">
                  <span className="font-medium">+213 560 36 25 43</span>
                </a>
                <a href="mailto:contact@loftalgerie.com" className="flex items-center gap-2 text-sm text-[#c7a56e] hover:underline">
                  <span className="font-medium">contact@loftalgerie.com</span>
                </a>
                <a href="https://wa.me/213560362543" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#c7a56e] hover:underline">
                  <span className="font-medium">WhatsApp</span>
                </a>
              </div>
              <Button className="mt-6 w-full !bg-white !text-neutral-950 hover:!bg-white/90 rounded-xl py-5 text-sm font-medium">
                Contacter le support
              </Button>
            </CardContent>
          </Card>

          {/* Discover button */}
          <Link href={`/${locale}/client/lofts`}>
            <Card className="border-0 !bg-[#c7a56e] shadow-lg hover:shadow-xl transition cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <Search className="h-8 w-8 mb-4 text-[#1a1a1a]" />
                <h3 className="text-2xl font-semibold text-[#1a1a1a]">Découvrir les lofts</h3>
                <p className="mt-2 text-sm text-[#1a1a1a]/60">
                  Explorez nos lofts à travers toute l&apos;Algérie
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#1a1a1a]">
                  Voir la collection <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* ═══════ LOFTS GRID ═══════ */}
      {lofts.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="text-2xl font-light text-neutral-900 dark:text-white">Nos lofts</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Sélection inspirante à travers l&apos;Algérie</p>
            </div>
            <Link href={`/${locale}/client/lofts`}>
              <Button variant="ghost" className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm">
                Tout voir <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {lofts.slice(0, 16).map((loft: any, i: number) => (
              <motion.div
                key={loft.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <Link href={`/${locale}/client/lofts/${loft.id}`} className="group block">
                  <div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30">
                    <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                      <Image src={loft.photo} alt={loft.name} fill sizes="(max-width:640px)100vw,(max-width:1024px)50vw,25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-neutral-900 dark:text-white truncate text-sm">{loft.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{loft.zone || loft.address}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{loft.price_per_night?.toLocaleString()} DA</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">/ nuit</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
