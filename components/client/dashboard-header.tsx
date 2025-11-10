'use client'

import { motion } from 'framer-motion'
import { Bell, Settings, Sparkles, Calendar, MapPin, Users, Search } from 'lucide-react'

interface DashboardHeaderProps {
  userName: string
  userAvatar?: string
  showNotifications: boolean
  setShowNotifications: (show: boolean) => void
}

export default function DashboardHeader({ 
  userName, 
  userAvatar, 
  showNotifications, 
  setShowNotifications 
}: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-white/80 text-sm">Bienvenue,</div>
              <div className="text-white font-bold text-lg">{userName}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
            </button>

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
  )
}
