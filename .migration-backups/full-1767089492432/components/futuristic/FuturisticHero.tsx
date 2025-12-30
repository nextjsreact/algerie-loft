'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HeroBackground } from './AnimatedBackground';
import { useAnimationSystem, useReducedMotion } from '@/hooks/useAnimationSystem';
import { HeroLogo } from './AnimatedLogo';
import RobustLogo from './RobustLogo';

interface FuturisticHeroProps {
  locale: string;
  title: string;
  subtitle: string;
  ctaButtons: {
    primary: { text: string; href: string };
    secondary: { text: string; href: string };
  };
}

export default function FuturisticHero({ locale, title, subtitle, ctaButtons }: FuturisticHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { animateOnScroll } = useAnimationSystem();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (heroRef.current) {
      animateOnScroll(heroRef.current);
    }
  }, [animateOnScroll]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <HeroBackground className="flex items-center justify-center">
      <div 
        ref={heroRef}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Logo */}
          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <RobustLogo variant="hero" showGlow={true} className="mx-auto" />
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="text-adaptive-contrast">
              {title}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl lg:text-2xl subtitle-contrast max-w-4xl mx-auto leading-relaxed px-4"
          >
            {subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto"
          >
            <motion.a
              href={ctaButtons.primary.href}
              className="group relative px-8 py-4 bg-gradient-primary text-white font-semibold rounded-xl shadow-lg hover-glow hover-scale transition-all duration-300 overflow-hidden"
              whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
            >
              <span className="relative z-10">{ctaButtons.primary.text}</span>
              <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.a>

            <motion.a
              href={ctaButtons.secondary.href}
              className="group relative px-8 py-4 glass text-white font-semibold rounded-xl hover-float transition-all duration-300 border border-white/20"
              whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
            >
              <span className="relative z-10">{ctaButtons.secondary.text}</span>
            </motion.a>
          </motion.div>

          {/* Floating Elements */}
          {!prefersReducedMotion && (
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-accent rounded-full opacity-20 blur-xl"
            />
          )}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={!prefersReducedMotion ? { y: [0, 10, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={!prefersReducedMotion ? { y: [0, 12, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </HeroBackground>
  );
}