'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useAnimationSystem';

interface LogoLoadingIndicatorProps {
  width: number;
  height: number;
  variant?: 'header' | 'hero' | 'footer';
  className?: string;
}

export default function LogoLoadingIndicator({
  width,
  height,
  variant = 'header',
  className = ''
}: LogoLoadingIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  const getLoadingSize = () => {
    switch (variant) {
      case 'hero':
        return { spinner: 32, text: 'text-base' };
      case 'header':
        return { spinner: 24, text: 'text-sm' };
      case 'footer':
        return { spinner: 20, text: 'text-xs' };
      default:
        return { spinner: 24, text: 'text-sm' };
    }
  };

  const { spinner: spinnerSize, text: textSize } = getLoadingSize();

  const spinnerVariants = {
    animate: {
      rotate: prefersReducedMotion ? 0 : 360,
      transition: {
        duration: prefersReducedMotion ? 0 : 1,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: "linear"
      }
    }
  };

  const pulseVariants = {
    animate: {
      opacity: prefersReducedMotion ? 0.7 : [0.4, 1, 0.4],
      scale: prefersReducedMotion ? 1 : [1, 1.05, 1],
      transition: {
        duration: prefersReducedMotion ? 0 : 2,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: "easeInOut"
      }
    }
  };

  const shimmerVariants = {
    animate: {
      x: prefersReducedMotion ? 0 : [-100, 100],
      transition: {
        duration: prefersReducedMotion ? 0 : 1.5,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Chargement du logo"
    >
      {/* Background skeleton */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg overflow-hidden"
        variants={pulseVariants}
        animate="animate"
      >
        {/* Shimmer effect */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            variants={shimmerVariants}
            animate="animate"
          />
        )}
      </motion.div>

      {/* Loading content */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* Spinner */}
        <motion.div
          className="border-2 border-gray-300 border-t-yellow-400 rounded-full"
          style={{ width: spinnerSize, height: spinnerSize }}
          variants={spinnerVariants}
          animate="animate"
        />

        {/* Loading text */}
        <motion.span
          className={`${textSize} font-medium text-gray-600`}
          variants={pulseVariants}
          animate="animate"
        >
          Chargement...
        </motion.span>
      </div>

      {/* Accessibility: Screen reader text */}
      <span className="sr-only">
        Logo de Loft Algérie en cours de chargement
      </span>
    </div>
  );
}

// Specialized variants for different logo types
export function HeaderLogoLoading({ className = '', ...props }: Omit<LogoLoadingIndicatorProps, 'variant'>) {
  return (
    <LogoLoadingIndicator
      variant="header"
      width={200}
      height={60}
      className={`${className} max-h-12`}
      {...props}
    />
  );
}

export function HeroLogoLoading({ className = '', ...props }: Omit<LogoLoadingIndicatorProps, 'variant'>) {
  return (
    <LogoLoadingIndicator
      variant="hero"
      width={350}
      height={140}
      className={`${className} max-h-32`}
      {...props}
    />
  );
}

export function FooterLogoLoading({ className = '', ...props }: Omit<LogoLoadingIndicatorProps, 'variant'>) {
  return (
    <LogoLoadingIndicator
      variant="footer"
      width={180}
      height={72}
      className={`${className} max-h-16`}
      {...props}
    />
  );
}