"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarIcon,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarDays,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { ReservationStatus, ReservationPaymentStatus } from "@/lib/types"

interface ReservationFilters {
  search?: string
  status?: ReservationStatus | "all"
  payment_status?: ReservationPaymentStatus | "all"
  property_id?: string | "all"
  date_from?: Date
  date_to?: Date
}

interface PartnerReservation {
  id: string
  booking_reference: string
  confirmation_code?: string
  loft_id?: string
  loft_name?: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  check_in?: string
  check_out?: string
  nights?: number
  guests?: number
  guests_count?: number
  total_amount?: number
  total_price?: number
  property?: { id: string; name: string; address: string }
  guest?: { name: string; email: string; phone: string; total_guests: number; adults: number; children: number }
  dates?: { check_in: string; check_out: string; nights: number }
  pricing?: { total_amount: number; currency: string; breakdown: { base_price: number; cleaning_fee: number; service_fee: number; taxes: number } }
  status: ReservationStatus
  payment_status: ReservationPaymentStatus
  special_requests?: string
  created_at: string
  updated_at: string
}

// Normalisation des deux structures (API plate vs mock imbriqué)
const gName  = (r: PartnerReservation) => r.guest?.name  || r.guest_name  || "—"
const gEmail = (r: PartnerReservation) => r.guest?.email || r.guest_email || "—"
const gPhone = (r: PartnerReservation) => r.guest?.phone || r.guest_phone || "—"
const gCount = (r: PartnerReservation) => r.guest?.total_guests || r.guests || r.guests_count || 1
const pName  = (r: PartnerReservation) => r.property?.name || r.loft_name || "—"
const pAddr  = (r: PartnerReservation) => r.property?.address || null
const cIn    = (r: PartnerReservation) => r.dates?.check_in  || r.check_in  || ""
const cOut   = (r: PartnerReservation) => r.dates?.check_out || r.check_out || ""
const nNights = (r: PartnerReservation) => r.dates?.nights || r.nights || 0
const tAmount = (r: PartnerReservation) => r.pricing?.total_amount || r.total_amount || r.total_price || 0
const tCurrency = (r: PartnerReservation) => r.pricing?.currency || "DZD"
const refCode = (r: PartnerReservation) => r.confirmation_code || r.booking_reference || r.id

interface PartnerReservationsViewProps {
  partnerId: string
  locale: string
}

