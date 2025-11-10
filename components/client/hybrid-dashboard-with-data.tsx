'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, MapPin, Heart, Search, Star, Clock, Users, 
  TrendingUp, Award, Gift, Sparkles, ChevronRight, 
  Plane, Home, Coffee, Wifi, Bell, Settings,
  MessageSquare, Shield, ArrowRight
} from 'lucide-react'
import { useDashboardData } from './dashboard-with-data'
import DashboardHeader from './dashboard-header'
import DashboardStats from './dashboard-stats'
import SearchBar from './dashboard-search-bar'
import BookingCard from './booking-card'
import ReferralCard from './referral-card'
import QuickActions from './quick-actions'
import DestinationsSection from './destinations-section'

export default function HybridDashboardWithData() {
  const router = useRouter()
  const { data, loading, error } = useDashboardData()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'wishlist'>('upcoming')
  const [showNotifications, setShowNotifications] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de votre dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error || 'Impossible de charger vos données'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'upcoming':
        return data.upcomingBookings
      case 'past':
        return data.pastBookings
      case 'wishlist':
        return [] // TODO: Implement wishlist
      default:
        return data.bookings
    }
  }

  const filteredBookings = getFilteredBookings()
  const nextBooking = data.upcomingBookings[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <DashboardHeader 
        userName={data.userName}
        userAvatar={data.userAvatar}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 pb-12">
        {/* Tabs */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'upcoming', label: 'À venir', icon: Calendar, count: data.upcomingBookings.length },
            { key: 'past', label: 'Historique', icon: Clock, count: data.pastBookings.length },
            { key: 'wishlist', label: 'Favoris', icon: Heart, count: data.stats.favorites }
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

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
                <div className="text-6xl mb-4">
                  {activeTab === 'upcoming' ? '🗓️' : activeTab === 'past' ? '📚' : '❤️'}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {activeTab === 'upcoming' ? 'Aucun séjour à venir' : 
                   activeTab === 'past' ? 'Aucun séjour passé' : 
                   'Aucun favori'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'upcoming' ? 'Réservez votre prochain séjour dès maintenant !' : 
                   activeTab === 'past' ? 'Vos séjours passés apparaîtront ici' : 
                   'Sauvegardez vos lofts préférés'}
                </p>
                <button
                  onClick={() => router.push('/fr/lofts')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Explorer les lofts
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {filteredBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>

                <div className="space-y-6">
                  <ReferralCard />
                  <QuickActions />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Destinations */}
        <DestinationsSection />
      </div>
    </div>
  )
}
