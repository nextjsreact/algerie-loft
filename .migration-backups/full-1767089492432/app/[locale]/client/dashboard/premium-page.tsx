'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, MapPin, Heart, Search, Star, Clock, Users, 
  TrendingUp, Award, Gift, Sparkles, ChevronRight, 
  Plane, Home, Coffee, Wifi
} from 'lucide-react'

export default function PremiumClientDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Header with Parallax Effect */}
      <div className="relative h-[400px] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=800&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Welcome Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">Membre Premium</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Bienvenue, Habib
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Votre prochaine aventure commence ici. Découvrez des expériences uniques à travers l'Algérie.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8">
              {[
                { icon: Plane, label: 'Voyages', value: '12' },
                { icon: Award, label: 'Points', value: '2,450' },
                { icon: Star, label: 'Avis', value: '4.9' }
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-12">
        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Planifiez votre séjour</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Alger, Oran, Constantine..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Arrivée</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Départ</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl py-3 font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Rechercher
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { key: 'upcoming', label: 'Séjours à venir', icon: Calendar },
            { key: 'past', label: 'Historique', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trips Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          >
            {/* Trip Card */}
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
                  alt="Loft"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Confirmé
                  </span>
                  <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                    Dans 5 jours
                  </span>
                </div>
                
                {/* Favorite Button */}
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                </button>

                {/* Price Tag */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2">
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="text-xl font-bold text-gray-900">125,000 DZD</div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Loft Moderne Hydra
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Hydra, Alger • Vue panoramique
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-700">4.9</span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-4 h-4" />
                    WiFi
                  </span>
                  <span className="flex items-center gap-1">
                    <Coffee className="w-4 h-4" />
                    Cuisine
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    120m²
                  </span>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Arrivée</div>
                    <div className="font-semibold text-gray-900">15 Jan</div>
                    <div className="text-xs text-gray-500">14:00</div>
                  </div>
                  <div className="border-l border-r border-gray-200 px-4">
                    <div className="text-xs text-gray-500 mb-1">Durée</div>
                    <div className="font-semibold text-gray-900">5 nuits</div>
                    <div className="text-xs text-gray-500">2 invités</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Départ</div>
                    <div className="font-semibold text-gray-900">20 Jan</div>
                    <div className="text-xs text-gray-500">11:00</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    Voir les détails
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button className="px-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
                    <Users className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Promotional Card */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 text-white relative overflow-hidden cursor-pointer"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-bold mb-4">
                  Parrainez un ami
                </h3>
                <p className="text-white/90 mb-6 text-lg">
                  Offrez 50,000 DZD à vos amis et recevez 50,000 DZD après leur premier séjour.
                </p>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
                  <div className="text-sm text-white/80 mb-2">Votre code de parrainage</div>
                  <div className="flex items-center justify-between">
                    <code className="text-2xl font-bold">HABIB2024</code>
                    <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-all">
                      Copier
                    </button>
                  </div>
                </div>

                <button className="w-full bg-white text-purple-600 rounded-xl py-3 font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                  Inviter des amis
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Recommendations Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Destinations populaires
              </h2>
              <p className="text-gray-600">Découvrez les lofts les plus appréciés</p>
            </div>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
              Voir tout
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { city: 'Alger', count: '120+ lofts', image: 'photo-1522708323590' },
              { city: 'Oran', count: '85+ lofts', image: 'photo-1560448204' },
              { city: 'Constantine', count: '45+ lofts', image: 'photo-1502672260' }
            ].map((destination, index) => (
              <motion.div
                key={destination.city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative h-80 rounded-3xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={`https://images.unsplash.com/${destination.image}-e02f11c3d0e2?w=600&h=800&fit=crop`}
                  alt={destination.city}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-3xl font-bold text-white mb-2">{destination.city}</h3>
                  <p className="text-white/80">{destination.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
