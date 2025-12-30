'use client'

import { motion } from 'framer-motion'
import { Gift, ChevronRight } from 'lucide-react'

export default function ReferralCard() {
  const referralCode = 'HABIB2024'

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    alert('Code copié !')
  }

  return (
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
          <code className="text-lg font-bold">{referralCode}</code>
        </div>

        <button 
          onClick={copyCode}
          className="w-full bg-white text-purple-600 rounded-xl py-3 font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2"
        >
          Partager
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
