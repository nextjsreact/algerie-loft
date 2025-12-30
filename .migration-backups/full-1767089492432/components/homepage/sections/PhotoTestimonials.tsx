'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Shield, MapPin, Calendar } from 'lucide-react';
import { Review } from '@/types/dual-audience';

interface PhotoTestimonialsProps {
  reviews: Review[];
  locale: string;
}

export default function PhotoTestimonials({ reviews, locale }: PhotoTestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter reviews that have photos
  const reviewsWithPhotos = reviews.filter(review => review.photos && review.photos.length > 0);

  const content = {
    fr: {
      title: 'Témoignages avec photos',
      subtitle: 'Découvrez les expériences authentiques de nos clients',
      verifiedStay: 'Séjour vérifié',
      stayedAt: 'A séjourné à',
      previous: 'Précédent',
      next: 'Suivant'
    },
    en: {
      title: 'Photo Testimonials',
      subtitle: 'Discover authentic experiences from our guests',
      verifiedStay: 'Verified stay',
      stayedAt: 'Stayed at',
      previous: 'Previous',
      next: 'Next'
    },
    ar: {
      title: 'شهادات بالصور',
      subtitle: 'اكتشف التجارب الأصيلة لضيوفنا',
      verifiedStay: 'إقامة موثقة',
      stayedAt: 'أقام في',
      previous: 'السابق',
      next: 'التالي'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviewsWithPhotos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviewsWithPhotos.length) % reviewsWithPhotos.length);
  };

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

  if (reviewsWithPhotos.length === 0) {
    return null;
  }

  const currentReview = reviewsWithPhotos[currentIndex];

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {text.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {text.subtitle}
        </p>
      </div>

      {/* Main Testimonial Display */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2"
          >
            {/* Photo Gallery */}
            <div className="relative h-64 lg:h-96">
              {currentReview.photos && currentReview.photos.length > 0 && (
                <div className="relative h-full">
                  <img
                    src={currentReview.photos[0]}
                    alt={`Photo by ${currentReview.guestName}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Photo Count Indicator */}
                  {currentReview.photos.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      1 / {currentReview.photos.length}
                    </div>
                  )}

                  {/* Verified Badge */}
                  {currentReview.verified && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>{text.verifiedStay}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Testimonial Content */}
            <div className="p-6 lg:p-8 flex flex-col justify-center">
              {/* Guest Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  {currentReview.guestAvatar ? (
                    <img
                      src={currentReview.guestAvatar}
                      alt={currentReview.guestName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {currentReview.guestName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentReview.guestName}
                  </h4>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center space-x-1">
                      {renderStars(currentReview.rating)}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(currentReview.stayDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                    <MapPin className="w-4 h-4" />
                    <span>{text.stayedAt} {currentReview.loftName}</span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <blockquote className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 italic">
                "{currentReview.comment}"
              </blockquote>

              {/* Additional Photos Thumbnails */}
              {currentReview.photos && currentReview.photos.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {currentReview.photos.slice(1, 4).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Additional photo ${index + 1}`}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                  {currentReview.photos.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      +{currentReview.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {reviewsWithPhotos.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
              aria-label={text.previous}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
              aria-label={text.next}
            >
              <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {reviewsWithPhotos.length > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {reviewsWithPhotos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}