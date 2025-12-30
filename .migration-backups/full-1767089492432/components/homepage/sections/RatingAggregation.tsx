'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import { TrustStats } from '@/types/dual-audience';

interface RatingAggregationProps {
  stats: TrustStats;
  locale: string;
}

export default function RatingAggregation({ stats, locale }: RatingAggregationProps) {
  const content = {
    fr: {
      overallRating: 'Note globale',
      basedOn: 'Basé sur',
      reviews: 'avis',
      satisfaction: 'Taux de satisfaction',
      totalGuests: 'Clients satisfaits',
      experience: "Années d'expérience",
      properties: 'Lofts disponibles'
    },
    en: {
      overallRating: 'Overall Rating',
      basedOn: 'Based on',
      reviews: 'reviews',
      satisfaction: 'Satisfaction Rate',
      totalGuests: 'Happy Guests',
      experience: 'Years Experience',
      properties: 'Available Lofts'
    },
    ar: {
      overallRating: 'التقييم العام',
      basedOn: 'بناءً على',
      reviews: 'مراجعة',
      satisfaction: 'معدل الرضا',
      totalGuests: 'عملاء راضون',
      experience: 'سنوات الخبرة',
      properties: 'لوفتات متاحة'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-6 h-6 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : index < rating
            ? 'text-yellow-400 fill-yellow-200'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
      {/* Overall Rating */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="inline-flex flex-col items-center"
        >
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center space-x-1 mb-2">
            {renderStars(stats.averageRating)}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {text.overallRating}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {text.basedOn} {formatNumber(stats.totalGuests)} {text.reviews}
          </p>
        </motion.div>
      </div>

      {/* Trust Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Satisfaction Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.satisfactionRate}%
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {text.satisfaction}
          </p>
        </motion.div>

        {/* Total Guests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(stats.totalGuests)}+
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {text.totalGuests}
          </p>
        </motion.div>

        {/* Years Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3">
            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.yearsExperience}+
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {text.experience}
          </p>
        </motion.div>

        {/* Available Lofts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3">
            <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.loftsAvailable}+
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {text.properties}
          </p>
        </motion.div>
      </div>

      {/* Rating Distribution (Optional Enhancement) */}
      <div className="mt-8 pt-6 border-t border-blue-200 dark:border-blue-800">
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            // Mock distribution data - in real implementation, this would come from props
            const percentage = rating === 5 ? 75 : rating === 4 ? 20 : rating === 3 ? 3 : rating === 2 ? 1 : 1;
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-10">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}