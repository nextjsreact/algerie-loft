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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Welcome Section - Ultra Compact */}
        <div className="flex items-center gap-3 mb-2">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white font-bold text-base">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-white/80 text-xs">Bienvenue,</div>
            <div className="text-white font-bold text-base">{userName}</div>
          </div>
          <div className="ml-auto inline-flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-1">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-white text-xs font-medium">Premium</span>
          </div>
        </div>

        {/* Title Section - Ultra Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2"
        >
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
            Votre prochaine aventure 🌟
          </h1>
          <p className="text-xs text-white/90">
            Découvrez des lofts exceptionnels à travers l'Algérie
          </p>
        </motion.div>

        {/* Search Bar - Responsive, no truncation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-2xl p-1.5 overflow-hidden"
        >
          <div className="flex flex-col md:flex-row gap-1.5">
            <div 
              onClick={() => window.location.href = '/fr/lofts'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all flex-1"
            >
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-gray-900">Destination</div>
                <div className="text-xs text-gray-500">Où ?</div>
              </div>
            </div>
            
            <div 
              onClick={() => window.location.href = '/fr/lofts'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all flex-1"
            >
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-gray-900">Dates</div>
                <div className="text-xs text-gray-500">Quand ?</div>
              </div>
            </div>
            
            <div 
              onClick={() => window.location.href = '/fr/lofts'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all flex-1"
            >
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-gray-900">Invités</div>
                <div className="text-xs text-gray-500">Combien ?</div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/fr/lofts'}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg px-6 py-2 font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Rechercher</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Wave Separator - Taller to not hide content */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 180L60 165C120 150 240 120 360 105C480 90 600 90 720 97.5C840 105 960 120 1080 127.5C1200 135 1320 135 1380 135L1440 135V180H1380C1320 180 1200 180 1080 180C960 180 840 180 720 180C600 180 480 180 360 180C240 180 120 180 60 180H0Z" fill="white"/>
        </svg>
      </div>
    </div>
  )
}
