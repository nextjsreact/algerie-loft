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
        // Hauteur réduite à 24px (h-6) pour bien rentrer dans le header sans déborder
        return { width: 100, height: 35, maxHeight: 'max-h-6' };
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
    img.src = `/logo.png`;
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

      {/* Votre Logo PNG */}
      <div className={`relative z-10 ${maxHeight}`}>
        {imageLoaded ? (
          <img
            src="/logo.png"
            alt="Loft Algérie - Votre Confort Notre Priorité"
            width={width}
            height={height}
            className="object-contain block"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        ) : (
          // Loading placeholder simple
          <div className={`${maxHeight} flex items-center justify-center animate-pulse`} style={{ width, height }}>
            <div className="text-center text-gray-400 text-xs">
              Chargement...
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