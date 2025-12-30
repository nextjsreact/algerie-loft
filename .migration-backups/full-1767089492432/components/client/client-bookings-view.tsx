"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
    loft_photos?: Array<{
      url: string
      order_index?: number
    }>
  }
}

interface ClientBookingsViewProps {
  bookings: Booking[]
  locale: string
}

export function ClientBookingsView({ bookings, locale }: ClientBookingsViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upcoming")

  const now = new Date()
  const upcomingBookings = bookings.filter(b => 
    new Date(b.check_in) >= now && (b.status === 'pending' || b.status === 'confirmed')
  )
  const pastBookings = bookings.filter(b => 
    new Date(b.check_out) < now || b.status === 'completed' || b.status === 'cancelled'
  )

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

  const getBestPhoto = (loft: Booking['lofts']) => {
    if (!loft?.loft_photos || loft.loft_photos.length === 0) return null
    return loft.loft_photos.sort((a, b) => (a.order_index || 999) - (b.order_index || 999))[0]
  }

  const renderBookingCard = (booking: Booking) => {
    const bestPhoto = getBestPhoto(booking.lofts)
    const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))

    return (
      <Card key={booking.id} className="overflow-hidden hover:shadow-xl transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="relative h-48 md:h-auto md:w-64 flex-shrink-0">
            {bestPhoto?.url ? (
              <Image
                src={bestPhoto.url}
                alt={booking.lofts?.name || ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-gray-400" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          <CardContent className="flex-1 p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-2">{booking.lofts?.name}</h3>
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.lofts?.address}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Arrivée</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.check_in).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Départ</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.check_out).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Voyageurs</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {booking.guests}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Durée</p>
                    <p className="font-semibold">{nights} nuit{nights > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {booking.special_requests && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600">Demandes spéciales</p>
                    <p className="text-sm text-gray-800">{booking.special_requests}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{booking.total_price.toLocaleString()} DA</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/client/bookings/${booking.id}`)}
                >
                  Voir détails
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/${locale}/client/dashboard`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Mes réservations</h1>
          <p className="text-gray-600">Gérez vos séjours passés et à venir</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              À venir ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Passées ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">Aucune réservation à venir</h3>
                  <p className="text-gray-600 mb-6">Explorez nos lofts et réservez votre prochain séjour</p>
                  <Link href={`/${locale}/client/lofts`}>
                    <Button>Découvrir les lofts</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">Aucune réservation passée</h3>
                  <p className="text-gray-600">Vos réservations terminées apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
