"use client"

import { useState } from "react"
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
  Heart,
  Star,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ClientDashboardViewProps {
  lofts: any[]
  bookings: any[]
  locale: string
  clientName: string
}

export function ClientDashboardView({ lofts, bookings, locale, clientName }: ClientDashboardViewProps) {
  const router = useRouter()
  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: 1
  })

  const handleSearch = () => {
    const params = new URLSearchParams({
      destination: searchData.destination,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: searchData.guests.toString()
    })
    router.push(`/${locale}/client/search?${params}`)
  }

  const getBookingStatusBadge = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section avec barre de recherche */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-bold mb-2">Bienvenue, {clientName} ! 👋</h1>
          <p className="text-blue-100 text-lg mb-8">Trouvez votre loft idéal en Algérie</p>
          
          {/* Barre de recherche style Airbnb */}
          <Card className="max-w-5xl mx-auto shadow-2xl">
            <CardContent className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Où allez-vous ?"
                      value={searchData.destination}
                      onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">Arrivée</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={searchData.checkIn}
                      onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">Départ</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={searchData.checkOut}
                      onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                      min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700 ml-4 mb-1 block">Voyageurs</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      min={1}
                      value={searchData.guests}
                      onChange={(e) => setSearchData({ ...searchData, guests: parseInt(e.target.value) })}
                      className="pl-10 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSearch}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6"
              >
                <Search className="h-5 w-5 mr-2" />
                Rechercher
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Mes réservations */}
        {bookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Mes réservations</h2>
                <p className="text-gray-600">Gérez vos séjours à venir et passés</p>
              </div>
              <Link href={`/${locale}/client/bookings`}>
                <Button variant="outline">
                  Voir tout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-48">
                    {booking.lofts?.loft_photos?.[0]?.photo_url ? (
                      <Image
                        src={booking.lofts.loft_photos[0].photo_url}
                        alt={booking.lofts.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <MapPin className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getBookingStatusBadge(booking.status)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{booking.lofts?.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {booking.lofts?.address}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.check_in_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>→</span>
                      <span>{new Date(booking.check_out_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="font-bold text-lg text-blue-600">
                        {booking.total_price?.toLocaleString()} DA
                      </span>
                      <Link href={`/${locale}/client/bookings/${booking.id}`}>
                        <Button size="sm" variant="outline">Détails</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Lofts disponibles */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Lofts disponibles</h2>
              <p className="text-gray-600">Découvrez nos meilleures offres</p>
            </div>
            <Link href={`/${locale}/client/lofts`}>
              <Button variant="outline">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lofts.map((loft) => (
              <Card key={loft.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="relative h-56 group">
                  {loft.loft_photos?.[0]?.photo_url ? (
                    <Image
                      src={loft.loft_photos[0].photo_url}
                      alt={loft.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{loft.name}</h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{loft.average_rating || "Nouveau"}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {loft.address}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <span className="font-bold text-xl text-blue-600">{loft.price_per_night?.toLocaleString()} DA</span>
                      <span className="text-sm text-gray-600"> / nuit</span>
                    </div>
                    <Link href={`/${locale}/lofts/${loft.id}/book`}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Réserver
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Message si pas de réservations */}
        {bookings.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">Aucune réservation pour le moment</h3>
            <p className="text-gray-600 mb-6">Commencez à explorer nos lofts et réservez votre séjour idéal !</p>
            <Link href={`/${locale}/client/lofts`}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Découvrir les lofts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
