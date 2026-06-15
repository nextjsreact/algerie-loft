"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  Home,
  MapPin,
  MessageSquareHeart,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
  Copy,
  PartyPopper,
  CopyCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function formatDate(value: string, locale: string) {
  if (!value) return "—"
  const currentLocale = locale || "fr"
  return new Date(value).toLocaleDateString(
    currentLocale === "ar" ? "ar-DZ" : currentLocale === "en" ? "en-US" : "fr-FR",
    { day: "numeric", month: "short", year: "numeric" }
  )
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

function ReferralSponsorCard({ locale }: { locale: string }) {
  const [copied, setCopied] = useState(false)
  const referralCode = "HABIB2024" // TODO: wire to API / user profile when available

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-rose-600 text-white">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Parrainez un ami</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Partagez votre code : <b>votre ami bénéficie si ce dernier séjourne chez nous</b>.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-muted-foreground">Votre code</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="truncate rounded-md bg-white px-2.5 py-1 text-sm font-mono font-semibold">
                  {referralCode}
                </code>
              </div>
            </div>

            <Button onClick={copyCode} variant="outline" className="shrink-0">
              {copied ? <CopyCheck className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              const url = `${window.location.origin}/${locale}/client/dashboard?ref=${encodeURIComponent(referralCode)}`
              navigator.clipboard.writeText(url)
            }}
          >
            <PartyPopper className="mr-2 h-4 w-4" /> Inviter
          </Button>
          <Link href={`/${locale}/client/referral`}>
            <Button variant="ghost" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" /> Comment ça marche
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

type CustomVariant = "cards" | "master-detail" | "progress"

export function ClientDashboardCustomVariants({
  bookings,
  locale,
  clientName,
  variant,
}: {
  bookings: any[]
  locale: string
  clientName: string
  variant: CustomVariant
}) {
  if (variant === "cards") {
    return <CardsVariant bookings={bookings} locale={locale} clientName={clientName} />
  }
  if (variant === "master-detail") {
    return <MasterDetailVariant bookings={bookings} locale={locale} clientName={clientName} />
  }
  return <ProgressVariant bookings={bookings} locale={locale} clientName={clientName} />
}

function CardsVariant({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const upcoming = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled" && new Date(b.check_in) >= new Date()),
    [bookings]
  )
  const completed = useMemo(() => bookings.filter((b) => b.status === "completed"), [bookings])

  const nextStay = upcoming[0]
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])
  const referralTitle = "Parrainez un ami"

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600 text-white hover:bg-amber-600">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Dashboard premium
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Bonjour {clientName}</h1>
            <p className="mt-2 text-muted-foreground">Une vue claire : statuts, prochaines étapes, et actions rapides.</p>
          </div>

          <div className="flex gap-2">
            <Link href={`/${locale}/client/search`}>
              <Button>
                <Search className="h-4 w-4 mr-2" /> Réserver
              </Button>
            </Link>
            <Link href={`/${locale}/client/journal-avis`}>
              <Button variant="outline">
                <MessageSquareHeart className="h-4 w-4 mr-2" /> Avis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Séjours", value: bookings.length, icon: Home },
            { label: "À venir", value: upcoming.length, icon: Calendar },
            { label: "Terminés", value: completed.length, icon: CheckCircle2 },
            { label: "Dépensé", value: `${totalSpent.toLocaleString("fr-DZ")} DA`, icon: TrendingUp },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-semibold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div>
                <CardTitle>Prochain séjour</CardTitle>
                <p className="text-sm text-muted-foreground">Tout est prêt pour votre prochaine expérience.</p>
              </div>
            </CardHeader>
            <CardContent>
              {nextStay ? (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-950 p-5 text-white">
                    <h3 className="text-xl font-semibold">{nextStay.lofts?.name}</h3>
                    <p className="mt-2 text-sm text-white/60">{nextStay.lofts?.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="mt-1 font-semibold">{formatDate(nextStay.check_in, locale)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="mt-1 font-semibold">{formatDate(nextStay.check_out, locale)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <StatusBadge status={nextStay.status} />
                  </div>
                </div>
              ) : (
                <EmptyState title="Aucun séjour à venir" description="Réservez un loft pour voir votre prochain séjour ici." />
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ReferralSponsorCard locale={locale} />

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Accès rapide</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href={`/${locale}/client/bookings`}>
                  <Button variant="outline" className="w-full justify-between">
                    Réservations <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/client/profile`}>
                  <Button variant="outline" className="w-full justify-between">
                    Profil <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/client/search`}>
                  <Button variant="outline" className="w-full justify-between">
                    Rechercher <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Mes réservations</CardTitle>
                <p className="text-sm text-muted-foreground">Dernières réservations (aperçu).</p>
              </div>
              <Link href={`/${locale}/client/bookings`}>
                <Button variant="ghost">Voir tout</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <EmptyState title="Aucune réservation" description="Aucune réservation n’est associée à votre compte." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bookings.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="group overflow-hidden rounded-3xl border bg-white transition hover:shadow-lg">
                      <div className="relative h-36 bg-slate-100">
                        {booking.lofts?.loft_photos?.[0]?.url ? (
                          <Image
                            src={booking.lofts.loft_photos[0].url}
                            alt={booking.lofts?.name || ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <Home className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3">
                          <StatusBadge status={booking.status} />
                        </div>
                      </div>
                      <div className="space-y-3 p-5">
                        <div>
                          <h3 className="font-semibold">{booking.lofts?.name || "Loft"}</h3>
                          <p className="mt-1 flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-3.5 w-3.5" />
                            {booking.lofts?.address}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>{formatDate(booking.check_in, locale)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{formatDate(booking.check_out, locale)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-3 text-sm">
                          <span className="text-muted-foreground">{getNights(booking.check_in, booking.check_out) || "—"} nuits</span>
                          <span className="font-semibold">
                            {Number(booking.total_price || 0).toLocaleString("fr-DZ")} DA
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MasterDetailVariant({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(bookings[0]?.id ?? null)

  const upcoming = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled").sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    [bookings]
  )

  const selected = bookings.find((b) => b.id === selectedId) || upcoming[0]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Master-Detail
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold">Bonjour {clientName}</h1>
            <p className="mt-2 text-muted-foreground">Choisissez une réservation pour voir le détail.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/client/search`}>
              <Button>
                <Search className="h-4 w-4 mr-2" /> Réserver
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Réservations</CardTitle>
                <p className="text-sm text-muted-foreground">Triées par activité.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {bookings.length === 0 ? (
                  <EmptyState title="Aucune réservation" description="Réservez votre premier loft pour activer cette vue." />
                ) : (
                  upcoming.slice(0, 10).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className={
                        "w-full rounded-2xl border px-4 py-3 text-left transition " +
                        (b.id === selected?.id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-slate-50")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{b.lofts?.name || "Loft"}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {b.lofts?.address}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {formatDate(b.check_in, locale)} → {formatDate(b.check_out, locale)}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="sticky top-6">
              <ReferralSponsorCard locale={locale} />
            </div>
          </div>

          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Détail</CardTitle>
                  <p className="text-sm text-muted-foreground">Infos essentielles & prochaine étape.</p>
                </div>
                {selected ? (
                  <Link href={`/${locale}/client/bookings/${selected.id}`}>
                    <Button variant="ghost">Voir</Button>
                  </Link>
                ) : null}
              </CardHeader>
              <CardContent>
                {!selected ? (
                  <EmptyState title="Aucune sélection" description="Sélectionnez une réservation dans la liste." />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-3xl bg-slate-950 p-6 text-white">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold">{selected.lofts?.name || "Séjour"}</h2>
                          <p className="mt-2 text-sm text-white/60">{selected.lofts?.address}</p>
                        </div>
                        <StatusBadge status={selected.status} />
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-[11px] uppercase tracking-widest text-white/50">Check-in</p>
                          <p className="mt-1 font-semibold">{formatDate(selected.check_in, locale)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-[11px] uppercase tracking-widest text-white/50">Check-out</p>
                          <p className="mt-1 font-semibold">{formatDate(selected.check_out, locale)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-[11px] uppercase tracking-widest text-white/50">Durée</p>
                          <p className="mt-1 font-semibold">{getNights(selected.check_in, selected.check_out) || "—"} nuits</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border bg-white p-5">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">Assistance & concierge</div>
                          <div className="text-xs text-muted-foreground">Besoin d’aide pour votre séjour ?</div>
                        </div>
                      </div>
                      <Button variant="outline" asChild>
                        <Link href={`/${locale}/client/support`}>Contacter</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressVariant({ bookings, locale, clientName }: { bookings: any[]; locale: string; clientName: string }) {
  const totalSpent = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings])
  const completedCount = useMemo(() => bookings.filter((b) => b.status === "completed").length, [bookings])

  const progressPct = useMemo(() => {
    // simple heuristic: 0..100 based on completed stays
    return Math.min(100, (completedCount / 5) * 100)
  }, [completedCount])

  const tasks = [
    { label: "Préparer vos préférences", done: completedCount >= 1 },
    { label: "Vérifier les dates de votre prochain séjour", done: bookings.some((b) => b.status !== "cancelled" && new Date(b.check_in) >= new Date()) },
    { label: "Rédiger un avis après votre séjour", done: completedCount >= 2 },
    { label: "Inviter un ami avec votre code", done: false },
  ]

  const nextStay = bookings.find((b) => b.status !== "cancelled" && new Date(b.check_in) >= new Date())

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Progress & Tasks
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold">Bonjour {clientName}</h1>
            <p className="mt-2 text-muted-foreground">Votre prochaine action, toujours à portée de clic.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/client/search`}>
              <Button>
                <Search className="h-4 w-4 mr-2" /> Réserver
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Prochaine action recommandée</CardTitle>
                <p className="text-sm text-muted-foreground">Concentrez-vous sur 1 objectif.</p>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl bg-slate-950 p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-white/60">Étape actuelle</div>
                      <h2 className="mt-2 text-2xl font-semibold">
                        {nextStay ? "Vérifiez votre prochain séjour" : "Réservez votre prochain séjour"}
                      </h2>
                      <p className="mt-3 text-sm text-white/70">
                        {nextStay
                          ? `Dates : ${formatDate(nextStay.check_in, locale)} → ${formatDate(nextStay.check_out, locale)}`
                          : "Choisissez un loft et finalisez votre réservation."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={`/${locale}/client/bookings${nextStay ? `/${nextStay.id}` : ""}`}>
                      <Button className="bg-white text-slate-950 hover:bg-white/90">
                        Voir détails
                      </Button>
                    </Link>
                    <Link href={`/${locale}/client/search`}>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Réserver
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Progression</div>
                    <div className="text-sm text-muted-foreground">{Math.round(progressPct)}%</div>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <p className="text-sm text-muted-foreground">Cochez au fur et à mesure.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-2xl border bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className={"flex h-10 w-10 items-center justify-center rounded-2xl " + (t.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600")}>
                          {t.done ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.done ? "Terminé" : "À faire"}</div>
                        </div>
                      </div>
                      {idx === 3 ? (
                        <Button variant="outline" asChild>
                          <Link href={`/${locale}/client/dashboard?variant=progress`}>
                            Parainer
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <ReferralSponsorCard locale={locale} />

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-muted-foreground">Séjours</div>
                    <div className="mt-1 text-2xl font-semibold">{bookings.length}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-muted-foreground">Terminé</div>
                    <div className="mt-1 text-2xl font-semibold">{completedCount}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Dépensé</div>
                        <div className="mt-1 text-2xl font-semibold">{totalSpent.toLocaleString("fr-DZ")} DA</div>
                      </div>
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

