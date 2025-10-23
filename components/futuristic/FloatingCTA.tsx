'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useAnimationSystem';

interface FloatingCTAProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function FloatingCTA({
  href,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  onClick,
  className = ''
}: FloatingCTAProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    // Create ripple effect
    if (!prefersReducedMotion && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = {
        id: Date.now(),
        x,
        y
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  };

  const getVariantClasses = () => {
    const baseClasses = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 overflow-hidden';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-gradient-primary text-white shadow-lg hover:shadow-xl glow-primary`;
      case 'secondary':
        return `${baseClasses} bg-gradient-secondary text-white shadow-lg hover:shadow-xl glow-secondary`;
      case 'outline':
        return `${baseClasses} border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/10`;
      case 'glass':
        return `${baseClasses} glass text-white border border-white/20 hover:border-white/40`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'md':
        return 'px-6 py-3 text-base';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: prefersReducedMotion ? 1 : 1.05,
      y: prefersReducedMotion ? 0 : -2
    },
    tap: { 
      scale: prefersReducedMotion ? 1 : 0.95 
    }
  };

  const iconVariants = {
    initial: { rotate: 0 },
    hover: { 
      rotate: prefersReducedMotion ? 0 : 360,
      transition: { duration: 0.6 }
    }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <motion.a
      ref={buttonRef}
      href={disabled || loading ? undefined : href}
      className={`${getVariantClasses()} ${getSizeClasses()} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Background Gradient Animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-accent opacity-0"
        animate={{ opacity: isHovered && !prefersReducedMotion ? 0.3 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <motion.div
            variants={loadingVariants}
            animate="animate"
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : icon ? (
          <motion.span variants={iconVariants}>
            {icon}
          </motion.span>
        ) : null}
        
        <motion.span
          animate={!prefersReducedMotion && isHovered ? { x: 2 } : { x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
      </span>

      {/* Shine Effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.a>
  );
}

// Specialized CTA components
export function PrimaryCTA({ children, ...props }: Omit<FloatingCTAProps, 'variant'>) {
  return (
    <FloatingCTA variant="primary" {...props}>
      {children}
    </FloatingCTA>
  );
}

export function SecondaryCTA({ children, ...props }: Omit<FloatingCTAProps, 'variant'>) {
  return (
    <FloatingCTA variant="secondary" {...props}>
      {children}
    </FloatingCTA>
  );
}

export function GlassCTA({ children, ...props }: Omit<FloatingCTAProps, 'variant'>) {
  return (
    <FloatingCTA variant="glass" {...props}>
      {children}
    </FloatingCTA>
  );
}