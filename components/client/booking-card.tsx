'use client'

import { motion } from 'framer-motion'
import { MapPin, Star, Calendar, Users, Heart, MessageSquare, Shield, ArrowRight, Wifi, Coffee, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  loft: {
    id: string
    name: string
    address: string
    price_per_night: number
    images?: string[]
  }
}

interface BookingCardProps {
  booking: Booking
}

export default function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter()
  
  const calculateNights = () => {
    const diff = new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getDaysUntil = () => {
    const diff = new Date(booking.check_in).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = () => {
    const statusConfig = {
      confirmed: { label: '✓ Confirmé', color: 'bg-green-500' },
      pending: { label: '⏳ En attente', color: 'bg-yellow-500' },
      cancelled: { label: '✕ Annulé', color: 'bg-red-500' },
      completed: { label: '✓ Terminé', color: 'bg-blue-500' }
    }
    return statusConfig[booking.status] || statusConfig.pending
  }

  const nights = calculateNights()
  const daysUntil = getDaysUntil()
  const status = getStatusBadge()
  const imageUrl = booking.loft.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop'

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
      onClick={() => router.push(`/fr/client/bookings/${booking.id}`)}
    >
      <div className="relative h-80">
        <img
          src={imageUrl}
          alt={booking.loft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Badges */}
        <div className="absolute top-6 left-6 flex gap-2">
          <span className={`${status.color} text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg`}>
            {status.label}
          </span>
          {daysUntil > 0 && daysUntil < 30 && (
            <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
              🔥 Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {/* Favorite */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Toggle favorite
          }}
          className="absolute top-6 right-6 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
        >
          <Heart className="w-6 h-6 text-gray-400" />
        </button>

        {/* Price */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
          <div className="text-xs text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{booking.total_price.toLocaleString()} DZD</div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {booking.loft.name}
            </h3>
            <p className="text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {booking.loft.address}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-lg font-bold text-amber-700">4.9</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { icon: Wifi, label: 'WiFi' },
            { icon: Coffee, label: 'Cuisine' },
            { icon: Home, label: '120m²' },
            { icon: Users, label: `${booking.guests} pers.` }
          ].map((amenity) => (
            <div key={amenity.label} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
              <amenity.icon className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{amenity.label}</span>
            </div>
          ))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
          <div>
            <div className="text-xs text-gray-500 mb-2">Arrivée</div>
            <div className="text-lg font-bold text-gray-900">
              {new Date(booking.check_in).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-sm text-gray-600">14:00</div>
          </div>
          <div className="border-l border-r border-gray-200 px-4">
            <div className="text-xs text-gray-500 mb-2">Durée</div>
            <div className="text-lg font-bold text-gray-900">{nights} nuit{nights > 1 ? 's' : ''}</div>
            <div className="text-sm text-gray-600">{booking.guests} invité{booking.guests > 1 ? 's' : ''}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">Départ</div>
            <div className="text-lg font-bold text-gray-900">
              {new Date(booking.check_out).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-sm text-gray-600">11:00</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-4 font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
            Voir les détails
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="px-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="px-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Shield className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
