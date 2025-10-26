'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Users, Award, CheckCircle, Clock } from 'lucide-react';

interface TrustIndicatorsProps {
  locale: string;
  className?: string;
}

/**
 * Trust indicators and competitive positioning component
 * Displays unique selling points, trust badges, and social proof elements
 */
export default function TrustIndicators({ locale, className }: TrustIndicatorsProps) {
  // Multilingual content
  const content = {
    fr: {
      stats: {
        guests: "1,200+",
        guestsLabel: "Voyageurs satisfaits",
        rating: "4.8",
        ratingLabel: "Note moyenne",
        lofts: "150+",
        loftsLabel: "Lofts disponibles",
        cities: "20+",
        citiesLabel: "Villes couvertes"
      },
      badges: {
        verified: "Lofts vérifiés",
        support: "Support 24/7",
        cancellation: "Annulation flexible",
        quality: "Qualité garantie"
      },
      competitive: {
        title: "Pourquoi choisir Loft Algérie ?",
        points: [
          "Expertise locale authentique",
          "Sélection rigoureuse des lofts",
          "Service client personnalisé",
          "Meilleurs prix garantis"
        ]
      }
    },
    en: {
      stats: {
        guests: "1,200+",
        guestsLabel: "Satisfied travelers",
        rating: "4.8",
        ratingLabel: "Average rating",
        lofts: "150+",
        loftsLabel: "Available lofts",
        cities: "20+",
        citiesLabel: "Cities covered"
      },
      badges: {
        verified: "Verified lofts",
        support: "24/7 Support",
        cancellation: "Flexible cancellation",
        quality: "Quality guaranteed"
      },
      competitive: {
        title: "Why choose Loft Algeria?",
        points: [
          "Authentic local expertise",
          "Rigorous loft selection",
          "Personalized customer service",
          "Best prices guaranteed"
        ]
      }
    },
    ar: {
      stats: {
        guests: "1,200+",
        guestsLabel: "مسافر راضٍ",
        rating: "4.8",
        ratingLabel: "التقييم المتوسط",
        lofts: "150+",
        loftsLabel: "شقة متاحة",
        cities: "20+",
        citiesLabel: "مدينة مغطاة"
      },
      badges: {
        verified: "شقق موثقة",
        support: "دعم 24/7",
        cancellation: "إلغاء مرن",
        quality: "جودة مضمونة"
      },
      competitive: {
        title: "لماذا تختار لوفت الجزائر؟",
        points: [
          "خبرة محلية أصيلة",
          "اختيار دقيق للشقق",
          "خدمة عملاء شخصية",
          "أفضل الأسعار مضمونة"
        ]
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Statistics Row */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Satisfied Guests */}
        <motion.div
          custom={0}
          variants={statsVariants}
          className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-blue-400 mr-2" />
            <span className="text-2xl font-bold text-white">{text.stats.guests}</span>
          </div>
          <p className="text-sm text-gray-200">{text.stats.guestsLabel}</p>
        </motion.div>

        {/* Average Rating */}
        <motion.div
          custom={1}
          variants={statsVariants}
          className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-yellow-400 mr-2 fill-current" />
            <span className="text-2xl font-bold text-white">{text.stats.rating}</span>
          </div>
          <p className="text-sm text-gray-200">{text.stats.ratingLabel}</p>
        </motion.div>

        {/* Available Lofts */}
        <motion.div
          custom={2}
          variants={statsVariants}
          className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center justify-center mb-2">
            <Award className="w-6 h-6 text-purple-400 mr-2" />
            <span className="text-2xl font-bold text-white">{text.stats.lofts}</span>
          </div>
          <p className="text-sm text-gray-200">{text.stats.loftsLabel}</p>
        </motion.div>

        {/* Cities Covered */}
        <motion.div
          custom={3}
          variants={statsVariants}
          className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-green-400 mr-2" />
            <span className="text-2xl font-bold text-white">{text.stats.cities}</span>
          </div>
          <p className="text-sm text-gray-200">{text.stats.citiesLabel}</p>
        </motion.div>
      </motion.div>

      {/* Trust Badges */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="flex flex-wrap justify-center gap-4"
      >
        <motion.div
          custom={0}
          variants={badgeVariants}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
        >
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-white text-sm font-medium">{text.badges.verified}</span>
        </motion.div>

        <motion.div
          custom={1}
          variants={badgeVariants}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-medium">{text.badges.support}</span>
        </motion.div>

        <motion.div
          custom={2}
          variants={badgeVariants}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
        >
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">{text.badges.cancellation}</span>
        </motion.div>

        <motion.div
          custom={3}
          variants={badgeVariants}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
        >
          <Award className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">{text.badges.quality}</span>
        </motion.div>
      </motion.div>

      {/* Competitive Positioning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="text-center"
      >
        <h3 className="text-xl font-semibold text-white mb-4">{text.competitive.title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {text.competitive.points.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              className="flex items-center gap-2 text-gray-200 text-sm"
            >
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>{point}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}