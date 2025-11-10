'use client'

import { motion } from 'framer-motion'
import { TrendingUp, ChevronRight, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DestinationsSection() {
  const router = useRouter()

  const destinations = [
    { city: 'Alger', count: '120+', image: 'photo-1522708323590', gradient: 'from-blue-600 to-cyan-600' },
    { city: 'Oran', count: '85+', image: 'photo-1560448204', gradient: 'from-purple-600 to-pink-600' },
    { city: 'Constantine', count: '45+', image: 'photo-1502672260', gradient: 'from-orange-600 to-rose-600' }
  ]

  return (
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
        <button 
          onClick={() => router.push('/fr/lofts')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
        >
          Voir tout
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {destinations.map((destination, index) => (
          <motion.div
            key={destination.city}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            onClick={() => router.push(`/fr/lofts?city=${destination.city}`)}
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
  )
}
