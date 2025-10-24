'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useAnimationSystem, useReducedMotion } from '@/hooks/useAnimationSystem';

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  icon?: string;
}

interface EnhancedStatsSectionProps {
  locale: string;
  className?: string;
}

// Animated counter component
function AnimatedCounter({ 
  value, 
  duration = 2, 
  prefix = '', 
  suffix = '' 
}: { 
  value: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string; 
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isInView) {
      if (prefersReducedMotion) {
        setDisplayValue(value);
      } else {
        motionValue.set(value);
      }
    }
  }, [isInView, value, motionValue, prefersReducedMotion]);

  useEffect(() => {
    if (!prefersReducedMotion) {
      const unsubscribe = springValue.on('change', (latest) => {
        setDisplayValue(Math.round(latest));
      });
      return unsubscribe;
    }
  }, [springValue, prefersReducedMotion]);

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Individual stat card component
function StatCard({ 
  stat, 
  index, 
  locale 
}: { 
  stat: StatItem; 
  index: number; 
  locale: string; 
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { animateOnScroll } = useAnimationSystem();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (cardRef.current) {
      animateOnScroll(cardRef.current);
    }
  }, [animateOnScroll]);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.2,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.2,
      rotate: prefersReducedMotion ? 0 : 360,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-stagger="true"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl glow-primary opacity-0"
        animate={{ opacity: isHovered && !prefersReducedMotion ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main Card */}
      <div className="relative glass-strong rounded-xl p-6 sm:p-8 text-center backdrop-blur-xl border border-white/20 overflow-hidden">
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
        
        {/* Floating Particles */}
        {!prefersReducedMotion && isHovered && (
          <>
            <motion.div
              className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                y: [-10, -20, -10],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-purple-400 rounded-full"
              animate={{
                y: [10, 20, 10],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          {stat.icon && (
            <motion.div
              className="text-3xl sm:text-4xl mb-3 sm:mb-4"
              variants={iconVariants}
              initial="initial"
              animate={isHovered ? 'hover' : 'initial'}
            >
              {stat.icon}
            </motion.div>
          )}

          {/* Value */}
          <motion.div
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-primary mb-2 sm:mb-3"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.2 + 0.3, duration: 0.4 }}
          >
            <AnimatedCounter
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              duration={2 + index * 0.3}
            />
          </motion.div>

          {/* Label */}
          <motion.p
            className="text-sm sm:text-base service-description-contrast font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 + 0.5, duration: 0.4 }}
          >
            {stat.label}
          </motion.p>
        </div>

        {/* Animated Border */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-transparent"
          animate={{
            borderColor: isHovered && !prefersReducedMotion 
              ? ['rgba(102, 126, 234, 0)', 'rgba(102, 126, 234, 0.8)', 'rgba(102, 126, 234, 0)']
              : 'rgba(102, 126, 234, 0)'
          }}
          transition={{
            duration: 2,
            repeat: isHovered ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
}

export default function EnhancedStatsSection({ locale, className = '' }: EnhancedStatsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { animateOnScroll } = useAnimationSystem();

  useEffect(() => {
    if (sectionRef.current) {
      animateOnScroll(sectionRef.current);
    }
  }, [animateOnScroll]);

  // Multilingual stats data
  const statsData = {
    fr: [
      { value: 150, label: 'Lofts Gérés', suffix: '+', icon: '🏠' },
      { value: 98, label: 'Taux de Satisfaction', suffix: '%', icon: '⭐' },
      { value: 5, label: 'Années d\'Expérience', suffix: '+', icon: '📅' },
      { value: 24, label: 'Support Client', suffix: 'h/7j', icon: '🔧' }
    ],
    en: [
      { value: 150, label: 'Managed Lofts', suffix: '+', icon: '🏠' },
      { value: 98, label: 'Satisfaction Rate', suffix: '%', icon: '⭐' },
      { value: 5, label: 'Years of Experience', suffix: '+', icon: '📅' },
      { value: 24, label: 'Customer Support', suffix: 'h/7d', icon: '🔧' }
    ],
    ar: [
      { value: 150, label: 'شقة مُدارة', suffix: '+', icon: '🏠' },
      { value: 98, label: 'معدل الرضا', suffix: '%', icon: '⭐' },
      { value: 5, label: 'سنوات الخبرة', suffix: '+', icon: '📅' },
      { value: 24, label: 'دعم العملاء', suffix: 'س/7أ', icon: '🔧' }
    ]
  };

  const stats = statsData[locale as keyof typeof statsData] || statsData.fr;

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section 
      ref={sectionRef}
      className={`py-16 sm:py-20 lg:py-24 relative overflow-hidden ${className}`}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-primary rounded-full opacity-5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-secondary rounded-full opacity-5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Section Title */}
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            variants={titleVariants}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="text-gradient-primary">
                {locale === 'fr' ? 'Nos Résultats' : 
                 locale === 'en' ? 'Our Results' : 
                 'نتائجنا'}
              </span>
            </h2>
            <p className="text-lg sm:text-xl service-description-contrast max-w-3xl mx-auto">
              {locale === 'fr' ? 'Des chiffres qui témoignent de notre expertise et de la confiance de nos clients' :
               locale === 'en' ? 'Numbers that demonstrate our expertise and our clients\' trust' :
               'أرقام تشهد على خبرتنا وثقة عملائنا'}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                stat={stat}
                index={index}
                locale={locale}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}