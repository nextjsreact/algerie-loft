"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarIcon, Search, Filter, Download, RefreshCw, Eye,
  MapPin, Phone, Mail, Calendar as CalendarDays, X,
} from "lucide-react"
import { format } from "date-fns"
import { fr, ar, enUS } from "date-fns/locale"
import type { ReservationStatus, ReservationPaymentStatus } from "@/lib/types"

interface ReservationFilters {
  search?: string
  status?: ReservationStatus | "all"
  payment_status?: ReservationPaymentStatus | "all"
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
  guest?: { name: string; email: string; phone: string; total_guests: number }
  dates?: { check_in: string; check_out: string; nights: number }
  pricing?: { total_amount: number; currency: string; breakdown: { base_price: number; cleaning_fee: number; service_fee: number; taxes: number } }
  status: ReservationStatus
  payment_status: ReservationPaymentStatus
  special_requests?: string
  created_at: string
  updated_at: string
}

const gName     = (r: PartnerReservation) => r.guest?.name   || r.guest_name  || "—"
const gEmail    = (r: PartnerReservation) => r.guest?.email  || r.guest_email || "—"
const gPhone    = (r: PartnerReservation) => r.guest?.phone  || r.guest_phone || "—"
const gCount    = (r: PartnerReservation) => r.guest?.total_guests || r.guests || r.guests_count || 1
const pName     = (r: PartnerReservation) => r.property?.name || r.loft_name  || "—"
const pAddr     = (r: PartnerReservation) => r.property?.address || null
const cIn       = (r: PartnerReservation) => r.dates?.check_in  || r.check_in  || ""
const cOut      = (r: PartnerReservation) => r.dates?.check_out || r.check_out || ""
const nNights   = (r: PartnerReservation) => r.dates?.nights || r.nights || 0
const tAmount   = (r: PartnerReservation) => r.pricing?.total_amount || r.total_amount || r.total_price || 0
const tCurrency = (r: PartnerReservation) => r.pricing?.currency || "DZD"
const refCode   = (r: PartnerReservation) => r.confirmation_code || r.booking_reference || r.id

interface PartnerReservationsViewProps {
  partnerId: string
  locale: string
}

