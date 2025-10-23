'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import TextLogo from './TextLogo';

interface LoftAlgerieLogoProps {
  variant?: 'header' | 'hero' | 'footer';
  className?: string;
  showGlow?: boolean;
}

export default function LoftAlgerieLogo({ 
  variant = 'header', 
  className = '',
  showGlow = false 
}: LoftAlgerieLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const logoVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: variant === 'hero' ? 20 : 0
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.05,
      y: prefersReducedMotion ? 0 : -2,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: showGlow ? [0, 0.8, 0] : 0,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const getDimensions = () => {
    switch (variant) {
      case 'hero':
        return { width: 400, height: 160, maxHeight: 'max-h-40' };
      case 'header':
        return { width: 220, height: 88, maxHeight: 'max-h-16' };
      case 'footer':
        return { width: 200, height: 80, maxHeight: 'max-h-14' };
      default:
        return { width: 220, height: 88, maxHeight: 'max-h-16' };
    }
  };

  const { width, height, maxHeight } = getDimensions();

  // Si l'image échoue, utiliser le fallback SVG
  if (imageError) {
    return (
      <motion.div
        className={`relative inline-block ${className}`}
        variants={logoVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        <div className={`relative z-10 ${getDimensions().maxHeight}`}>
          <Image
            src="/logo-fallback.svg"
            alt="Loft Algérie - Votre Confort Notre Priorité"
            width={getDimensions().width}
            height={getDimensions().height}
            className="object-contain transition-all duration-300"
            priority={variant === 'header' || variant === 'hero'}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Golden Glow Effect Spécial pour Votre Logo */}
      {showGlow && !prefersReducedMotion && imageLoaded && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-xl opacity-0"
          style={{
            background: 'radial-gradient(ellipse, rgba(255, 215, 0, 0.6) 0%, rgba(255, 193, 7, 0.4) 50%, transparent 70%)',
            filter: 'blur(20px)'
          }}
          variants={glowVariants}
          animate="animate"
        />
      )}

      {/* Votre Logo */}
      <div className={`relative z-10 ${maxHeight}`}>
        <Image
          src="/logo.jpg"
          alt="Loft Algérie - Votre Confort Notre Priorité"
          width={width}
          height={height}
          className={`object-contain transition-all duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${
            variant === 'hero' ? 'filter brightness-110 contrast-105' : ''
          }`}
          priority={variant === 'header' || variant === 'hero'}
          quality={90}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            filter: variant === 'hero' 
              ? 'drop-shadow(0 10px 25px rgba(255, 215, 0, 0.3)) brightness(1.1)' 
              : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
          }}
        />
      </div>

      {/* Effet de Brillance au Hover */}
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

      {/* Loading Placeholder */}
      {!imageLoaded && !imageError && (
        <div className={`absolute inset-0 ${maxHeight} flex items-center justify-center bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg animate-pulse`}>
          <div className="text-yellow-600 font-bold text-sm">
            LOFT ALGÉRIE
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Variantes spécialisées pour votre logo
export function HeaderLoftLogo({ className = '', ...props }: Omit<LoftAlgerieLogoProps, 'variant'>) {
  return (
    <LoftAlgerieLogo
      variant="header"
      className={className}
      {...props}
    />
  );
}

export function HeroLoftLogo({ className = '', ...props }: Omit<LoftAlgerieLogoProps, 'variant'>) {
  return (
    <LoftAlgerieLogo
      variant="hero"
      showGlow={true}
      className={className}
      {...props}
    />
  );
}

export function FooterLoftLogo({ className = '', ...props }: Omit<LoftAlgerieLogoProps, 'variant'>) {
  return (
    <LoftAlgerieLogo
      variant="footer"
      className={className}
      {...props}
    />
  );
}