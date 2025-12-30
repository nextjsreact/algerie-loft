'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, MapPin, Heart, Search, Star, Clock, Users, 
  TrendingUp, Award, Gift, Sparkles, ChevronRight, 
  Plane, Home, Coffee, Wifi, Bell, Settings, LogOut,
  MessageSquare, Shield, Zap, ArrowRight, Plus
} from 'lucide-react'

export default function HybridClientDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'wishlist'>('upcoming')
  const [userName] = useState('Habib')
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Premium Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0)}
              </div>
              <div>
                <div className="text-white/80 text-sm">Bienvenue,</div>
                <div className="text-white font-bold text-lg">{userName}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  3
                </span>
              </button>

              {/* Settings */}
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all">
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">Membre Premium</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Votre prochaine aventure 🌟
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Découvrez des lofts exceptionnels à travers l'Algérie
            </p>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Plane, label: 'Voyages', value: '12', color: 'from-blue-400 to-cyan-400' },
              { icon: Award, label: 'Points', value: '2,450', color: 'from-purple-400 to-pink-400' },
              { icon: Heart, label: 'Favoris', value: '8', color: 'from-rose-400 to-red-400' },
              { icon: Star, label: 'Note', value: '4.9', color: 'from-amber-400 to-orange-400' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Destination</div>
                  <div className="text-sm text-gray-500">Où allez-vous ?</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Dates</div>
                  <div className="text-sm text-gray-500">Quand ?</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Voyageurs</div>
                  <div className="text-sm text-gray-500">Combien ?</div>
                </div>
              </div>
              
              <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl px-6 py-3 font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Rechercher
              </button>
            </div>
          </motion.div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-12">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'upcoming', label: 'À venir', icon: Calendar, count: 2 },
            { key: 'past', label: 'Historique', icon: Clock, count: 10 },
            { key: 'wishlist', label: 'Favoris', icon: Heart, count: 8 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'upcoming' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Main Trip Card */}
                <div className="lg:col-span-2">
                  <motion.div
                    whileHover={{ y: -8 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
                  >
                    <div className="relative h-80">
                      <img
                        src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop"
                        alt="Loft"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Badges */}
                      <div className="absolute top-6 left-6 flex gap-2">
                        <span className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                          ✓ Confirmé
                        </span>
                        <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                          🔥 Dans 5 jours
                        </span>
                      </div>
                      
                      {/* Favorite */}
                      <button className="absolute top-6 right-6 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
                        <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                      </button>

                      {/* Price */}
                      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
                        <div className="text-xs text-gray-600 mb-1">Total</div>
                        <div className="text-2xl font-bold text-gray-900">125,000 DZD</div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Loft Moderne Hydra
                          </h3>
                          <p className="text-gray-500 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Hydra, Alger • Vue panoramique sur la baie
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <span className="text-lg font-bold text-amber-700">4.9</span>
                          <span className="text-sm text-amber-600">(127)</span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        {[
                          { icon: Wifi, label: 'WiFi Haut Débit' },
                          { icon: Coffee, label: 'Cuisine équipée' },
                          { icon: Home, label: '120m²' },
                          { icon: Users, label: '4 personnes' }
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
                          <div className="text-lg font-bold text-gray-900">15 Jan</div>
                          <div className="text-sm text-gray-600">Lundi, 14:00</div>
                        </div>
                        <div className="border-l border-r border-gray-200 px-4">
                          <div className="text-xs text-gray-500 mb-2">Durée</div>
                          <div className="text-lg font-bold text-gray-900">5 nuits</div>
                          <div className="text-sm text-gray-600">2 invités</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Départ</div>
                          <div className="text-lg font-bold text-gray-900">20 Jan</div>
                          <div className="text-sm text-gray-600">Samedi, 11:00</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-4 font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                          Voir les détails
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="px-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                          <MessageSquare className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="px-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                          <Shield className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Referral Card */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-6 text-white relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">
                        Parrainez & Gagnez
                      </h3>
                      <p className="text-white/90 text-sm mb-4">
                        50,000 DZD pour vous et votre ami
                      </p>
                      
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-4">
                        <div className="text-xs text-white/80 mb-1">Votre code</div>
                        <code className="text-lg font-bold">HABIB2024</code>
                      </div>

                      <button className="w-full bg-white text-purple-600 rounded-xl py-3 font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                        Partager
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-3xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
                    <div className="space-y-3">
                      {[
                        { icon: Search, label: 'Rechercher un loft', color: 'from-blue-500 to-cyan-500' },
                        { icon: Heart, label: 'Mes favoris', color: 'from-rose-500 to-pink-500' },
                        { icon: MessageSquare, label: 'Messages', color: 'from-purple-500 to-indigo-500' }
                      ].map((action) => (
                        <button
                          key={action.label}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-gray-700">{action.label}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'past' && (
              <div className="text-center py-20">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Historique des séjours</h3>
                <p className="text-gray-600">Vos séjours passés apparaîtront ici</p>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Vos favoris</h3>
                <p className="text-gray-600">Sauvegardez vos lofts préférés</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Recommendations */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Destinations populaires</h2>
                <p className="text-gray-600">Les lofts les plus appréciés</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
              Voir tout
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { city: 'Alger', count: '120+', image: 'photo-1522708323590', gradient: 'from-blue-600 to-cyan-600' },
              { city: 'Oran', count: '85+', image: 'photo-1560448204', gradient: 'from-purple-600 to-pink-600' },
              { city: 'Constantine', count: '45+', image: 'photo-1502672260', gradient: 'from-orange-600 to-rose-600' }
            ].map((destination, index) => (
              <motion.div
                key={destination.city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative h-96 rounded-3xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={`https://images.unsplash.com/${destination.image}-e02f11c3d0e2?w=600&h=800&fit=crop`}
                  alt={destination.city}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${destination.gradient} opacity-60`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="text-white/80 text-sm mb-2">{destination.count} lofts disponibles</div>
                  <h3 className="text-4xl font-bold text-white mb-4">{destination.city}</h3>
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center gap-2">
                    Explorer
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
