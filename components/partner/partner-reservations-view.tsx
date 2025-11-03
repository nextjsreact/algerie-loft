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
  Clock,
  DollarSign
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
  confirmation_code: string
  booking_reference: string
  property: {
    id: string
    name: string
    address: string
  }
  guest: {
    name: string
    email: string
    phone: string
    total_guests: number
    adults: number
    children: number
  }
  dates: {
    check_in: string
    check_out: string
    nights: number
  }
  pricing: {
    total_amount: number
    currency: string
    breakdown: {
      base_price: number
      cleaning_fee: number
      service_fee: number
      taxes: number
    }
  }
  status: ReservationStatus
  payment_status: ReservationPaymentStatus
  special_requests?: string
  created_at: string
  updated_at: string
}

interface PartnerReservationsViewProps {
  partnerId: string
}

export function PartnerReservationsView({ partnerId }: PartnerReservationsViewProps) {
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
        setReservations(data.reservations)
      } else {
        // Fallback to mock data
        setReservations(getMockReservations())
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
      setReservations(getMockReservations())
    } finally {
      setLoading(false)
    }
  }

  const getMockReservations = (): PartnerReservation[] => [
    {
      id: '1',
      confirmation_code: 'LFT-2024-001',
      booking_reference: 'BK-001-2024',
      property: {
        id: '1',
        name: 'Luxury Downtown Loft',
        address: '123 Main Street, Algiers'
      },
      guest: {
        name: 'Ahmed Benali',
        email: 'ahmed.benali@email.com',
        phone: '+213 555 123 456',
        total_guests: 2,
        adults: 2,
        children: 0
      },
      dates: {
        check_in: '2024-12-15',
        check_out: '2024-12-20',
        nights: 5
      },
      pricing: {
        total_amount: 40000,
        currency: 'DZD',
        breakdown: {
          base_price: 35000,
          cleaning_fee: 2000,
          service_fee: 2000,
          taxes: 1000
        }
      },
      status: 'confirmed',
      payment_status: 'paid',
      special_requests: 'Late check-in requested',
      created_at: '2024-11-01T10:00:00Z',
      updated_at: '2024-11-01T10:00:00Z'
    },
    {
      id: '2',
      confirmation_code: 'LFT-2024-002',
      booking_reference: 'BK-002-2024',
      property: {
        id: '2',
        name: 'Cozy Studio Apartment',
        address: '456 Oak Avenue, Oran'
      },
      guest: {
        name: 'Sarah Dubois',
        email: 'sarah.dubois@email.com',
        phone: '+33 6 12 34 56 78',
        total_guests: 1,
        adults: 1,
        children: 0
      },
      dates: {
        check_in: '2024-12-10',
        check_out: '2024-12-13',
        nights: 3
      },
      pricing: {
        total_amount: 15000,
        currency: 'DZD',
        breakdown: {
          base_price: 13500,
          cleaning_fee: 1000,
          service_fee: 500,
          taxes: 0
        }
      },
      status: 'pending',
      payment_status: 'pending',
      created_at: '2024-11-02T14:30:00Z',
      updated_at: '2024-11-02T14:30:00Z'
    },
    {
      id: '3',
      confirmation_code: 'LFT-2024-003',
      booking_reference: 'BK-003-2024',
      property: {
        id: '3',
        name: 'Family Villa with Garden',
        address: '789 Garden Street, Constantine'
      },
      guest: {
        name: 'Mohamed Khelifi',
        email: 'mohamed.khelifi@email.com',
        phone: '+213 661 789 012',
        total_guests: 6,
        adults: 4,
        children: 2
      },
      dates: {
        check_in: '2024-12-22',
        check_out: '2024-12-28',
        nights: 6
      },
      pricing: {
        total_amount: 72000,
        currency: 'DZD',
        breakdown: {
          base_price: 66000,
          cleaning_fee: 3000,
          service_fee: 2000,
          taxes: 1000
        }
      },
      status: 'confirmed',
      payment_status: 'partial',
      special_requests: 'Baby crib needed, vegetarian meals preferred',
      created_at: '2024-10-28T09:15:00Z',
      updated_at: '2024-11-01T16:45:00Z'
    }
  ]

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'no_show':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">No Show</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPaymentStatusBadge = (status: ReservationPaymentStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Partial</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'refunded':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Refunded</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const exportReservations = () => {
    const csvContent = [
      ['Confirmation Code', 'Guest Name', 'Property', 'Check-in', 'Check-out', 'Guests', 'Total Amount', 'Status', 'Payment Status'],
      ...reservations.map(reservation => [
        reservation.confirmation_code,
        reservation.guest.name,
        reservation.property.name,
        reservation.dates.check_in,
        reservation.dates.check_out,
        reservation.guest.total_guests.toString(),
        reservation.pricing.total_amount.toString(),
        reservation.status,
        reservation.payment_status
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

  const filteredReservations = reservations.filter(reservation => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!reservation.confirmation_code.toLowerCase().includes(searchLower) &&
          !reservation.guest.name.toLowerCase().includes(searchLower) &&
          !reservation.property.name.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    
    if (filters.status && filters.status !== 'all') {
      if (reservation.status !== filters.status) return false
    }
    
    if (filters.payment_status && filters.payment_status !== 'all') {
      if (reservation.payment_status !== filters.payment_status) return false
    }
    
    if (filters.property_id && filters.property_id !== 'all') {
      if (reservation.property.id !== filters.property_id) return false
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
          <p className="text-gray-600">
            {filteredReservations.length} of {reservations.length} reservations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportReservations}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReservations}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by confirmation code, guest name, or property..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value as ReservationStatus | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.payment_status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, payment_status: value as ReservationPaymentStatus | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
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
                  {filters.date_from && filters.date_to ? (
                    `${format(filters.date_from, 'MMM dd')} - ${format(filters.date_to, 'MMM dd')}`
                  ) : (
                    'Date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: filters.date_from, to: filters.date_to }}
                  onSelect={(range) => {
                    setFilters({ 
                      ...filters, 
                      date_from: range?.from, 
                      date_to: range?.to 
                    })
                    if (range?.from && range?.to) {
                      setCalendarOpen(false)
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Reservations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmation</TableHead>
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
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.confirmation_code}</p>
                        <p className="text-xs text-gray-500">{reservation.booking_reference}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.guest.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {reservation.guest.email}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {reservation.guest.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.property.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {reservation.property.address}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(reservation.dates.check_in), 'MMM dd')} - 
                          {format(new Date(reservation.dates.check_out), 'MMM dd')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.dates.nights} nights
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-sm">
                          {reservation.guest.total_guests}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({reservation.guest.adults}A, {reservation.guest.children}C)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(reservation.pricing.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.pricing.currency}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(reservation.payment_status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
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
                  : 'You don\'t have any reservations yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reservation Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReservation(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Booking Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Confirmation:</strong> {selectedReservation.confirmation_code}</p>
                    <p><strong>Reference:</strong> {selectedReservation.booking_reference}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedReservation.status)}</p>
                    <p><strong>Payment:</strong> {getPaymentStatusBadge(selectedReservation.payment_status)}</p>
                    <p><strong>Created:</strong> {format(new Date(selectedReservation.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Guest Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedReservation.guest.name}</p>
                    <p><strong>Email:</strong> {selectedReservation.guest.email}</p>
                    <p><strong>Phone:</strong> {selectedReservation.guest.phone}</p>
                    <p><strong>Guests:</strong> {selectedReservation.guest.total_guests} ({selectedReservation.guest.adults} adults, {selectedReservation.guest.children} children)</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Property & Dates</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Property:</strong> {selectedReservation.property.name}</p>
                  <p><strong>Address:</strong> {selectedReservation.property.address}</p>
                  <p><strong>Check-in:</strong> {format(new Date(selectedReservation.dates.check_in), 'EEEE, MMM dd, yyyy')}</p>
                  <p><strong>Check-out:</strong> {format(new Date(selectedReservation.dates.check_out), 'EEEE, MMM dd, yyyy')}</p>
                  <p><strong>Duration:</strong> {selectedReservation.dates.nights} nights</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Pricing Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{formatCurrency(selectedReservation.pricing.breakdown.base_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning Fee:</span>
                    <span>{formatCurrency(selectedReservation.pricing.breakdown.cleaning_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee:</span>
                    <span>{formatCurrency(selectedReservation.pricing.breakdown.service_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>{formatCurrency(selectedReservation.pricing.breakdown.taxes)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedReservation.pricing.total_amount)}</span>
                  </div>
                </div>
              </div>
              
              {selectedReservation.special_requests && (
                <div>
                  <h3 className="font-semibold mb-3">Special Requests</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedReservation.special_requests}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}