"use client"

import { useState, useEffect } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
} from "lucide-react"
import { format } from "date-fns"
import type { ReservationStatus, ReservationPaymentStatus } from "@/lib/types"

interface ReservationFilters {
  search?: string
  status?: ReservationStatus | 'all'
  payment_status?: ReservationPaymentStatus | 'all'
  property_id?: string | 'all'
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

// Helpers to normalize both API and mock data shapes
const guestName = (r: PartnerReservation) => r.guest?.name || r.guest_name || '—'
const guestEmail = (r: PartnerReservation) => r.guest?.email || r.guest_email || '—'
const guestPhone = (r: PartnerReservation) => r.guest?.phone || r.guest_phone || '—'
const guestCount = (r: PartnerReservation) => r.guest?.total_guests || r.guests || r.guests_count || 1
const propName = (r: PartnerReservation) => r.property?.name || r.loft_name || '—'
const propAddress = (r: PartnerReservation) => r.property?.address || null
const checkIn = (r: PartnerReservation) => r.dates?.check_in || r.check_in || ''
const checkOut = (r: PartnerReservation) => r.dates?.check_out || r.check_out || ''
const nightsCount = (r: PartnerReservation) => r.dates?.nights || r.nights || 0
const totalAmount = (r: PartnerReservation) => r.pricing?.total_amount || r.total_amount || r.total_price || 0
const currency = (r: PartnerReservation) => r.pricing?.currency || 'DZD'
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
  const [selectedReservation, setSelectedReservation] = useState<PartnerReservation | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    fetchReservations()
  }, [partnerId, filters])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        partnerId,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== 'all')
        )
      })

      const response = await fetch(`/api/partner/reservations?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        const list = data?.data?.reservations || data?.data?.bookings || data?.reservations || []
        setReservations(Array.isArray(list) ? list : [])
      } else {
        setReservations([])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed': return <Badge variant="default" className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      case 'completed': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'no_show': return <Badge variant="destructive" className="bg-red-100 text-red-800">No Show</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPaymentStatusBadge = (status: ReservationPaymentStatus) => {
    switch (status) {
      case 'paid': return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      case 'partial': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Partial</Badge>
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'refunded': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Refunded</Badge>
      case 'failed': return <Badge variant="destructive">Failed</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number, curr: string = 'DZD') =>
    amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + curr

  const exportReservations = () => {
    const csvContent = [
      ['Reference', 'Guest Name', 'Property', 'Check-in', 'Check-out', 'Guests', 'Total Amount', 'Status', 'Payment Status'],
      ...reservations.map(r => [
        refCode(r),
        guestName(r),
        propName(r),
        checkIn(r),
        checkOut(r),
        guestCount(r).toString(),
        totalAmount(r).toString(),
        r.status,
        r.payment_status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredReservations = (reservations || []).filter(r => {
    if (filters.search) {
      const s = filters.search.toLowerCase()
      if (!refCode(r).toLowerCase().includes(s) &&
          !guestName(r).toLowerCase().includes(s) &&
          !propName(r).toLowerCase().includes(s)) return false
    }
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false
    if (filters.payment_status && filters.payment_status !== 'all' && r.payment_status !== filters.payment_status) return false
    if (filters.property_id && filters.property_id !== 'all') {
      const pid = r.property?.id || r.loft_id
      if (pid !== filters.property_id) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-gray-600">{filteredReservations.length} of {reservations.length} reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportReservations}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReservations}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by reference, guest name, or property..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v as ReservationStatus | 'all' })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.payment_status || 'all'} onValueChange={(v) => setFilters({ ...filters, payment_status: v as ReservationPaymentStatus | 'all' })}>
              <SelectTrigger><SelectValue placeholder="Payment Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_from && filters.date_to
                    ? `${format(filters.date_from, 'MMM dd')} - ${format(filters.date_to, 'MMM dd')}`
                    : 'Date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: filters.date_from, to: filters.date_to }}
                  onSelect={(range) => {
                    setFilters({ ...filters, date_from: range?.from, date_to: range?.to })
                    if (range?.from && range?.to) setCalendarOpen(false)
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={() => setFilters({})} className="w-full">Clear Filters</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{refCode(r)}</p>
                      <p className="text-xs text-gray-500">{r.booking_reference}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{guestName(r)}</p>
                      <p className="text-xs text-gray-500 flex items-center"><Mail className="h-3 w-3 mr-1" />{guestEmail(r)}</p>
                      <p className="text-xs text-gray-500 flex items-center"><Phone className="h-3 w-3 mr-1" />{guestPhone(r)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{propName(r)}</p>
                      {propAddress(r) && <p className="text-xs text-gray-500 flex items-center"><MapPin className="h-3 w-3 mr-1" />{propAddress(r)}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {checkIn(r) ? format(new Date(checkIn(r)), 'MMM dd') : '—'} - {checkOut(r) ? format(new Date(checkOut(r)), 'MMM dd') : '—'}
                      </p>
                      <p className="text-xs text-gray-500">{nightsCount(r)} nights</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-sm">{guestCount(r)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatCurrency(totalAmount(r), currency(r))}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(r.payment_status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedReservation(r)}>
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReservations.length === 0 && (
            <div className="p-8 text-center">
              <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reservations found</h3>
              <p className="text-gray-600">
                {filters.search || filters.status !== 'all' || filters.payment_status !== 'all'
                  ? 'Try adjusting your filters to see more reservations.'
                  : "You don't have any reservations yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reservation Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReservation(null)}>×</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Booking Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Reference:</strong> {refCode(selectedReservation)}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedReservation.status)}</p>
                    <p><strong>Payment:</strong> {getPaymentStatusBadge(selectedReservation.payment_status)}</p>
                    <p><strong>Created:</strong> {format(new Date(selectedReservation.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Guest Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {guestName(selectedReservation)}</p>
                    <p><strong>Email:</strong> {guestEmail(selectedReservation)}</p>
                    <p><strong>Phone:</strong> {guestPhone(selectedReservation)}</p>
                    <p><strong>Guests:</strong> {guestCount(selectedReservation)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Property & Dates</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Property:</strong> {propName(selectedReservation)}</p>
                  {propAddress(selectedReservation) && <p><strong>Address:</strong> {propAddress(selectedReservation)}</p>}
                  {checkIn(selectedReservation) && <p><strong>Check-in:</strong> {format(new Date(checkIn(selectedReservation)), 'EEEE, MMM dd, yyyy')}</p>}
                  {checkOut(selectedReservation) && <p><strong>Check-out:</strong> {format(new Date(checkOut(selectedReservation)), 'EEEE, MMM dd, yyyy')}</p>}
                  <p><strong>Duration:</strong> {nightsCount(selectedReservation)} nights</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="space-y-2 text-sm">
                  {selectedReservation.pricing?.breakdown && (
                    <>
                      <div className="flex justify-between"><span>Base Price:</span><span>{formatCurrency(selectedReservation.pricing.breakdown.base_price, currency(selectedReservation))}</span></div>
                      <div className="flex justify-between"><span>Cleaning Fee:</span><span>{formatCurrency(selectedReservation.pricing.breakdown.cleaning_fee, currency(selectedReservation))}</span></div>
                      <div className="flex justify-between"><span>Service Fee:</span><span>{formatCurrency(selectedReservation.pricing.breakdown.service_fee, currency(selectedReservation))}</span></div>
                      <div className="flex justify-between"><span>Taxes:</span><span>{formatCurrency(selectedReservation.pricing.breakdown.taxes, currency(selectedReservation))}</span></div>
                    </>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount(selectedReservation), currency(selectedReservation))}</span>
                  </div>
                </div>
              </div>

              {selectedReservation.special_requests && (
                <div>
                  <h3 className="font-semibold mb-3">Special Requests</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedReservation.special_requests}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
