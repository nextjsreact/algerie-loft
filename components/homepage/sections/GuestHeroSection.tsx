'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OptimizedImage, BLUR_DATA_URLS } from '@/components/ui/OptimizedImage';
import { Search } from 'lucide-react';
import SearchWidget from './SearchWidget';
import TrustIndicators from './TrustIndicators';

interface GuestHeroSectionProps {
  locale: string;
}

/**
 * Guest-focused hero section with prominent booking CTA
 * Implements visual hierarchy prioritizing guest experience
 * Features high-quality background imagery showcasing lofts
 */
export default function GuestHeroSection({ locale }: GuestHeroSectionProps) {
  // Multilingual content
  const content = {
    fr: {
      headline: "Réservez votre loft idéal",
      subheadline: "en Algérie",
      description: "Découvrez des lofts uniques et authentiques dans les plus belles villes d'Algérie. Séjours mémorables, confort moderne et hospitalité locale.",
      ctaPrimary: "Rechercher maintenant",
      ctaSecondary: "Voir les lofts disponibles",
      searchPlaceholder: "Où souhaitez-vous séjourner ?",
      trustBadge: "Plus de 1000 voyageurs satisfaits"
    },
    en: {
      headline: "Book your ideal loft",
      subheadline: "in Algeria",
      description: "Discover unique and authentic lofts in Algeria's most beautiful cities. Memorable stays, modern comfort and local hospitality.",
      ctaPrimary: "Search now",
      ctaSecondary: "View available lofts",
      searchPlaceholder: "Where would you like to stay?",
      trustBadge: "Over 1000 satisfied travelers"
    },
    ar: {
      headline: "احجز شقتك المفروشة المثالية",
      subheadline: "في الجزائر",
      description: "اكتشف شققاً مفروشة فريدة وأصيلة في أجمل مدن الجزائر. إقامات لا تُنسى، راحة عصرية وضيافة محلية.",
      ctaPrimary: "ابحث الآن",
      ctaSecondary: "عرض الشقق المتاحة",
      searchPlaceholder: "أين تود الإقامة؟",
      trustBadge: "أكثر من 1000 مسافر راضٍ"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src="/loft-images/living-room.jpg"
          alt="Beautiful loft interior in Algeria"
          fill
          priority
          quality={90}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.large}
          sizes="100vw"
          className="object-cover"
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">{text.trustBadge}</span>
          </motion.div>

          {/* Main Headline with Visual Hierarchy */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 leading-tight"
          >
            <span className="block">{text.headline}</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {text.subheadline}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            {text.description}
          </motion.p>

          {/* CTA Buttons with Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button
              size="lg"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 min-w-[200px]"
            >
              <Search className="w-5 h-5 mr-2" />
              {text.ctaPrimary}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-gray-900 font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
            >
              {text.ctaSecondary}
            </Button>
          </motion.div>

          {/* Integrated Search Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="max-w-5xl mx-auto mb-16"
          >
            <SearchWidget 
              locale={locale}
              onSearch={(searchData) => {
                console.log('Hero search initiated:', searchData);
                // TODO: Implement search navigation
              }}
            />
          </motion.div>

          {/* Trust Indicators and Competitive Positioning */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <TrustIndicators locale={locale} />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/70 text-sm">Découvrir</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}