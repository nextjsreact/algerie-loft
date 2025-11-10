'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Crown, ChevronRight } from 'lucide-react'
import ModernClientDashboard from '../modern-page'
import PremiumClientDashboard from '../premium-page'
import dynamic from 'next/dynamic'

// Import dynamique pour éviter les problèmes de SSR
const HybridClientDashboard = dynamic(() => import('../hybrid-page'), { ssr: false })

type DashboardVersion = 'modern' | 'premium' | 'hybrid'

export default function DashboardDemoPage() {
  const [selectedVersion, setSelectedVersion] = useState<DashboardVersion>('hybrid')

  const versions = [
    {
      id: 'modern' as DashboardVersion,
      name: 'Modern',
      description: 'Design épuré et moderne avec animations fluides',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      features: ['Barre de recherche intégrée', 'Stats cards animées', 'Design minimaliste']
    },
    {
      id: 'premium' as DashboardVersion,
      name: 'Premium',
      description: 'Expérience ultra-premium avec parallax et gradients',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      features: ['Header parallax', 'Système de points', 'Carte de parrainage']
    },
    {
      id: 'hybrid' as DashboardVersion,
      name: 'Hybrid',
      description: 'Le meilleur des deux mondes combinés',
      icon: Zap,
      color: 'from-orange-500 to-rose-500',
      features: ['Toutes les fonctionnalités', 'Design optimisé', 'Recommandé ⭐']
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Selector Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎨 Démo Dashboard Client
              </h1>
              <p className="text-gray-600">
                Comparez les différentes versions et choisissez votre préférée
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/fr/client/dashboard'}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Retour au dashboard actuel
            </button>
          </div>

          {/* Version Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {versions.map((version) => {
              const Icon = version.icon
              const isSelected = selectedVersion === version.id
              
              return (
                <motion.button
                  key={version.id}
                  onClick={() => setSelectedVersion(version.id)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br ' + version.color + ' text-white shadow-xl'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="selected-indicator"
                      className="absolute inset-0 rounded-2xl border-4 border-white/50"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-white/20' : 'bg-white'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-700'}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{version.name}</h3>
                        {version.id === 'hybrid' && (
                          <span className="text-xs font-semibold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
                            RECOMMANDÉ
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-4 ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                      {version.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {version.features.map((feature, index) => (
                        <li key={index} className={`text-sm flex items-center gap-2 ${
                          isSelected ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          <ChevronRight className="w-4 h-4" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedVersion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedVersion === 'modern' && <ModernClientDashboard />}
          {selectedVersion === 'premium' && <PremiumClientDashboard />}
          {selectedVersion === 'hybrid' && <HybridClientDashboard />}
        </motion.div>
      </AnimatePresence>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => {
            const confirmed = window.confirm(
              `Voulez-vous utiliser la version "${versions.find(v => v.id === selectedVersion)?.name}" comme dashboard principal ?`
            )
            if (confirmed) {
              alert('Cette fonctionnalité sera implémentée pour remplacer le dashboard actuel.')
            }
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center gap-2 font-semibold"
        >
          <Zap className="w-5 h-5" />
          Valider cette version
        </button>
      </div>
    </div>
  )
}
