'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import SimpleLogo from './SimpleLogo';

interface RobustLogoProps {
  variant?: 'header' | 'hero' | 'footer';
  className?: string;
  showGlow?: boolean;
}

export default function RobustLogo({ 
  variant = 'header', 
  className = '',
  showGlow = false 
}: RobustLogoProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const logoVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.05,
      y: prefersReducedMotion ? 0 : -2,
      transition: { duration: 0.3 }
    }
  };

  const getDimensions = () => {
    switch (variant) {
      case 'hero':
        return { width: 300, height: 120, maxHeight: 'max-h-32' };
      case 'header':
        return { width: 80, height: 24, maxHeight: 'max-h-6 -m-8' };
      case 'footer':
        return { width: 160, height: 48, maxHeight: 'max-h-12' };
      default:
        return { width: 120, height: 36, maxHeight: 'max-h-9' };
    }
  };

  const { width, height, maxHeight } = getDimensions();

  // Fonction pour charger l'image avec retry
  const loadImage = () => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadImage(), 1000); // Retry après 1 seconde
      } else {
        setImageError(true);
      }
    };
    img.src = `/logo.jpg?v=${Date.now()}`; // Cache busting
  };

  useEffect(() => {
    loadImage();
  }, []);

  // Si l'image échoue après plusieurs tentatives, utiliser le logo simplifié
  if (imageError) {
    return <SimpleLogo variant={variant} showGlow={showGlow} className={className} />;
  }

  return (
    <motion.div
      className={`${variant === 'hero' ? 'hidden' : variant === 'footer' ? 'block mt-4' : 'relative inline-block'} ${maxHeight} ${className}`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Golden Glow Effect pour votre logo */}
      {showGlow && !prefersReducedMotion && imageLoaded && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-xl opacity-0"
          style={{
            background: 'radial-gradient(ellipse, rgba(255, 215, 0, 0.6) 0%, rgba(255, 193, 7, 0.4) 50%, transparent 70%)',
            filter: 'blur(20px)'
          }}
          animate={{
            opacity: [0, 0.8, 0],
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      )}

      {/* Votre Logo JPG */}
      <div className={`relative z-10 ${maxHeight}`}>
        {imageLoaded ? (
          <img
            src={`/logo.jpg?v=${Date.now()}`}
            alt="Loft Algérie - Votre Confort Notre Priorité"
            width={width}
            height={height}
            className={`object-contain transition-all duration-500 ${
              variant === 'hero' ? 'filter brightness-110 contrast-105' : ''
            }`}
            style={{
              filter: variant === 'hero' 
                ? 'drop-shadow(0 10px 25px rgba(255, 215, 0, 0.3)) brightness(1.1)' 
                : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        ) : (
          // Loading placeholder avec votre style
          <div className={`${maxHeight} flex items-center justify-center bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg animate-pulse`} style={{ width, height }}>
            <div className="text-center">
              <div className="text-yellow-600 font-bold text-sm mb-1">
                LOFT ALGÉRIE
              </div>
              <div className="text-xs text-yellow-500">
                Chargement...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Effet de brillance au hover */}
      {!prefersReducedMotion && imageLoaded && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 pointer-events-none"
          whileHover={{
            x: ['0%', '100%'],
            opacity: [0, 1, 0],
            transition: { duration: 0.8 }
          }}
        />
      )}
    </motion.div>
  );
}