export function PartnerReservationsView({ partnerId, locale }: PartnerReservationsViewProps) {
  const t = useTranslations("partner.bookings")
  const dateLocale = locale === "ar" ? ar : locale === "en" ? enUS : fr

  const [reservations, setReservations] = useState<PartnerReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReservationFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<PartnerReservation | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => { fetchReservations() }, [partnerId, filters.status, filters.payment_status, filters.date_from, filters.date_to])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ partnerId })
      if (filters.status && filters.status !== "all") params.set("status", filters.status)
      if (filters.payment_status && filters.payment_status !== "all") params.set("payment_status", filters.payment_status)
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

  const sorted = useMemo(() =>
    [...reservations].sort((a, b) => (cIn(b) || b.created_at || "").localeCompare(cIn(a) || a.created_at || "")),
    [reservations]
  )

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
    const map: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800",
      pending:   "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
      no_show:   "bg-gray-100 text-gray-800",
    }
    return <Badge variant="outline" className={map[status] || ""}>{t(`status.${status}`)}</Badge>
  }

  const paymentBadge = (status: ReservationPaymentStatus) => {
    const map: Record<string, string> = {
      paid:     "bg-green-100 text-green-800",
      partial:  "bg-orange-100 text-orange-800",
      pending:  "bg-yellow-100 text-yellow-800",
      refunded: "bg-blue-100 text-blue-800",
      failed:   "bg-red-100 text-red-800",
    }
    return <Badge variant="outline" className={map[status] || ""}>{t(`paymentStatuses.${status}`)}</Badge>
  }

  const fmtCurrency = (amount: number, curr = "DZD") =>
    amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + curr

  const fmtDate = (d: string) => {
    if (!d) return "—"
    try { return format(new Date(d), "dd MMM yyyy", { locale: dateLocale }) } catch { return d }
  }

  const exportCSV = () => {
    const rows = [
      [t("columns.reference"), t("columns.traveler"), t("detail.phone"), t("detail.email"), t("columns.property"), t("columns.checkIn"), t("columns.checkOut"), t("columns.nights"), t("columns.amount"), t("columns.status"), t("columns.payment")],
      ...filtered.map(r => [refCode(r), gName(r), gPhone(r), gEmail(r), pName(r), cIn(r), cOut(r), String(nNights(r)), String(tAmount(r)), r.status, r.payment_status]),
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
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-gray-500 text-sm">{t("subtitle", { filtered: filtered.length, total: reservations.length, plural: reservations.length > 1 ? "s" : "" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />{t("export")}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReservations}>
            <RefreshCw className="h-4 w-4 mr-2" />{t("refresh")}
          </Button>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("search")}
            value={filters.search || ""}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-10"
          />
        </div>
        <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(v => !v)}>
          <Filter className="h-4 w-4 mr-2" />{t("filters")}
          {hasActiveFilters && <span className="ml-1 bg-white text-primary rounded-full px-1.5 text-xs font-bold">!</span>}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />{t("clearFilters")}
          </Button>
        )}
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">{t("bookingStatus")}</label>
            <Select value={filters.status || "all"} onValueChange={v => setFilters(f => ({ ...f, status: v as ReservationStatus | "all" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("status.pending")}</SelectItem>
                <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                <SelectItem value="completed">{t("status.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                <SelectItem value="no_show">{t("status.no_show")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">{t("paymentStatusLabel")}</label>
            <Select value={filters.payment_status || "all"} onValueChange={v => setFilters(f => ({ ...f, payment_status: v as ReservationPaymentStatus | "all" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allPayments")}</SelectItem>
                <SelectItem value="pending">{t("paymentStatuses.pending")}</SelectItem>
                <SelectItem value="partial">{t("paymentStatuses.partial")}</SelectItem>
                <SelectItem value="paid">{t("paymentStatuses.paid")}</SelectItem>
                <SelectItem value="refunded">{t("paymentStatuses.refunded")}</SelectItem>
                <SelectItem value="failed">{t("paymentStatuses.failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">{t("arrivalPeriod")}</label>
            <Button variant="outline" className="w-full justify-start font-normal" onClick={() => setCalendarOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.date_from && filters.date_to
                ? `${format(filters.date_from, "dd/MM/yy")} – ${format(filters.date_to, "dd/MM/yy")}`
                : filters.date_from
                ? `${t("fromDate")} ${format(filters.date_from, "dd/MM/yy")}`
                : t("selectPeriod")}
            </Button>
          </div>
        </div>
      )}

      {/* Dialog calendrier */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-fit">
          <DialogHeader><DialogTitle>{t("selectPeriod")}</DialogTitle></DialogHeader>
          <Calendar
            mode="range"
            selected={{ from: filters.date_from, to: filters.date_to }}
            onSelect={range => {
              setFilters(f => ({ ...f, date_from: range?.from, date_to: range?.to }))
              if (range?.from && range?.to) setCalendarOpen(false)
            }}
            numberOfMonths={2}
            locale={dateLocale}
          />
          {(filters.date_from || filters.date_to) && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => {
              setFilters(f => ({ ...f, date_from: undefined, date_to: undefined }))
              setCalendarOpen(false)
            }}>
              <X className="h-4 w-4 mr-1" />{t("clearDates")}
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
                  <TableHead>{t("columns.reference")}</TableHead>
                  <TableHead>{t("columns.traveler")}</TableHead>
                  <TableHead>{t("columns.property")}</TableHead>
                  <TableHead>{t("columns.checkIn")}</TableHead>
                  <TableHead>{t("columns.checkOut")}</TableHead>
                  <TableHead>{t("columns.nights")}</TableHead>
                  <TableHead>{t("columns.amount")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.payment")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell><p className="font-medium text-sm">{refCode(r)}</p></TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{gName(r)}</p>
                      {gPhone(r) !== "—" && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{gPhone(r)}</p>}
                      {gEmail(r) !== "—" && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{gEmail(r)}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{pName(r)}</p>
                      {pAddr(r) && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{pAddr(r)}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(cIn(r))}</TableCell>
                    <TableCell className="text-sm">{fmtDate(cOut(r))}</TableCell>
                    <TableCell className="text-sm text-center">{nNights(r)}</TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">{fmtCurrency(tAmount(r), tCurrency(r))}</TableCell>
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
              <p className="font-medium text-gray-600">{t("empty.noResults")}</p>
              <p className="text-sm text-gray-400 mt-1">
                {filters.search || hasActiveFilters ? t("empty.withFilters") : t("empty.noBookings")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("detail.title")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">{t("detail.booking")}</h3>
                  <p><span className="text-gray-500">{t("detail.reference")} :</span> {refCode(selected)}</p>
                  <p className="flex items-center gap-2"><span className="text-gray-500">{t("detail.bookingStatus")} :</span> {statusBadge(selected.status)}</p>
                  <p className="flex items-center gap-2"><span className="text-gray-500">{t("detail.paymentStatus")} :</span> {paymentBadge(selected.payment_status)}</p>
                  <p><span className="text-gray-500">{t("detail.createdAt")} :</span> {fmtDate(selected.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">{t("detail.traveler")}</h3>
                  <p><span className="text-gray-500">{t("detail.name")} :</span> {gName(selected)}</p>
                  <p><span className="text-gray-500">{t("detail.phone")} :</span> {gPhone(selected)}</p>
                  <p><span className="text-gray-500">{t("detail.email")} :</span> {gEmail(selected)}</p>
                  <p><span className="text-gray-500">{t("detail.travelers")} :</span> {gCount(selected)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base">{t("detail.propertyDates")}</h3>
                <p><span className="text-gray-500">{t("detail.property")} :</span> {pName(selected)}</p>
                {pAddr(selected) && <p><span className="text-gray-500">{t("detail.address")} :</span> {pAddr(selected)}</p>}
                <p><span className="text-gray-500">{t("detail.checkIn")} :</span> {fmtDate(cIn(selected))}</p>
                <p><span className="text-gray-500">{t("detail.checkOut")} :</span> {fmtDate(cOut(selected))}</p>
                <p><span className="text-gray-500">{t("detail.duration")} :</span> {nNights(selected)} {nNights(selected) > 1 ? t("detail.nights") : t("detail.night")}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base">{t("detail.pricing")}</h3>
                {selected.pricing?.breakdown && (
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between"><span>{t("detail.basePrice")} :</span><span>{fmtCurrency(selected.pricing.breakdown.base_price, tCurrency(selected))}</span></div>
                    <div className="flex justify-between"><span>{t("detail.cleaningFee")} :</span><span>{fmtCurrency(selected.pricing.breakdown.cleaning_fee, tCurrency(selected))}</span></div>
                    <div className="flex justify-between"><span>{t("detail.serviceFee")} :</span><span>{fmtCurrency(selected.pricing.breakdown.service_fee, tCurrency(selected))}</span></div>
                    <div className="flex justify-between"><span>{t("detail.taxes")} :</span><span>{fmtCurrency(selected.pricing.breakdown.taxes, tCurrency(selected))}</span></div>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>{t("detail.total")} :</span>
                  <span>{fmtCurrency(tAmount(selected), tCurrency(selected))}</span>
                </div>
              </div>

              {selected.special_requests && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">{t("detail.specialRequests")}</h3>
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
