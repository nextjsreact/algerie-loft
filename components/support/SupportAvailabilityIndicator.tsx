'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SupportAvailabilityIndicatorProps {
  isAvailable: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  locale?: string;
}

/**
 * Visual indicator for support availability status
 */
export function SupportAvailabilityIndicator({ 
  isAvailable, 
  size = 'md', 
  showText = false,
  locale = 'fr'
}: SupportAvailabilityIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const content = {
    fr: {
      available: 'Disponible',
      unavailable: 'Indisponible'
    },
    en: {
      available: 'Available',
      unavailable: 'Unavailable'
    },
    ar: {
      available: 'متاح',
      unavailable: 'غير متاح'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-full ${
            isAvailable ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        {isAvailable && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ opacity: 0.6 }}
          />
        )}
      </div>
      {showText && (
        <span className={`${textSizes[size]} ${
          isAvailable ? 'text-green-600' : 'text-red-600'
        }`}>
          {isAvailable ? text.available : text.unavailable}
        </span>
      )}
    </div>
  );
}