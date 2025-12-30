'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Camera } from 'lucide-react';
import { Review } from '@/types/dual-audience';

interface VerifiedReviewCardProps {
  review: Review;
  locale: string;
}

export default function VerifiedReviewCard({ review, locale }: VerifiedReviewCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
    >
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Guest Avatar */}
          <div className="relative">
            {review.guestAvatar ? (
              <img
                src={review.guestAvatar}
                alt={review.guestName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {review.guestName.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Verified Badge */}
            {review.verified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Guest Info */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {review.guestName}
            </h4>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(review.stayDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Photo Count */}
        {review.photos && review.photos.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <Camera className="w-4 h-4" />
            <span>{review.photos.length}</span>
          </div>
        )}
      </div>

      {/* Loft Name */}
      <div className="mb-3">
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {review.loftName}
        </span>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        "{review.comment}"
      </p>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto">
          {review.photos.slice(0, 3).map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Photo ${index + 1} by ${review.guestName}`}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          ))}
          {review.photos.length > 3 && (
            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              +{review.photos.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Verified Badge Text */}
      {review.verified && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <Shield className="w-4 h-4" />
            <span className="font-medium">
              {locale === 'fr' && 'Séjour vérifié'}
              {locale === 'en' && 'Verified stay'}
              {locale === 'ar' && 'إقامة موثقة'}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}