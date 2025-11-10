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
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 mt-16">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-6">
        {/* Welcome Section - Compact */}
        <div className="flex items-center gap-3 mb-3">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-white/80 text-xs">Bienvenue,</div>
            <div className="text-white font-bold text-lg">{userName}</div>
          </div>
          <div className="ml-auto inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-white text-xs font-medium">Premium</span>
          </div>
        </div>

        {/* Title Section - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Votre prochaine aventure 🌟
          </h1>
          <p className="text-sm text-white/90">
            Découvrez des lofts exceptionnels à travers l'Algérie
          </p>
        </motion.div>

        {/* Search Bar - Full width, no truncation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl p-2 w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
            <div 
              onClick={() => window.location.href = '/fr/lofts'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-all min-w-0"
            >
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 truncate">Destination</div>
                <div className="text-xs text-gray-500 truncate">Où allez-vous ?</div>
              </div>
            </div>
            
            <div 
              onClick={() => window.location.href = '/fr/lofts'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-all min-w-0"
            >
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 truncate">Dates</div>
                <div className="text-xs text-gray-500 truncate">Quand ?</div>
              </div>
            </div>
            
            <div 
              onClick={() => window.location.href = '/fr/lofts'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-all min-w-0"
            >
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 truncate">Voyageurs</div>
                <div className="text-xs text-gray-500 truncate">Combien ?</div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/fr/lofts'}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl px-4 py-2 font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Rechercher</span>
              <span className="sm:hidden">🔍</span>
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
