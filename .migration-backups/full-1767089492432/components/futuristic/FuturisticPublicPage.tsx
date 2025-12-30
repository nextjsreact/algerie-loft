'use client';

import { motion } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import FuturisticHero from './FuturisticHero';
import CrispSlideCarousel from './CrispSlideCarousel';
import AnimatedServiceCard from './AnimatedServiceCard';
import EnhancedStatsSection from './EnhancedStatsSection';
import AnimatedContact from './AnimatedContact';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import TestimonialsSection from '@/components/public/TestimonialsSection';
import SmoothScroll from '@/components/ui/SmoothScroll';
import BackToTop from '@/components/ui/BackToTop';
import { SectionBackground } from './AnimatedBackground';
import { useResponsiveAnimations } from '@/hooks/useResponsiveAnimations';
import { usePerformanceOptimization, useWebVitals } from '@/hooks/usePerformanceOptimization';

interface FuturisticPublicPageProps {
  locale: string;
}

export default function FuturisticPublicPage({ locale }: FuturisticPublicPageProps) {
  const { getMotionVariants, shouldEnableFeature } = useResponsiveAnimations();
  
  // Initialize performance optimizations
  const {
    isOptimized,
    optimizationProgress,
    audience,
    performanceMetrics,
    preloadImages
  } = usePerformanceOptimization({
    enableImageOptimization: true,
    enableCodeSplitting: true,
    enableCaching: true,
    criticalImages: [
      '/hero-background.jpg',
      '/featured-loft-1.jpg',
      '/featured-loft-2.jpg'
    ]
  });

  // Monitor Core Web Vitals
  const webVitals = useWebVitals();

  // Preload additional images based on audience
  useEffect(() => {
    if (isOptimized && audience === 'guest') {
      preloadImages([
        '/guest-testimonial-1.jpg',
        '/guest-testimonial-2.jpg',
        '/trust-badge-1.png'
      ]);
    } else if (isOptimized && audience === 'owner') {
      preloadImages([
        '/owner-success-story-1.jpg',
        '/revenue-chart-bg.jpg'
      ]);
    }
  }, [isOptimized, audience, preloadImages]);

  // Contenu multilingue
  const content = {
    fr: {
      title: "Gestion Professionnelle de Lofts",
      subtitle: "Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise reconnue.",
      servicesTitle: "Nos Services",
      portfolioTitle: "Notre Portfolio",
      portfolioSubtitle: "Découvrez nos lofts exceptionnels et nos réalisations",
      contactTitle: "Prêt à maximiser vos revenus ?",
      contactDesc: "Contactez-nous pour une consultation gratuite et découvrez comment nous pouvons optimiser la gestion de vos propriétés.",
      discoverServices: "Découvrir nos services",
      contactUs: "Nous contacter",
      login: "Connexion",
      clientArea: "Espace Client",
      contact: "Contact",
      allRightsReserved: "Tous droits réservés",
      property: { title: "Gestion de Propriétés", desc: "Gestion complète de vos biens immobiliers avec suivi personnalisé, optimisation des revenus et maintenance préventive." },
      reservation: { title: "Réservations", desc: "Système de réservation professionnel pour maximiser votre taux d'occupation et automatiser la gestion des clients." },
      revenue: { title: "Optimisation Revenus", desc: "Stratégies personnalisées pour maximiser vos revenus locatifs avec analyse de marché et ajustement des prix." }
    },
    en: {
      title: "Professional Loft Management",
      subtitle: "Professional loft and accommodation management services in Algeria. Maximize your rental income with our recognized expertise.",
      servicesTitle: "Our Services",
      portfolioTitle: "Our Portfolio",
      portfolioSubtitle: "Discover our exceptional lofts and achievements",
      contactTitle: "Ready to maximize your income?",
      contactDesc: "Contact us for a free consultation and discover how we can optimize your property management.",
      discoverServices: "Discover our services",
      contactUs: "Contact us",
      login: "Login",
      clientArea: "Client Area",
      contact: "Contact",
      allRightsReserved: "All rights reserved",
      property: { title: "Property Management", desc: "Complete management of your real estate with personalized monitoring, revenue optimization and preventive maintenance." },
      reservation: { title: "Reservations", desc: "Professional booking system to maximize your occupancy rate and automate client management." },
      revenue: { title: "Revenue Optimization", desc: "Personalized strategies to maximize your rental income with market analysis and price adjustments." }
    },
    ar: {
      title: "إدارة احترافية للشقق المفروشة",
      subtitle: "خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. اعظم عوائدك الإيجارية مع خبرتنا المعترف بها.",
      servicesTitle: "خدماتنا",
      portfolioTitle: "معرض أعمالنا",
      portfolioSubtitle: "اكتشف شققنا المفروشة الاستثنائية وإنجازاتنا",
      contactTitle: "مستعد لزيادة دخلك إلى أقصى حد؟",
      contactDesc: "اتصل بنا للحصول على استشارة مجانية واكتشف كيف يمكننا تحسين إدارة عقاراتك.",
      discoverServices: "اكتشف خدماتنا",
      contactUs: "اتصل بنا",
      login: "تسجيل الدخول",
      clientArea: "منطقة العميل",
      contact: "اتصال",
      allRightsReserved: "جميع الحقوق محفوظة",
      property: { title: "إدارة العقارات", desc: "إدارة شاملة لعقاراتك مع متابعة شخصية وتحسين الإيرادات والصيانة الوقائية." },
      reservation: { title: "الحجوزات", desc: "نظام حجز احترافي لزيادة معدل الإشغال وأتمتة إدارة العملاء." },
      revenue: { title: "تحسين الإيرادات", desc: "استراتيجيات شخصية لزيادة دخلك الإيجاري مع تحليل السوق وتعديل الأسعار." }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const containerVariants = getMotionVariants('stagger');
  const sectionVariants = getMotionVariants('fade');

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SmoothScroll />
      
      {/* Performance optimization loading indicator */}
      {!isOptimized && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${optimizationProgress}%` }}
          />
        </div>
      )}
      
      <PublicHeader locale={locale} text={{ login: text.login }} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.section variants={sectionVariants}>
          <Suspense fallback={
            <div className="h-[600px] bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
          }>
            <FuturisticHero
              locale={locale}
              title={text.title}
              subtitle={text.subtitle}
              ctaButtons={{
                primary: { text: text.discoverServices, href: "#services" },
                secondary: { text: text.contactUs, href: "#contact" }
              }}
            />
          </Suspense>
        </motion.section>

        {/* Portfolio/Carousel Section */}
        <motion.section 
          variants={sectionVariants}
          className="py-16 sm:py-20 lg:py-24 relative"
        >
          <SectionBackground>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <motion.div 
                className="text-center mb-12 sm:mb-16"
                variants={sectionVariants}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold card-text-contrast mb-4">
                  <span className="text-gradient-primary">
                    {text.portfolioTitle}
                  </span>
                </h2>
                <p className="text-lg sm:text-xl service-description-contrast max-w-3xl mx-auto">
                  {text.portfolioSubtitle}
                </p>
              </motion.div>

              {/* Carousel */}
              <motion.div variants={sectionVariants}>
                <Suspense fallback={
                  <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                }>
                  <CrispSlideCarousel 
                    autoPlayInterval={5000}
                    showNavigation={true}
                    showDots={true}
                  />
                </Suspense>
              </motion.div>
            </div>
          </SectionBackground>
        </motion.section>

        {/* Services Section */}
        <motion.section 
          id="services"
          variants={sectionVariants}
          className="py-16 sm:py-20 lg:py-24"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-12 sm:mb-16"
              variants={sectionVariants}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold card-text-contrast mb-4">
                <span className="text-gradient-secondary">
                  {text.servicesTitle}
                </span>
              </h2>
            </motion.div>

            {/* Services Grid */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              variants={containerVariants}
            >
              <motion.div variants={sectionVariants}>
                <AnimatedServiceCard
                  icon="🏢"
                  title={text.property.title}
                  description={text.property.desc}
                  animationDelay={0}
                  glowColor="primary"
                />
              </motion.div>
              
              <motion.div variants={sectionVariants}>
                <AnimatedServiceCard
                  icon="📅"
                  title={text.reservation.title}
                  description={text.reservation.desc}
                  animationDelay={0.2}
                  glowColor="secondary"
                />
              </motion.div>
              
              <motion.div variants={sectionVariants}>
                <AnimatedServiceCard
                  icon="💰"
                  title={text.revenue.title}
                  description={text.revenue.desc}
                  animationDelay={0.4}
                  glowColor="accent"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section variants={sectionVariants}>
          <EnhancedStatsSection locale={locale} />
        </motion.section>

        {/* Testimonials Section */}
        <motion.section variants={sectionVariants}>
          <SectionBackground className="py-16 sm:py-20 lg:py-24">
            <TestimonialsSection locale={locale} />
          </SectionBackground>
        </motion.section>

        {/* Contact Section */}
        <motion.section 
          id="contact"
          variants={sectionVariants}
        >
          <AnimatedContact
            locale={locale}
            contactTitle={text.contactTitle}
            contactDesc={text.contactDesc}
          />
        </motion.section>
      </motion.main>

      <PublicFooter 
        locale={locale} 
        text={{ 
          clientArea: text.clientArea,
          contact: text.contact,
          allRightsReserved: text.allRightsReserved
        }} 
      />
      
      <BackToTop />
      

    </div>
  );
}