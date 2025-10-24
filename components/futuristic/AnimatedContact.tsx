'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useAnimationSystem, useReducedMotion } from '@/hooks/useAnimationSystem';
import FloatingCTA, { GlassCTA } from './FloatingCTA';

interface AnimatedContactProps {
  locale: string;
  contactTitle: string;
  contactDesc: string;
  className?: string;
}

interface ContactMethod {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  type: 'email' | 'phone' | 'address';
}

export default function AnimatedContact({
  locale,
  contactTitle,
  contactDesc,
  className = ''
}: AnimatedContactProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const { animateOnScroll } = useAnimationSystem();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (sectionRef.current) {
      animateOnScroll(sectionRef.current);
    }
  }, [animateOnScroll]);

  // Multilingual contact data
  const contactData = {
    fr: {
      methods: [
        {
          icon: <Mail size={24} />,
          label: 'Email',
          value: 'contact@loftalgerie.com',
          href: 'mailto:contact@loftalgerie.com',
          type: 'email' as const
        },
        {
          icon: <Phone size={24} />,
          label: 'Téléphone',
          value: '+213 123 456 789',
          href: 'tel:+213123456789',
          type: 'phone' as const
        },
        {
          icon: <MapPin size={24} />,
          label: 'Adresse',
          value: 'Alger, Algérie',
          href: 'https://maps.google.com/?q=Alger,Algeria',
          type: 'address' as const
        }
      ],
      cta: {
        primary: 'Nous Contacter',
        secondary: 'Demander un Devis'
      }
    },
    en: {
      methods: [
        {
          icon: <Mail size={24} />,
          label: 'Email',
          value: 'contact@loftalgerie.com',
          href: 'mailto:contact@loftalgerie.com',
          type: 'email' as const
        },
        {
          icon: <Phone size={24} />,
          label: 'Phone',
          value: '+213 123 456 789',
          href: 'tel:+213123456789',
          type: 'phone' as const
        },
        {
          icon: <MapPin size={24} />,
          label: 'Address',
          value: 'Algiers, Algeria',
          href: 'https://maps.google.com/?q=Algiers,Algeria',
          type: 'address' as const
        }
      ],
      cta: {
        primary: 'Contact Us',
        secondary: 'Request Quote'
      }
    },
    ar: {
      methods: [
        {
          icon: <Mail size={24} />,
          label: 'البريد الإلكتروني',
          value: 'contact@loftalgerie.com',
          href: 'mailto:contact@loftalgerie.com',
          type: 'email' as const
        },
        {
          icon: <Phone size={24} />,
          label: 'الهاتف',
          value: '+213 123 456 789',
          href: 'tel:+213123456789',
          type: 'phone' as const
        },
        {
          icon: <MapPin size={24} />,
          label: 'العنوان',
          value: 'الجزائر العاصمة، الجزائر',
          href: 'https://maps.google.com/?q=Algiers,Algeria',
          type: 'address' as const
        }
      ],
      cta: {
        primary: 'اتصل بنا',
        secondary: 'طلب عرض سعر'
      }
    }
  };

  const data = contactData[locale as keyof typeof contactData] || contactData.fr;

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

  const itemVariants = {
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

  const ContactMethodCard = ({ method, index }: { method: ContactMethod; index: number }) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardVariants = {
      hidden: { opacity: 0, scale: 0.8, y: 50 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.6,
          delay: index * 0.1,
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
      <motion.a
        href={method.href}
        target={method.type === 'address' ? '_blank' : undefined}
        rel={method.type === 'address' ? 'noopener noreferrer' : undefined}
        className="block group"
        variants={cardVariants}
        onMouseEnter={() => {
          setIsHovered(true);
          setHoveredMethod(method.type);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredMethod(null);
        }}
        whileHover={!prefersReducedMotion ? { scale: 1.05, y: -5 } : {}}
        whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-xl glow-accent opacity-0"
          animate={{ opacity: isHovered && !prefersReducedMotion ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Main Card */}
        <div className="relative glass-strong rounded-xl p-6 backdrop-blur-xl border border-white/20 overflow-hidden">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-accent rounded-full -translate-y-10 translate-x-10" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center gap-4">
            
            {/* Icon */}
            <motion.div
              className="flex-shrink-0 w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center text-white"
              variants={iconVariants}
              initial="initial"
              animate={isHovered ? 'hover' : 'initial'}
            >
              {method.icon}
            </motion.div>

            {/* Info */}
            <div className="flex-grow min-w-0">
              <h4 className="font-semibold card-text-contrast mb-1">
                {method.label}
              </h4>
              <p className="text-sm service-description-contrast truncate">
                {method.value}
              </p>
            </div>

            {/* Arrow */}
            <motion.div
              className="flex-shrink-0 text-gray-400"
              animate={!prefersReducedMotion && isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Send size={16} />
            </motion.div>
          </div>

          {/* Animated Border */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-transparent"
            animate={{
              borderColor: isHovered && !prefersReducedMotion 
                ? ['rgba(79, 172, 254, 0)', 'rgba(79, 172, 254, 0.8)', 'rgba(79, 172, 254, 0)']
                : 'rgba(79, 172, 254, 0)'
            }}
            transition={{
              duration: 2,
              repeat: isHovered ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.a>
    );
  };

  return (
    <section 
      ref={sectionRef}
      className={`py-16 sm:py-20 lg:py-24 relative overflow-hidden ${className}`}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-primary rounded-full opacity-10 blur-2xl"
          animate={!prefersReducedMotion ? {
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          } : {}}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-secondary rounded-full opacity-10 blur-2xl"
          animate={!prefersReducedMotion ? {
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          } : {}}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Content Card */}
          <div className="glass-strong rounded-2xl p-8 sm:p-12 lg:p-16 backdrop-blur-xl border border-white/20">
            
            {/* Header */}
            <motion.div 
              className="text-center mb-12"
              variants={itemVariants}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="text-gradient-primary">
                  {contactTitle}
                </span>
              </h2>
              <p className="text-lg sm:text-xl service-description-contrast max-w-3xl mx-auto leading-relaxed">
                {contactDesc}
              </p>
            </motion.div>

            {/* Contact Methods */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
              variants={itemVariants}
            >
              {data.methods.map((method, index) => (
                <ContactMethodCard
                  key={method.type}
                  method={method}
                  index={index}
                />
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <FloatingCTA
                href="mailto:contact@loftalgerie.com"
                variant="primary"
                size="lg"
                icon={<Mail size={20} />}
              >
                {data.cta.primary}
              </FloatingCTA>

              <GlassCTA
                href="#services"
                size="lg"
                icon={<Send size={20} />}
              >
                {data.cta.secondary}
              </GlassCTA>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}