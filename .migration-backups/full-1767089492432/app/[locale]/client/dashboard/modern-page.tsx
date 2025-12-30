'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Heart, Search, TrendingUp, Star, Clock, Users } from 'lucide-react'

export default function ModernClientDashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('Habib')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section avec Greeting */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bonjour {userName} ! 👋
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Prêt pour votre prochaine aventure ?
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Destination</div>
                    <div className="text-sm text-gray-500">Où allez-vous ?</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Arrivée</div>
                    <div className="text-sm text-gray-500">Ajouter dates</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Voyageurs</div>
                    <div className="text-sm text-gray-500">Ajouter invités</div>
                  </div>
                </div>
                
                <button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl px-6 py-3 font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  Rechercher
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Calendar, label: 'Séjours à venir', value: '2', color: 'from-blue-500 to-cyan-500' },
            { icon: Clock, label: 'Jours de voyage', value: '14', color: 'from-purple-500 to-pink-500' },
            { icon: Heart, label: 'Favoris', value: '8', color: 'from-rose-500 to-red-500' },
            { icon: Star, label: 'Avis laissés', value: '5', color: 'from-amber-500 to-orange-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Trips */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Vos prochains séjours</h2>
            <button className="text-blue-600 hover:text-blue-700 font-semibold">
              Voir tout →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Card 1 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="relative h-48">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop"
                  alt="Loft"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                  Dans 5 jours
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Loft Moderne Hydra
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Hydra, Alger
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">25,000 DZD</div>
                    <div className="text-xs text-gray-500">par nuit</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    15-20 Jan
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    2 invités
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-2.5 font-semibold hover:shadow-lg transition-all">
                    Voir les détails
                  </button>
                  <button className="px-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                    <Heart className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Empty State */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Planifiez votre prochain voyage
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Découvrez des lofts incroyables en Algérie
              </p>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-2.5 font-semibold hover:shadow-lg transition-all">
                Explorer les lofts
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recommandations pour vous</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className="relative h-48">
                  <img
                    src={`https://images.unsplash.com/photo-${item === 1 ? '1560448204' : item === 2 ? '1502672260' : '1571896349'}-e02f11c3d0e2?w=600&h=400&fit=crop`}
                    alt="Loft"
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    4.9
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Penthouse Luxury Oran
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Centre-ville, Oran
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">45,000 DZD</span>
                      <span className="text-sm text-gray-500"> / nuit</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                      Voir →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
