'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useAnimationSystem';

interface TextLogoProps {
  variant?: 'header' | 'hero' | 'footer';
  className?: string;
  showGlow?: boolean;
}

export default function TextLogo({ 
  variant = 'header', 
  className = '',
  showGlow = false 
}: TextLogoProps) {
  const prefersReducedMotion = useReducedMotion();

  const logoVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.05,
      transition: { duration: 0.3 }
    }
  };

  const getSize = () => {
    switch (variant) {
      case 'hero':
        return 'text-4xl md:text-5xl';
      case 'header':
        return 'text-xl md:text-2xl';
      case 'footer':
        return 'text-lg md:text-xl';
      default:
        return 'text-xl';
    }
  };

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Golden Glow Effect */}
      {showGlow && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-lg blur-lg opacity-0"
          animate={{
            opacity: [0, 0.5, 0],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      )}

      {/* Logo Text */}
      <div className="relative z-10 text-center">
        {/* Building Icon */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            {/* Buildings */}
            <div className="flex items-end gap-1">
              <div className="w-3 h-8 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t"></div>
              <div className="w-4 h-10 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t"></div>
              <div className="w-3 h-6 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t"></div>
            </div>
            {/* Base */}
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-600 to-yellow-400 mt-1"></div>
          </div>
        </div>

        {/* Main Text */}
        <h1 className={`${getSize()} font-bold text-gradient-primary leading-tight`}>
          LOFT ALGERIE
        </h1>
        
        {/* Subtitle for larger variants */}
        {(variant === 'hero' || variant === 'header') && (
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
            VOTRE CONFORT NOTRE PRIORITÉ
          </p>
        )}
      </div>
    </motion.div>
  );
}