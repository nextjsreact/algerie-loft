"use client"

import { LoftCardImage } from "@/components/client/loft-card-image"
import Link from "next/link"
import { useMemo } from "react"
import { useLocale } from "next-intl"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  MessageSquareHeart,
  Receipt,
  Search,
  Star,
  TrendingUp,
  XCircle,
  ArrowRight,
  CreditCard,
  Sparkles,
  ShieldCheck,
  UtensilsCrossed,
  Wifi,
  Car,
  PartyPopper
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { ClientDashboardCustomVariants } from "@/components/client/client-dashboard-variants-custom"

type DashboardVariant = "executive" | "luxury" | "compact" | "cards" | "master-detail" | "progress"


interface DashboardVariantProps {
  bookings: any[]
  locale: string
  clientName: string
  variant: DashboardVariant
}

function formatDate(value: string, locale: string) {
  if (!value) return "—"
  const currentLocale = locale || "fr"
  return new Date(value).toLocaleDateString(currentLocale === "ar" ? "ar-DZ" : currentLocale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

function getNights(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return null
  const start = new Date(checkIn).getTime()
  const end = new Date(checkOut).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.max(0, Math.round((end - start) / 86400000))
}

function statusConfig(status: string) {
  const map: Record<string, { label: string; className: string; icon: any }> = {
    pending: { label: "En attente", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    confirmed: { label: "Confirmée", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    completed: { label: "Terminée", className: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
    cancelled: { label: "Annulée", className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle }
  }
  return map[status] || map.pending
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig(status)
  const Icon = config.icon
  return (
    <Badge className={`${config.className} border font-medium`}>
      <Icon className="h-3.5 w-3.5 mr-1" />
      {config.label}
    </Badge>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed p-8 text-center">
      <Home className="mx-auto h-10 w-10 text-muted-foreground/60" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function ExecutiveDashboard({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = bookings.filter((booking) => booking.status !== "cancelled" && new Date(booking.check_in) >= new Date())
  const completed = bookings.filter((booking) => booking.status === "completed")
  const nextStay = upcoming[0]

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.22),transparent_35%)]" />
        <div className="container relative mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Expérience client premium
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight lg:text-6xl">
              Bonjour {clientName}.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/72">
              Votre espace de voyage, pensé comme un concierge privé : réservations, préférences, journal et prochaines expériences au même endroit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/client/search`}>
                <Button className="bg-white text-slate-950 hover:bg-white/90">
                  <Search className="h-4 w-4 mr-2" />
                  Réserver un nouveau séjour
                </Button>
              </Link>
              <Link href={`/${locale}/client/journal-avis`}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <MessageSquareHeart className="h-4 w-4 mr-2" />
                  Journal & avis
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-[0.3em] text-white/60">Prochain séjour</CardTitle>
            </CardHeader>
            <CardContent>
              {nextStay ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold">{nextStay.lofts?.name || "Séjour à venir"}</p>
                      <p className="mt-1 text-white/60">{nextStay.lofts?.address}</p>
                    </div>
                    <StatusBadge status={nextStay.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-white/50">Arrivée</p>
                      <p className="mt-1 font-medium">{formatDate(nextStay.check_in, locale)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-white/50">Départ</p>
                      <p className="mt-1 font-medium">{formatDate(nextStay.check_out, locale)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3 text-sm">
                    <span className="text-white/50">Durée</span>
                    <span className="font-medium">{getNights(nextStay.check_in, nextStay.check_out) || "—"} nuits</span>
                  </div>
                </div>
              ) : (
                <EmptyState title="Aucun séjour prévu" description="Vos prochaines réservations apparaîtront ici automatiquement." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto -mt-8 px-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Séjours", value: bookings.length, icon: Home },
            { label: "À venir", value: upcoming.length, icon: Calendar },
            { label: "Terminés", value: completed.length, icon: CheckCircle2 },
            { label: "Dépenses", value: bookings.reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0), format: "currency", icon: Receipt }
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-0 shadow-xl">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {stat.format === "currency" ? `${stat.value.toLocaleString("fr-DZ")} DA` : stat.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mes séjours</CardTitle>
                <p className="text-sm text-muted-foreground">Historique récent et réservations actives.</p>
              </div>
              <Link href={`/${locale}/client/bookings`}>
                <Button variant="ghost">Voir tout <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <EmptyState title="Aucune réservation" description="Réservez votre premier loft pour voir vos séjours ici." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bookings.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="group overflow-hidden rounded-3xl border bg-white transition hover:shadow-lg">
                      <div className="relative h-44 bg-slate-100">
                        <LoftCardImage
                          photos={booking.lofts?.loft_photos || []}
                          name={booking.lofts?.name || ""}
                        >
                          <div className="absolute left-3 top-3 z-10"><StatusBadge status={booking.status} /></div>
                        </LoftCardImage>
                      </div>
                      <div className="space-y-3 p-5">
                        <div>
                          <h3 className="font-semibold">{booking.lofts?.name || "Loft"}</h3>
                          <p className="mt-1 flex items-center text-sm text-muted-foreground"><MapPin className="mr-1 h-3.5 w-3.5" />{booking.lofts?.address}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>{formatDate(booking.check_in, locale)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{formatDate(booking.check_out, locale)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="text-sm text-muted-foreground">{getNights(booking.check_in, booking.check_out) || "—"} nuits</span>
                          <span className="font-semibold">{Number(booking.total_price || 0).toLocaleString("fr-DZ")} DA</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 bg-slate-950 text-white shadow-xl">
              <CardContent className="p-6">
                <ShieldCheck className="h-8 w-8 text-amber-400" />
                <h3 className="mt-4 text-xl font-semibold">Conciergerie Loft Algérie</h3>
                <p className="mt-2 text-sm text-white/60">Check-in, besoins spécifiques, factures et assistance séjour centralisés.</p>
                <Button className="mt-5 w-full bg-white text-slate-950 hover:bg-white/90">
                  Contacter le support
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Wifi haut débit", Wifi],
                  ["Cuisine équipée", UtensilsCrossed],
                  ["Parking", Car],
                  ["Annulation flexible", ShieldCheck]
                ].map(([label, Icon]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-3">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <p className="mt-2 font-medium">{label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function LuxuryDashboard({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = bookings.filter((booking) => booking.status !== "cancelled" && new Date(booking.check_in) >= new Date())
  const nextStay = upcoming[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <Badge className="border-amber-300/40 bg-amber-400/10 text-amber-200">
              <Star className="h-3.5 w-3.5 mr-1 fill-amber-300 text-amber-300" />
              Loft Algérie Signature
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight">Bienvenue, {clientName}.</h1>
            <p className="mt-5 text-white/65">
              Une interface plus éditoriale, chaleureuse et haut de gamme pour piloter vos séjours avec clarté.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["Séjours", bookings.length],
                ["À venir", upcoming.length],
                ["Avis", bookings.filter((b: any) => b.status === "completed").length]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/45">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-0 shadow-2xl">
            <div className="relative h-72 bg-stone-200">
              <LoftCardImage
                photos={nextStay?.lofts?.loft_photos || []}
                name={nextStay?.lofts?.name || ""}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">Prochaine expérience</p>
                  <h2 className="mt-2 text-3xl font-semibold">{nextStay?.lofts?.name || "Aucun séjour prévu"}</h2>
                  <p className="mt-2 flex items-center text-white/70"><MapPin className="mr-1 h-4 w-4" />{nextStay?.lofts?.address}</p>
                </div>
              </LoftCardImage>
            </div>
            <CardContent className="grid gap-3 p-6 md:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Arrivée</p><p className="mt-1 font-semibold">{nextStay ? formatDate(nextStay.check_in, locale) : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Départ</p><p className="mt-1 font-semibold">{nextStay ? formatDate(nextStay.check_out, locale) : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Durée</p><p className="mt-1 font-semibold">{nextStay ? `${getNights(nextStay.check_in, nextStay.check_out) || "—"} nuits` : "—"}</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Réservations récentes</CardTitle>
                <p className="text-sm text-muted-foreground">Une lecture claire de vos séjours passés et futurs.</p>
              </div>
              <Link href={`/${locale}/client/bookings`}>
                <Button variant="ghost">Voir tout</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <EmptyState title="Aucune réservation" description="Vos séjours apparaîtront ici après votre première réservation." />
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="grid gap-4 rounded-3xl border p-4 transition hover:border-amber-200 hover:shadow-md md:grid-cols-[1fr_auto]">
                      <div className="flex gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                          <LoftCardImage
                            photos={booking.lofts?.loft_photos || []}
                            name={booking.lofts?.name || ""}
                          />
                        </div>
                        <div>
                          <div className="mb-2"><StatusBadge status={booking.status} /></div>
                          <h3 className="font-semibold">{booking.lofts?.name || "Loft"}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{formatDate(booking.check_in, locale)} → {formatDate(booking.check_out, locale)} · {getNights(booking.check_in, booking.check_out) || "—"} nuits</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-lg font-semibold">{Number(booking.total_price || 0).toLocaleString("fr-DZ")} DA</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 bg-white shadow-xl">
              <CardHeader>
                <CardTitle>Accès rapide</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href={`/${locale}/client/search`}><Button className="w-full justify-between" variant="outline">Rechercher un loft <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link href={`/${locale}/client/journal-avis`}><Button className="w-full justify-between" variant="outline">Journal & avis <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link href={`/${locale}/client/profile`}><Button className="w-full justify-between" variant="outline">Profil client <ArrowRight className="h-4 w-4" /></Button></Link>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-amber-50 to-rose-50 shadow-xl">
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-amber-600" />
                <h3 className="mt-4 text-xl font-semibold">Conseil personnalisé</h3>
                <p className="mt-2 text-sm text-muted-foreground">Réservez plus tôt pour profiter des meilleurs lofts disponibles aux dates souhaitées.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactDashboard({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = bookings.filter((booking) => booking.status !== "cancelled" && new Date(booking.check_in) >= new Date())

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto flex flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="bg-blue-600 text-white hover:bg-blue-600"><Sparkles className="h-3.5 w-3.5 mr-1" />Dashboard repensé</Badge>
            <h1 className="mt-4 text-3xl font-semibold">Bonjour {clientName}</h1>
            <p className="mt-2 text-muted-foreground">Vue compacte, moderne et orientée action.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/client/search`}><Button><Search className="h-4 w-4 mr-2" />Rechercher</Button></Link>
            <Link href={`/${locale}/client/journal-avis`}><Button variant="outline"><MessageSquareHeart className="h-4 w-4 mr-2" />Avis</Button></Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Séjours", bookings.length, Home],
            ["À venir", upcoming.length, Calendar],
            ["Dépenses", bookings.reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0), Receipt],
            ["Support", "24/7", ShieldCheck]
          ].map(([label, value, Icon]: any) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{typeof value === "number" && label === "Dépenses" ? `${value.toLocaleString("fr-DZ")} DA` : value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Prochain séjour</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming[0] ? (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-950 p-5 text-white">
                    <h3 className="text-xl font-semibold">{upcoming[0].lofts?.name}</h3>
                    <p className="mt-2 text-sm text-white/60">{upcoming[0].lofts?.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-muted-foreground">Check-in</p><p className="mt-1 font-semibold">{formatDate(upcoming[0].check_in, locale)}</p></div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-muted-foreground">Check-out</p><p className="mt-1 font-semibold">{formatDate(upcoming[0].check_out, locale)}</p></div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <StatusBadge status={upcoming[0].status} />
                  </div>
                </div>
              ) : (
                <EmptyState title="Aucun séjour à venir" description="Réservez un loft pour voir votre prochain séjour ici." />
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Mes réservations</CardTitle>
                <p className="text-sm text-muted-foreground">Liste claire et exploitable.</p>
              </div>
              <Link href={`/${locale}/client/bookings`}>
                <Button variant="ghost">Voir tout</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <EmptyState title="Aucune réservation" description="Aucune réservation n’est encore associée à votre compte." />
              ) : (
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-muted-foreground">
                      <tr>
                        <th className="p-4">Loft</th>
                        <th className="p-4">Dates</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bookings.slice(0, 8).map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/80">
                          <td className="p-4">
                            <p className="font-medium">{booking.lofts?.name || "Loft"}</p>
                            <p className="text-xs text-muted-foreground">{booking.lofts?.address}</p>
                          </td>
                          <td className="p-4 text-muted-foreground">{formatDate(booking.check_in, locale)} → {formatDate(booking.check_out, locale)}</td>
                          <td className="p-4"><StatusBadge status={booking.status} /></td>
                          <td className="p-4 text-right font-semibold">{Number(booking.total_price || 0).toLocaleString("fr-DZ")} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ClientDashboardVariants({ bookings, locale, clientName, variant }: DashboardVariantProps) {
  const dashboardBookings = useMemo(() => bookings || [], [bookings])

  // legacy variants
  if (variant === "luxury") return <LuxuryDashboard bookings={dashboardBookings} locale={locale} clientName={clientName} />
  if (variant === "compact") return <CompactDashboard bookings={dashboardBookings} locale={locale} clientName={clientName} />
  if (variant === "executive") return <ExecutiveDashboard bookings={dashboardBookings} locale={locale} clientName={clientName} />

  // new testable variants
  if (variant === "cards" || variant === "master-detail" || variant === "progress") {
    return (
      <ClientDashboardCustomVariants
        bookings={dashboardBookings}
        locale={locale}
        clientName={clientName}
        variant={variant}
      />
    )
  }

  return <ExecutiveDashboard bookings={dashboardBookings} locale={locale} clientName={clientName} />
}