export function PartnerReservationsView({ partnerId, locale }: PartnerReservationsViewProps) {
  const [reservations, setReservations] = useState<PartnerReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReservationFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<PartnerReservation | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => { fetchReservations() }, [partnerId, filters])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ partnerId })
      if (filters.status && filters.status !== "all") params.set("status", filters.status)
      if (filters.payment_status && filters.payment_status !== "all") params.set("payment_status", filters.payment_status)
      if (filters.property_id && filters.property_id !== "all") params.set("property_id", filters.property_id)
      if (filters.date_from) params.set("date_from", format(filters.date_from, "yyyy-MM-dd"))
      if (filters.date_to)   params.set("date_to",   format(filters.date_to,   "yyyy-MM-dd"))

      const res = await fetch(`/api/partner/reservations?${params}`)
      if (res.ok) {
        const data = await res.json()
        const list = data?.data?.reservations || data?.data?.bookings || data?.reservations || []
        setReservations(Array.isArray(list) ? list : [])
      } else {
        setReservations([])
      }
    } catch {
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  // Tri par date check_in décroissante (plus récente en premier)
  const sorted = useMemo(() =>
    [...reservations].sort((a, b) => {
      const da = cIn(a) || a.created_at || ""
      const db = cIn(b) || b.created_at || ""
      return db.localeCompare(da)
    }),
    [reservations]
  )

  // Filtre côté client : recherche par nom, email, téléphone, code
  const filtered = useMemo(() => {
    if (!filters.search) return sorted
    const s = filters.search.toLowerCase()
    return sorted.filter(r =>
      gName(r).toLowerCase().includes(s)  ||
      gEmail(r).toLowerCase().includes(s) ||
      gPhone(r).toLowerCase().includes(s) ||
      refCode(r).toLowerCase().includes(s)||
      pName(r).toLowerCase().includes(s)
    )
  }, [sorted, filters.search])

  const statusBadge = (status: ReservationStatus) => {
    const map: Record<string, { label: string; className: string }> = {
      confirmed: { label: "Confirmée",   className: "bg-green-100 text-green-800" },
      pending:   { label: "En attente",  className: "bg-yellow-100 text-yellow-800" },
      cancelled: { label: "Annulée",     className: "bg-red-100 text-red-800" },
      completed: { label: "Terminée",    className: "bg-blue-100 text-blue-800" },
      no_show:   { label: "Non présenté",className: "bg-gray-100 text-gray-800" },
    }
    const s = map[status] || { label: status, className: "" }
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>
  }

  const paymentBadge = (status: ReservationPaymentStatus) => {
    const map: Record<string, { label: string; className: string }> = {
      paid:     { label: "Payée",        className: "bg-green-100 text-green-800" },
      partial:  { label: "Partiel",      className: "bg-orange-100 text-orange-800" },
      pending:  { label: "En attente",   className: "bg-yellow-100 text-yellow-800" },
      refunded: { label: "Remboursée",   className: "bg-blue-100 text-blue-800" },
      failed:   { label: "Échoué",       className: "bg-red-100 text-red-800" },
    }
    const s = map[status] || { label: status, className: "" }
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>
  }

  const fmtCurrency = (amount: number, curr = "DZD") =>
    amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + curr

  const fmtDate = (d: string) => {
    if (!d) return "—"
    try { return format(new Date(d), "dd MMM yyyy", { locale: fr }) } catch { return d }
  }

  const exportCSV = () => {
    const rows = [
      ["Référence", "Voyageur", "Téléphone", "Email", "Propriété", "Arrivée", "Départ", "Nuits", "Voyageurs", "Montant", "Statut", "Paiement"],
      ...filtered.map(r => [
        refCode(r), gName(r), gPhone(r), gEmail(r), pName(r),
        cIn(r), cOut(r), String(nNights(r)), String(gCount(r)),
        String(tAmount(r)), r.status, r.payment_status,
      ]),
    ].map(row => row.map(v => `"${v}"`).join(",")).join("\n")

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservations-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => setFilters({})
  const hasActiveFilters = filters.status || filters.payment_status || filters.date_from || filters.date_to

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Réservations</h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} sur {reservations.length} réservation{reservations.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReservations}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualiser
          </Button>
        </div>
      </div>

      {/* Barre de recherche + bouton filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, téléphone, email, référence..."
            value={filters.search || ""}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(v => !v)}
          className="sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
          {hasActiveFilters && <span className="ml-1 bg-white text-primary rounded-full px-1.5 text-xs font-bold">!</span>}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />Effacer
          </Button>
        )}
      </div>

      {/* Panneau de filtres avancés */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          {/* Statut réservation */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Statut réservation</label>
            <Select
              value={filters.status || "all"}
              onValueChange={v => setFilters(f => ({ ...f, status: v as ReservationStatus | "all" }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="no_show">Non présenté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statut paiement */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Statut paiement</label>
            <Select
              value={filters.payment_status || "all"}
              onValueChange={v => setFilters(f => ({ ...f, payment_status: v as ReservationPaymentStatus | "all" }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par dates — calendrier centré via Dialog */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Période d&apos;arrivée</label>
            <Button
              variant="outline"
              className="w-full justify-start font-normal"
              onClick={() => setCalendarOpen(true)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.date_from && filters.date_to
                ? `${format(filters.date_from, "dd/MM/yy")} – ${format(filters.date_to, "dd/MM/yy")}`
                : filters.date_from
                ? `À partir du ${format(filters.date_from, "dd/MM/yy")}`
                : "Sélectionner une période"}
            </Button>
          </div>
        </div>
      )}

      {/* Dialog calendrier centré */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Sélectionner une période</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="range"
            selected={{ from: filters.date_from, to: filters.date_to }}
            onSelect={range => {
              setFilters(f => ({ ...f, date_from: range?.from, date_to: range?.to }))
              if (range?.from && range?.to) setCalendarOpen(false)
            }}
            numberOfMonths={2}
            locale={fr}
          />
          {(filters.date_from || filters.date_to) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setFilters(f => ({ ...f, date_from: undefined, date_to: undefined }))
                setCalendarOpen(false)
              }}
            >
              <X className="h-4 w-4 mr-1" />Effacer les dates
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Voyageur</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Arrivée ↓</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Nuits</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell>
                      <p className="font-medium text-sm">{refCode(r)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{gName(r)}</p>
                      {gPhone(r) !== "—" && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{gPhone(r)}
                        </p>
                      )}
                      {gEmail(r) !== "—" && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />{gEmail(r)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{pName(r)}</p>
                      {pAddr(r) && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{pAddr(r)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(cIn(r))}</TableCell>
                    <TableCell className="text-sm">{fmtDate(cOut(r))}</TableCell>
                    <TableCell className="text-sm text-center">{nNights(r)}</TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {fmtCurrency(tAmount(r), tCurrency(r))}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell>{paymentBadge(r.payment_status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-600">Aucune réservation trouvée</p>
              <p className="text-sm text-gray-400 mt-1">
                {filters.search || hasActiveFilters
                  ? "Essayez d'ajuster vos filtres."
                  : "Vous n'avez pas encore de réservations."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail réservation */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail de la réservation</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Infos réservation */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">Réservation</h3>
                  <p><span className="text-gray-500">Référence :</span> {refCode(selected)}</p>
                  <p className="flex items-center gap-2"><span className="text-gray-500">Statut :</span> {statusBadge(selected.status)}</p>
                  <p className="flex items-center gap-2"><span className="text-gray-500">Paiement :</span> {paymentBadge(selected.payment_status)}</p>
                  <p><span className="text-gray-500">Créée le :</span> {fmtDate(selected.created_at)}</p>
                </div>

                {/* Infos voyageur */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">Voyageur</h3>
                  <p><span className="text-gray-500">Nom :</span> {gName(selected)}</p>
                  <p><span className="text-gray-500">Téléphone :</span> {gPhone(selected)}</p>
                  <p><span className="text-gray-500">Email :</span> {gEmail(selected)}</p>
                  <p><span className="text-gray-500">Voyageurs :</span> {gCount(selected)}</p>
                </div>
              </div>

              {/* Propriété & dates */}
              <div className="space-y-2">
                <h3 className="font-semibold text-base">Propriété & Dates</h3>
                <p><span className="text-gray-500">Propriété :</span> {pName(selected)}</p>
                {pAddr(selected) && <p><span className="text-gray-500">Adresse :</span> {pAddr(selected)}</p>}
                <p><span className="text-gray-500">Arrivée :</span> {fmtDate(cIn(selected))}</p>
                <p><span className="text-gray-500">Départ :</span> {fmtDate(cOut(selected))}</p>
                <p><span className="text-gray-500">Durée :</span> {nNights(selected)} nuit{nNights(selected) > 1 ? "s" : ""}</p>
              </div>

              {/* Prix */}
              <div className="space-y-2">
                <h3 className="font-semibold text-base">Tarification</h3>
                {selected.pricing?.breakdown && (
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between"><span>Prix de base :</span><span>{fmtCurrency(selected.pricing.breakdown.base_price, tCurrency(selected))}</span></div>
                    <div className="flex justify-between"><span>Frais de ménage :</span><span>{fmtCurrency(selected.pricing.breakdown.cleaning_fee, tCurrency(selected))}</span></div>
                    <div className="flex justify-between"><span>Frais de service :</span><span>{fmtCurrency(selected.pricing.breakdown.service_fee, tCurrency(selected))}</span></div>
                    <div className="flex justify-between"><span>Taxes :</span><span>{fmtCurrency(selected.pricing.breakdown.taxes, tCurrency(selected))}</span></div>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total :</span>
                  <span>{fmtCurrency(tAmount(selected), tCurrency(selected))}</span>
                </div>
              </div>

              {/* Demandes spéciales */}
              {selected.special_requests && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Demandes spéciales</h3>
                  <p className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-gray-600">{selected.special_requests}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
