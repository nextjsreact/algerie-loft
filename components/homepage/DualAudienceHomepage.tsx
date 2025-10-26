'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DualAudienceLayout, SectionContainer } from '@/components/ui/ResponsiveGrid';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import SmoothScroll from '@/components/ui/SmoothScroll';
import BackToTop from '@/components/ui/BackToTop';
import { useResponsiveAnimations } from '@/hooks/useResponsiveAnimations';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';
import { ConnectionIndicator } from '@/components/ui/ProgressiveLoading';
import { offlineDataManager } from '@/lib/utils/offline-data-manager';

// Import section components (to be created)
import GuestHeroSection from './sections/GuestHeroSection';
import FeaturedLoftsSection from './sections/FeaturedLoftsSection';
import TrustSocialProofSection from './sections/TrustSocialProofSection';
import PropertyOwnerSection from './sections/PropertyOwnerSection';
import ContactSupportSection from './sections/ContactSupportSection';
import DualAudienceNavigation from './sections/DualAudienceNavigation';
import SubtleOwnerCTA from './sections/SubtleOwnerCTA';

// Import integration components
import { BookingSystemGrid } from './booking-system-integration';
import { PropertyManagementSummary } from './property-management-integration';
import { SeamlessAuthIntegration } from './seamless-auth-integration';

interface DualAudienceHomepageProps {
  locale: string;
}

/**
 * Main dual-audience homepage component
 * Implements guest-first design with 70/30 content distribution
 */
export default function DualAudienceHomepage({ locale }: DualAudienceHomepageProps) {
  const { getMotionVariants } = useResponsiveAnimations();
  const [activeSection, setActiveSection] = React.useState('hero');
  
  // Initialize offline support
  const { 
    isOnline, 
    isSlowConnection, 
    serviceWorkerReady,
    preloadCriticalResources 
  } = useOfflineSupport();

  // Preload critical data when component mounts
  React.useEffect(() => {
    if (serviceWorkerReady) {
      // Preload critical resources for offline use
      const criticalUrls = [
        `/${locale}/public`,
        '/logo.png',
        '/logo.jpg'
      ];
      preloadCriticalResources(criticalUrls);
      
      // Preload critical data
      offlineDataManager.preloadCriticalData([locale]);
    }
  }, [serviceWorkerReady, locale, preloadCriticalResources]);

  // Multilingual content
  const content = {
    fr: {
      login: "Connexion",
      clientArea: "Espace Client",
      contact: "Contact",
      allRightsReserved: "Tous droits réservés"
    },
    en: {
      login: "Login",
      clientArea: "Client Area", 
      contact: "Contact",
      allRightsReserved: "All rights reserved"
    },
    ar: {
      login: "تسجيل الدخول",
      clientArea: "منطقة العميل",
      contact: "اتصال", 
      allRightsReserved: "جميع الحقوق محفوظة"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const containerVariants = getMotionVariants('stagger');
  const sectionVariants = getMotionVariants('fade');

  // Guest-focused content (Primary - 70%)
  const guestContent = (
    <>
      {/* Hero Section - Guest Focus */}
      <motion.div variants={sectionVariants}>
        <SectionContainer id="hero" background="default" padding="large">
          <GuestHeroSection locale={locale} />
        </SectionContainer>
      </motion.div>

      {/* Featured Lofts Section */}
      <motion.div variants={sectionVariants}>
        <SectionContainer id="lofts" background="default" padding="large">
          <FeaturedLoftsSection locale={locale} />
        </SectionContainer>
      </motion.div>

      {/* Trust & Social Proof Section */}
      <motion.div variants={sectionVariants}>
        <SectionContainer id="reviews" background="alternate" padding="large">
          <TrustSocialProofSection locale={locale} />
        </SectionContainer>
      </motion.div>
    </>
  );

  // Owner-focused content (Secondary - 30%)
  const ownerContent = (
    <>
      {/* Property Owner Section - Positioned after guest experience (80/20 rule) */}
      <motion.div variants={sectionVariants}>
        <SectionContainer id="owners" background="gradient" padding="large">
          <PropertyOwnerSection 
            locale={locale} 
            showTestimonials={true}
            showMarketAnalysis={false}
            showEvaluationForm={false}
          />
        </SectionContainer>
      </motion.div>
    </>
  );

  return (
    <div 
      dir={locale === 'ar' ? 'rtl' : 'ltr'} 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors"
    >
      <SmoothScroll />
      
      {/* Connection Quality Indicator */}
      <ConnectionIndicator />
      
      {/* Dual-audience navigation - maintains guest-first while providing owner access */}
      <DualAudienceNavigation 
        locale={locale} 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Header */}
      <PublicHeader locale={locale} text={{ login: text.login }} />

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Dual-audience layout with guest-first priority */}
        <DualAudienceLayout
          guestContent={guestContent}
          ownerContent={ownerContent}
        />

        {/* Contact & Support Section - Shared */}
        <motion.div variants={sectionVariants}>
          <SectionContainer id="contact" background="default" padding="large">
            <ContactSupportSection locale={locale} />
          </SectionContainer>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <PublicFooter 
        locale={locale} 
        text={{ 
          clientArea: text.clientArea,
          contact: text.contact,
          allRightsReserved: text.allRightsReserved
        }} 
      />
      
      {/* Subtle Owner CTA - Non-intrusive floating CTA */}
      <SubtleOwnerCTA 
        locale={locale} 
        variant="floating" 
        position="bottom-right"
        showMetrics={true}
      />
      
      <BackToTop />
    </div>
  );
}