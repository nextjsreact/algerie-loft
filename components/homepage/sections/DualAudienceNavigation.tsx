'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Home, 
  Users, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Building2
} from 'lucide-react';

interface DualAudienceNavigationProps {
  locale: string;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

/**
 * Dual-audience navigation component
 * Maintains guest-first navigation while providing subtle owner access
 * Implements requirements 4.1, 4.5
 */
export default function DualAudienceNavigation({ 
  locale, 
  activeSection = 'hero',
  onSectionChange 
}: DualAudienceNavigationProps) {
  const [isOwnerMenuOpen, setIsOwnerMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll to show/hide navigation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Multilingual content
  const content = {
    fr: {
      // Guest-focused navigation (primary)
      guestNav: {
        search: "Rechercher",
        lofts: "Nos lofts",
        reviews: "Avis clients",
        contact: "Contact"
      },
      
      // Owner navigation (secondary, subtle)
      ownerNav: {
        toggle: "Propriétaires",
        overview: "Vue d'ensemble",
        metrics: "Performances",
        evaluation: "Évaluation gratuite",
        testimonials: "Témoignages",
        contact: "Nous contacter"
      },
      
      // Visual indicators
      indicators: {
        guestFocused: "Expérience client",
        ownerSection: "Section propriétaires",
        newFeature: "Nouveau"
      }
    },
    en: {
      guestNav: {
        search: "Search",
        lofts: "Our lofts",
        reviews: "Reviews",
        contact: "Contact"
      },
      
      ownerNav: {
        toggle: "Property owners",
        overview: "Overview",
        metrics: "Performance",
        evaluation: "Free evaluation",
        testimonials: "Testimonials",
        contact: "Contact us"
      },
      
      indicators: {
        guestFocused: "Guest experience",
        ownerSection: "Owner section",
        newFeature: "New"
      }
    },
    ar: {
      guestNav: {
        search: "بحث",
        lofts: "شققنا المفروشة",
        reviews: "آراء العملاء",
        contact: "اتصال"
      },
      
      ownerNav: {
        toggle: "أصحاب العقارات",
        overview: "نظرة عامة",
        metrics: "الأداء",
        evaluation: "تقييم مجاني",
        testimonials: "شهادات",
        contact: "اتصل بنا"
      },
      
      indicators: {
        guestFocused: "تجربة الضيف",
        ownerSection: "قسم المالكين",
        newFeature: "جديد"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const guestNavItems = [
    { id: 'hero', label: text.guestNav.search, icon: Search },
    { id: 'lofts', label: text.guestNav.lofts, icon: Home },
    { id: 'reviews', label: text.guestNav.reviews, icon: Star },
    { id: 'contact', label: text.guestNav.contact, icon: MessageCircle }
  ];

  const ownerNavItems = [
    { id: 'owners', label: text.ownerNav.overview, icon: Building2 },
    { id: 'owner-metrics', label: text.ownerNav.metrics, icon: Users },
    { id: 'owner-evaluation', label: text.ownerNav.evaluation, icon: MessageCircle, badge: text.indicators.newFeature },
    { id: 'owner-testimonials', label: text.ownerNav.testimonials, icon: Star }
  ];

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (onSectionChange) {
        onSectionChange(sectionId);
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Guest-focused navigation (Primary - 80%) */}
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-4 hidden sm:flex">
              {text.indicators.guestFocused}
            </Badge>
            
            {guestNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Owner navigation (Secondary - 20%, subtle) */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOwnerMenuOpen(!isOwnerMenuOpen)}
              className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">{text.ownerNav.toggle}</span>
              {isOwnerMenuOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {/* Owner dropdown menu */}
            <AnimatePresence>
              {isOwnerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      {text.indicators.ownerSection}
                    </Badge>
                  </div>
                  
                  {ownerNavItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleNavClick(item.id);
                          setIsOwnerMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge size="sm" className="bg-orange-100 text-orange-700 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                  
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={() => {
                        handleNavClick('contact');
                        setIsOwnerMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {text.ownerNav.contact}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}