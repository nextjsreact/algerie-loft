"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  MapPin,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Booking {
  id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  special_requests?: string
  created_at: string
  lofts?: {
    id: string
    name: string
    address: string
  }
  profiles?: {
    id: string
    full_name: string
    email: string
  }
}

interface ReservationsViewProps {
  bookings: Booking[]
  locale: string
  userRole: string
}

export function ReservationsView({ bookings, locale, userRole }: ReservationsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState<string | null>(null)

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.lofts?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { label: "Confirmée", className: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { label: "Annulée", className: "bg-red-100 text-red-800", icon: XCircle },
      completed: { label: "Terminée", className: "bg-blue-100 text-blue-800", icon: CheckCircle }
    }
    const { label, className, icon: Icon } = config[status as keyof typeof config] || config.pending
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setLoading(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error("Erreur")

      toast.success("Statut mis à jour", {
        description: `La réservation a été ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'}`
      })

      router.refresh()
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de mettre à jour le statut"
      })
    } finally {
      setLoading(null)
    }
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Réservations</h1>
        <p className="text-gray-600">Gérez toutes les réservations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-sm text-gray-600">Confirmées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-sm text-gray-600">Annulées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par loft, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
              <option value="completed">Terminées</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">Aucune réservation</h3>
              <p className="text-gray-600">Aucune réservation ne correspond à vos critères</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{booking.lofts?.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.lofts?.address}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Client</p>
                        <p className="font-semibold">{booking.profiles?.full_name || booking.profiles?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dates</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(booking.check_in).toLocaleDateString('fr-FR')} - {new Date(booking.check_out).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Voyageurs</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.guests}
                        </p>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="text-sm">
                        <p className="text-gray-600">Demandes spéciales</p>
                        <p className="text-gray-800">{booking.special_requests}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{booking.total_price.toLocaleString()} DA</p>
                      <p className="text-xs text-gray-600">
                        Créée le {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            disabled={loading === booking.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            disabled={loading === booking.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Annuler
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/${locale}/reservations/${booking.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
