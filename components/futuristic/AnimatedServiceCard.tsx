'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimationSystem, useReducedMotion } from '@/hooks/useAnimationSystem';

interface AnimatedServiceCardProps {
  icon: string;
  title: string;
  description: string;
  animationDelay?: number;
  glowColor?: string;
  hoverScale?: number;
  className?: string;
}

export default function AnimatedServiceCard({
  icon,
  title,
  description,
  animationDelay = 0,
  glowColor = 'primary',
  hoverScale = 1.05,
  className = ''
}: AnimatedServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { animateOnScroll, triggerHover } = useAnimationSystem();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (cardRef.current) {
      animateOnScroll(cardRef.current);
    }
  }, [animateOnScroll]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (cardRef.current) {
      triggerHover(cardRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: animationDelay,
        ease: "easeOut"
      }
    },
    hover: {
      scale: prefersReducedMotion ? 1 : hoverScale,
      y: prefersReducedMotion ? 0 : -8,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    initial: { 
      scale: 1,
      rotate: 0
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.2,
      rotate: prefersReducedMotion ? 0 : 360,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: animationDelay + 0.2
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    hover: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  const getGlowClass = () => {
    switch (glowColor) {
      case 'primary':
        return 'glow-primary';
      case 'secondary':
        return 'glow-secondary';
      case 'accent':
        return 'glow-accent';
      default:
        return 'glow-primary';
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative group ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-stagger="true"
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${getGlowClass()} opacity-0`}
        variants={glowVariants}
        animate={isHovered ? 'hover' : 'initial'}
      />

      {/* Main Card */}
      <div className="relative glass-strong rounded-xl p-6 sm:p-8 h-full backdrop-blur-xl border border-white/20 overflow-hidden">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-secondary rounded-full translate-y-12 -translate-x-12" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center h-full">
          
          {/* Icon */}
          <motion.div
            className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6"
            variants={iconVariants}
            initial="initial"
            animate={isHovered ? 'hover' : 'initial'}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-xl sm:text-2xl font-bold card-text-contrast mb-3 sm:mb-4"
            variants={contentVariants}
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-sm sm:text-base service-description-contrast leading-relaxed flex-grow"
            variants={contentVariants}
          >
            {description}
          </motion.p>

          {/* Animated Border */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-transparent"
            animate={{
              borderColor: isHovered && !prefersReducedMotion 
                ? ['rgba(102, 126, 234, 0)', 'rgba(102, 126, 234, 0.5)', 'rgba(102, 126, 234, 0)']
                : 'rgba(102, 126, 234, 0)'
            }}
            transition={{
              duration: 2,
              repeat: isHovered ? Infinity : 0,
              ease: "easeInOut"
            }}
          />

          {/* Shine Effect */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0"
              animate={{
                x: isHovered ? ['0%', '100%'] : '0%',
                opacity: isHovered ? [0, 1, 0] : 0
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Specialized service card variants
export function PropertyServiceCard({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <AnimatedServiceCard
      icon="🏢"
      title="Gestion de Propriétés"
      description="Gestion complète de vos biens immobiliers avec suivi personnalisé, optimisation des revenus et maintenance préventive."
      animationDelay={animationDelay}
      glowColor="primary"
    />
  );
}

export function ReservationServiceCard({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <AnimatedServiceCard
      icon="📅"
      title="Réservations"
      description="Système de réservation professionnel pour maximiser votre taux d'occupation et automatiser la gestion des clients."
      animationDelay={animationDelay}
      glowColor="secondary"
    />
  );
}

export function RevenueServiceCard({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <AnimatedServiceCard
      icon="💰"
      title="Optimisation Revenus"
      description="Stratégies personnalisées pour maximiser vos revenus locatifs avec analyse de marché et ajustement des prix."
      animationDelay={animationDelay}
      glowColor="accent"
    />
  );
}