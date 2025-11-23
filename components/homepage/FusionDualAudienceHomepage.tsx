'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Star, MapPin, Wifi, Car, Coffee, Tv, Users, Phone, Mail, Calendar, Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import SmoothScroll from '@/components/ui/SmoothScroll';
import BackToTop from '@/components/ui/BackToTop';
import Image from 'next/image';
import { useResponsiveAnimations } from '@/hooks/useResponsiveAnimations';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { PartnerLogos } from './PartnerLogos';

interface FusionDualAudienceHomepageProps {
  locale: string;
}

// Images pour le carrousel hero avec textes
const heroSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&h=1080&fit=crop",
    title: {
      fr: "Loft Moderne Hydra",
      en: "Modern Hydra Loft",
      ar: "شقة حديثة في حيدرة"
    },
    subtitle: {
      fr: "Vue panoramique sur la baie d'Alger",
      en: "Panoramic view of Algiers bay",
      ar: "إطلالة بانورامية على خليج الجزائر"
    },
    price: "25,000 DZD/nuit"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&h=1080&fit=crop",
    title: {
      fr: "Penthouse Luxury Oran",
      en: "Luxury Penthouse Oran",
      ar: "بنتهاوس فاخر وهران"
    },
    subtitle: {
      fr: "Design contemporain au cœur d'Oran",
      en: "Contemporary design in the heart of Oran",
      ar: "تصميم معاصر في قلب وهران"
    },
    price: "45,000 DZD/nuit"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&h=1080&fit=crop",
    title: {
      fr: "Loft Artistique Constantine",
      en: "Artistic Loft Constantine",
      ar: "شقة فنية قسنطينة"
    },
    subtitle: {
      fr: "Charme historique et modernité",
      en: "Historic charm meets modernity",
      ar: "سحر تاريخي يلتقي بالحداثة"
    },
    price: "18,000 DZD/nuit"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop",
    title: {
      fr: "Suite Présidentielle Alger",
      en: "Presidential Suite Algiers",
      ar: "جناح رئاسي الجزائر"
    },
    subtitle: {
      fr: "Luxe absolu avec service conciergerie",
      en: "Absolute luxury with concierge service",
      ar: "رفاهية مطلقة مع خدمة الكونسيرج"
    },
    price: "65,000 DZD/nuit"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&h=1080&fit=crop",
    title: {
      fr: "Villa Moderne Tipaza",
      en: "Modern Villa Tipaza",
      ar: "فيلا حديثة تيبازة"
    },
    subtitle: {
      fr: "Face à la mer Méditerranée",
      en: "Facing the Mediterranean Sea",
      ar: "مواجهة للبحر الأبيض المتوسط"
    },
    price: "55,000 DZD/nuit"
  }
];

// Données réelles de lofts algériens
const realLofts = [
  {
    id: 1,
    title: {
      fr: "Loft Moderne Hydra - Vue Panoramique",
      en: "Modern Hydra Loft - Panoramic View", 
      ar: "شقة حديثة في حيدرة - إطلالة بانورامية"
    },
    location: {
      fr: "Hydra, Alger",
      en: "Hydra, Algiers",
      ar: "حيدرة، الجزائر"
    },
    description: {
      fr: "Magnifique loft de 120m² avec terrasse privée et vue imprenable sur la baie d'Alger.",
      en: "Beautiful 120m² loft with private terrace and stunning view of Algiers bay.",
      ar: "شقة جميلة 120 متر مربع مع تراس خاص وإطلالة خلابة على خليج الجزائر."
    },
    price: 25000,
    currency: "DZD",
    rating: 4.8,
    reviews: 127,
    amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop"
  },
  {
    id: 2,
    title: {
      fr: "Penthouse Luxury Oran Centre",
      en: "Luxury Penthouse Oran Center",
      ar: "بنتهاوس فاخر وسط وهران"
    },
    location: {
      fr: "Centre-ville, Oran",
      en: "City Center, Oran", 
      ar: "وسط المدينة، وهران"
    },
    description: {
      fr: "Penthouse exceptionnel de 180m² au cœur d'Oran. Design contemporain, 3 chambres.",
      en: "Exceptional 180m² penthouse in the heart of Oran. Contemporary design, 3 bedrooms.",
      ar: "بنتهاوس استثنائي 180 متر مربع في قلب وهران. تصميم معاصر، 3 غرف نوم."
    },
    price: 45000,
    currency: "DZD", 
    rating: 4.9,
    reviews: 89,
    amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop"
  },
  {
    id: 3,
    title: {
      fr: "Loft Artistique Constantine",
      en: "Artistic Loft Constantine",
      ar: "شقة فنية في قسنطينة"
    },
    location: {
      fr: "Vieille ville, Constantine",
      en: "Old City, Constantine",
      ar: "المدينة القديمة، قسنطينة"
    },
    description: {
      fr: "Loft unique de 95m² dans un bâtiment historique rénové. Plafonds hauts.",
      en: "Unique 95m² loft in a renovated historic building. High ceilings.",
      ar: "شقة فريدة 95 متر مربع في مبنى تاريخي مجدد. أسقف عالية."
    },
    price: 18000,
    currency: "DZD",
    rating: 4.7,
    reviews: 156,
    amenities: ['Wifi', 'Coffee', 'Tv'],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop"
  }
];

const AmenityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Wifi': return <Wifi className="w-4 h-4" />;
    case 'Car': return <Car className="w-4 h-4" />;
    case 'Coffee': return <Coffee className="w-4 h-4" />;
    case 'Tv': return <Tv className="w-4 h-4" />;
    default: return null;
  }
};

export default function FusionDualAudienceHomepage({ locale }: FusionDualAudienceHomepageProps) {
  const { getMotionVariants } = useResponsiveAnimations();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDates, setSearchDates] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Initialize performance optimizations - Temporarily disabled to fix infinite loop
  const isOptimized = true;
  const optimizationProgress = 100;
  const audience = 'guest';
  const preloadImages = () => {};

  // Carrousel auto-play avec contrôle
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Navigation functions for carousel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Contenu multilingue complet
  const content = {
    fr: {
      title: "Découvrez les Plus Beaux Lofts d'Algérie",
      subtitle: "Réservez votre séjour idéal dans nos lofts sélectionnés avec soin à Alger, Oran et Constantine.",
      searchPlaceholder: "Où souhaitez-vous séjourner ?",
      guestsLabel: "Voyageurs",
      searchButton: "Rechercher des Lofts",
      discoverLofts: "Découvrir nos Lofts",
      becomePartner: "Devenir Partenaire",
      login: "Connexion",
      
      // Stats
      happyGuests: "Clients Satisfaits",
      loftsAvailable: "Lofts Disponibles",
      citiesCovered: "Villes Couvertes",
      avgRating: "Note Moyenne",
      
      // Featured section
      featuredTitle: "Lofts Recommandés",
      featuredSubtitle: "Nos hébergements les mieux notés par nos clients",
      perNight: "/nuit",
      bookNow: "Réserver",
      
      // Services
      servicesTitle: "Nos Services",
      propertyTitle: "Gestion de Propriétés",
      propertyDesc: "Gestion complète de vos biens immobiliers avec suivi personnalisé.",
      reservationTitle: "Réservations",
      reservationDesc: "Système de réservation professionnel pour maximiser votre taux d'occupation.",
      revenueTitle: "Optimisation Revenus",
      revenueDesc: "Stratégies personnalisées pour maximiser vos revenus locatifs.",
      
      // Owner section
      ownerTitle: "Propriétaires : Maximisez vos Revenus",
      ownerSubtitle: "Confiez-nous la gestion de votre bien et générez jusqu'à 40% de revenus supplémentaires",
      
      // Contact
      contactTitle: "Prêt à maximiser vos revenus ?",
      contactDesc: "Contactez-nous pour une consultation gratuite.",
      contactUs: "Nous contacter",
      
      // Footer
      allRightsReserved: "Tous droits réservés"
    },
    en: {
      title: "Discover Algeria's Most Beautiful Lofts",
      subtitle: "Book your ideal stay in our carefully selected lofts in Algiers, Oran and Constantine.",
      searchPlaceholder: "Where would you like to stay?",
      guestsLabel: "Guests",
      searchButton: "Search Lofts",
      discoverLofts: "Discover our Lofts",
      becomePartner: "Become a Partner",
      login: "Login",
      
      happyGuests: "Happy Guests",
      loftsAvailable: "Available Lofts",
      citiesCovered: "Cities Covered",
      avgRating: "Average Rating",
      
      featuredTitle: "Recommended Lofts",
      featuredSubtitle: "Our highest-rated accommodations by our guests",
      perNight: "/night",
      bookNow: "Book Now",
      
      servicesTitle: "Our Services",
      propertyTitle: "Property Management",
      propertyDesc: "Complete management of your real estate with personalized monitoring.",
      reservationTitle: "Reservations",
      reservationDesc: "Professional booking system to maximize your occupancy rate.",
      revenueTitle: "Revenue Optimization",
      revenueDesc: "Personalized strategies to maximize your rental income.",
      
      ownerTitle: "Property Owners: Maximize Your Income",
      ownerSubtitle: "Trust us with your property management and generate up to 40% additional revenue",
      
      contactTitle: "Ready to maximize your income?",
      contactDesc: "Contact us for a free consultation.",
      contactUs: "Contact us",
      
      allRightsReserved: "All rights reserved"
    },
    ar: {
      title: "اكتشف أجمل الشقق المفروشة في الجزائر",
      subtitle: "احجز إقامتك المثالية في شققنا المختارة بعناية في الجزائر ووهران وقسنطينة.",
      searchPlaceholder: "أين تريد الإقامة؟",
      guestsLabel: "الضيوف",
      searchButton: "البحث عن الشقق",
      discoverLofts: "اكتشف شققنا",
      becomePartner: "كن شريكاً",
      login: "تسجيل الدخول",
      
      happyGuests: "ضيوف راضون",
      loftsAvailable: "شقق متاحة",
      citiesCovered: "مدن مغطاة",
      avgRating: "التقييم المتوسط",
      
      featuredTitle: "الشقق الموصى بها",
      featuredSubtitle: "أعلى أماكن الإقامة تقييماً من ضيوفنا",
      perNight: "/ليلة",
      bookNow: "احجز الآن",
      
      servicesTitle: "خدماتنا",
      propertyTitle: "إدارة العقارات",
      propertyDesc: "إدارة شاملة لعقاراتك مع متابعة شخصية.",
      reservationTitle: "الحجوزات",
      reservationDesc: "نظام حجز احترافي لزيادة معدل الإشغال.",
      revenueTitle: "تحسين الإيرادات",
      revenueDesc: "استراتيجيات شخصية لزيادة دخلك الإيجاري.",
      
      ownerTitle: "أصحاب العقارات: اعظموا دخلكم",
      ownerSubtitle: "عهدوا إلينا بإدارة ممتلكاتكم واحصلوا على دخل إضافي يصل إلى 40%",
      
      contactTitle: "مستعد لزيادة دخلك إلى أقصى حد؟",
      contactDesc: "اتصل بنا للحصول على استشارة مجانية.",
      contactUs: "اتصل بنا",
      
      allRightsReserved: "جميع الحقوق محفوظة"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;
  const containerVariants = getMotionVariants('stagger');
  const sectionVariants = getMotionVariants('fade');

  // Footer translations
  const footerContent = {
    fr: {
      brandName: "Loft Algérie",
      tagline: "Premium Rentals",
      description: "La référence de la location de lofts haut de gamme en Algérie",
      quickLinks: "Liens Rapides",
      ourLofts: "Nos Lofts",
      becomePartner: "Devenir Partenaire",
      contact: "Contact",
      clientArea: "Espace Client",
      phone: "+213 56 03 62 543",
      phoneLink: "tel:+213560362543"
    },
    en: {
      brandName: "Loft Algérie",
      tagline: "Premium Rentals",
      description: "The reference for luxury loft rentals in Algeria",
      quickLinks: "Quick Links",
      ourLofts: "Our Lofts",
      becomePartner: "Become Partner",
      contact: "Contact",
      clientArea: "Client Area",
      phone: "+213 56 03 62 543",
      phoneLink: "tel:+213560362543"
    },
    ar: {
      brandName: "Loft Algérie",
      tagline: "Premium Rentals",
      description: "المرجع في تأجير الشقق المفروشة الفاخرة في الجزائر",
      quickLinks: "روابط سريعة",
      ourLofts: "شققنا",
      becomePartner: "كن شريكاً",
      contact: "اتصل بنا",
      clientArea: "منطقة العميل",
      phone: "+213 56 03 62 543",
      phoneLink: "tel:+213560362543"
    }
  };

  const footerText = footerContent[locale as keyof typeof footerContent] || footerContent.fr;

  // Helper function to get localized text
  const getLocalizedText = (textObj: any) => {
    return textObj[locale as keyof typeof textObj] || textObj.fr;
  };

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      <SmoothScroll />
      
      {/* Google Fonts - Caveat */}
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      

      
      <PublicHeader locale={locale} text={{ login: text.login }} />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full overflow-x-hidden"
      >
        {/* Hero Carrousel Section */}
        <motion.section variants={sectionVariants} className="relative w-full">
          <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 120px)', minHeight: '500px', maxHeight: '700px' }}>
            {/* Carrousel d'images - Glissement fluide de droite vers gauche */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {heroSlides.map((slide, index) => {
                // Calcul de la position pour le glissement fluide
                const position = (index - currentSlide) * 100;
                
                return (
                  <div
                    key={slide.id}
                    className="absolute top-0 w-full h-full"
                    style={{
                      left: `${position}%`,
                      transition: 'left 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                  >
                    <div className="w-full h-full relative">
                      <img 
                        src={slide.image}
                        alt={getLocalizedText(slide.title)}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/70"></div>
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
                      <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-2000"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contenu du slide actuel - Centré avec padding sécurisé */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-white max-w-4xl mx-auto w-full">
                <motion.h1 
                  key={`title-${currentSlide}`}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 1.05 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 150
                  }}
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 leading-tight drop-shadow-2xl"
                  style={{ 
                    fontFamily: 'Caveat, cursive',
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                >
                  <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                    {getLocalizedText(heroSlides[currentSlide].title)}
                  </span>
                </motion.h1>
                
                <motion.p 
                  key={`subtitle-${currentSlide}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.2,
                    ease: "easeOut"
                  }}
                  className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 opacity-95 drop-shadow-lg max-w-2xl mx-auto"
                  style={{ 
                    fontFamily: 'Caveat, cursive',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  {getLocalizedText(heroSlides[currentSlide].subtitle)}
                </motion.p>

                <motion.div
                  key={`price-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm md:text-base lg:text-lg font-bold mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  {heroSlides[currentSlide].price}
                </motion.div>

                {/* CTA Buttons Agressifs */}
                <motion.div 
                  key={`cta-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.6,
                    ease: "easeOut"
                  }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto"
                >
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Pause carousel first
                      setIsAutoPlaying(false);
                      
                      // Add a brief pause to show the current slide, then redirect
                      setTimeout(() => {
                        window.location.href = `/${locale}/client/search`;
                      }, 800); // 800ms pause to show the current slide
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-2xl animate-pulse"
                    style={{ fontFamily: 'Caveat, cursive' }}
                  >
                    <Calendar className="w-5 h-5 inline mr-2" />
                    {locale === 'fr' && 'RÉSERVER MAINTENANT'}
                    {locale === 'en' && 'BOOK NOW'}
                    {locale === 'ar' && 'احجز الآن'}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Open phone call
                      window.open('tel:+213560362543', '_self');
                    }}
                    className="w-full sm:w-auto bg-white/20 backdrop-blur-md border-2 border-white text-white px-6 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-gray-900 transition-all duration-300 shadow-2xl"
                    style={{ fontFamily: 'Caveat, cursive' }}
                  >
                    <Phone className="w-5 h-5 inline mr-2" />
                    {locale === 'fr' && 'Appel GRATUIT'}
                    {locale === 'en' && 'FREE Call'}
                    {locale === 'ar' && 'مكالمة مجانية'}
                  </motion.button>
                </motion.div>

                {/* Message d'urgence */}
                <motion.p
                  key={`urgency-${currentSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-yellow-300 text-sm font-bold mt-4 animate-bounce"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  {locale === 'fr' && '⚡ Offre spéciale : -20% aujourd\'hui seulement !'}
                  {locale === 'en' && '⚡ Special offer: -20% today only!'}
                  {locale === 'ar' && '⚡ عرض خاص: خصم 20% اليوم فقط!'}
                </motion.p>
              </div>
            </div>

            {/* Navigation du carrousel - Positionnée avec marges sécurisées */}
            <div className="absolute top-1/2 left-0 right-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 transform -translate-y-1/2 pointer-events-none">
              <motion.button
                onClick={prevSlide}
                whileHover={{ scale: 1.1, x: -3 }}
                whileTap={{ scale: 0.9 }}
                className="pointer-events-auto bg-white/15 hover:bg-white/25 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 border border-white/30 shadow-xl group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:animate-pulse" />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                whileHover={{ scale: 1.1, x: 3 }}
                whileTap={{ scale: 0.9 }}
                className="pointer-events-auto bg-white/15 hover:bg-white/25 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 border border-white/30 shadow-xl group"
              >
                <ChevronRight className="w-5 h-5 group-hover:animate-pulse" />
              </motion.button>
            </div>

            {/* Bouton pause/play - Toujours visible en haut à gauche */}
            <div className="absolute top-4 left-4 z-50">
              <motion.button
                onClick={toggleAutoPlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-3 py-2 rounded-full border border-white/50 shadow-2xl transition-all duration-300"
                style={{ fontFamily: 'Caveat, cursive' }}
              >
                <span className="text-xs font-medium">
                  {isAutoPlaying ? '⏸️ Pause' : '▶️ Play'}
                </span>
              </motion.button>
            </div>

            {/* Indicateurs de slides - Bas de page avec marge sécurisée */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                {/* Indicateurs */}
                <div className="flex space-x-2">
                  {heroSlides.map((slide, index) => (
                    <motion.button
                      key={index}
                      onClick={() => goToSlide(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      className={`relative transition-all duration-300 ${
                        index === currentSlide 
                          ? 'w-6 h-2 bg-white rounded-full' 
                          : 'w-2 h-2 bg-white/50 hover:bg-white/75 rounded-full'
                      }`}
                    >
                      {index === currentSlide && (
                        <motion.div
                          layoutId="activeSlide"
                          className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
                
                {/* Compteur */}
                <span className="text-xs font-medium text-white/70" style={{ fontFamily: 'Caveat, cursive' }}>
                  {currentSlide + 1}/{heroSlides.length}
                </span>
              </div>
            </div>

            {/* Barre de progression discrète */}
            {isAutoPlaying && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-white/10 z-40">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  key={currentSlide}
                />
              </div>
            )}
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section 
          variants={sectionVariants}
          className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900"
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '2,500+', label: text.happyGuests },
                { value: '150+', label: text.loftsAvailable },
                { value: '12', label: text.citiesCovered },
                { value: '4.8', label: text.avgRating }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-20 rounded-full"></div>
                    <div className="relative">
                      <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2" style={{ fontFamily: 'Caveat, cursive' }}>
                        {stat.value}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Agressif pour Clients */}
            <motion.div 
              className="text-center mt-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                {locale === 'fr' && '🔥 OFFRE LIMITÉE - Réservez MAINTENANT !'}
                {locale === 'en' && '🔥 LIMITED OFFER - Book NOW!'}
                {locale === 'ar' && '🔥 عرض محدود - احجز الآن!'}
              </h3>
              <p className="text-lg mb-6 opacity-90">
                {locale === 'fr' && '✨ -20% sur votre première réservation + Petit-déjeuner GRATUIT'}
                {locale === 'en' && '✨ -20% on your first booking + FREE Breakfast'}
                {locale === 'ar' && '✨ خصم 20% على حجزك الأول + إفطار مجاني'}
              </p>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Pause carousel first
                  setIsAutoPlaying(false);
                  
                  // Add a brief pause to show the current slide, then redirect
                  setTimeout(() => {
                    window.location.href = `/${locale}/client/search?offer=limited`;
                  }, 800); // 800ms pause to show the current slide
                }}
                className="bg-white text-red-600 px-10 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl animate-pulse"
                style={{ fontFamily: 'Caveat, cursive' }}
              >
                <Calendar className="w-6 h-6 inline mr-2" />
                {locale === 'fr' && 'RÉSERVER IMMÉDIATEMENT'}
                {locale === 'en' && 'BOOK IMMEDIATELY'}
                {locale === 'ar' && 'احجز فوراً'}
              </motion.button>
              <p className="text-sm mt-3 opacity-75">
                {locale === 'fr' && '⏰ Plus que 48h pour profiter de cette offre !'}
                {locale === 'en' && '⏰ Only 48h left to enjoy this offer!'}
                {locale === 'ar' && '⏰ باقي 48 ساعة فقط للاستفادة من هذا العرض!'}
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section 
          variants={sectionVariants}
          className="py-20 bg-white dark:bg-gray-800 relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {locale === 'fr' && 'Ce que disent nos clients'}
                  {locale === 'en' && 'What our clients say'}
                  {locale === 'ar' && 'ما يقوله عملاؤنا'}
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {locale === 'fr' && 'Découvrez les témoignages de nos clients satisfaits'}
                {locale === 'en' && 'Discover testimonials from our satisfied clients'}
                {locale === 'ar' && 'اكتشف شهادات عملائنا الراضين'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: locale === 'fr' ? 'Amina L.' : locale === 'en' ? 'Amina L.' : 'أمينة ل.',
                  role: locale === 'fr' ? 'Voyageuse d\'affaires' : locale === 'en' ? 'Business Traveler' : 'مسافرة أعمال',
                  content: locale === 'fr' ? 'Séjour exceptionnel dans le loft d\'Alger. Vue magnifique sur la baie et service impeccable. Je recommande vivement !' : locale === 'en' ? 'Exceptional stay in the Algiers loft. Magnificent view of the bay and impeccable service. Highly recommend!' : 'إقامة استثنائية في شقة الجزائر. إطلالة رائعة على الخليج وخدمة لا تشوبها شائبة. أنصح بشدة!',
                  rating: 5,
                  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina&backgroundColor=b6e3f4'
                },
                {
                  name: locale === 'fr' ? 'Karim B.' : locale === 'en' ? 'Karim B.' : 'كريم ب.',
                  role: locale === 'fr' ? 'Famille en vacances' : locale === 'en' ? 'Family on vacation' : 'عائلة في إجازة',
                  content: locale === 'fr' ? 'Parfait pour notre séjour familial à Béjaïa. Loft spacieux, bien équipé et très propre. Les enfants ont adoré la proximité de la plage !' : locale === 'en' ? 'Perfect for our family stay in Bejaia. Spacious, well-equipped and very clean loft. The kids loved being close to the beach!' : 'مثالي لإقامتنا العائلية في بجاية. شقة واسعة ومجهزة جيداً ونظيفة جداً. أحب الأطفال القرب من الشاطئ!',
                  rating: 5,
                  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim&backgroundColor=c0aede'
                },
                {
                  name: locale === 'fr' ? 'Yasmine D.' : locale === 'en' ? 'Yasmine D.' : 'ياسمين د.',
                  role: locale === 'fr' ? 'Couple romantique' : locale === 'en' ? 'Romantic couple' : 'زوجان رومانسيان',
                  content: locale === 'fr' ? 'Week-end romantique parfait à Jijel. Loft charmant avec vue sur mer et décoration soignée. Nous reviendrons !' : locale === 'en' ? 'Perfect romantic weekend in Jijel. Charming loft with sea view and careful decoration. We will be back!' : 'عطلة نهاية أسبوع رومانسية مثالية في جيجل. شقة ساحرة مع إطلالة على البحر وديكور أنيق. سنعود!',
                  rating: 5,
                  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yasmine&backgroundColor=ffd5dc'
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20 dark:border-gray-600/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center mb-6">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white/50 shadow-lg"
                    />
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Caveat, cursive' }}>
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                </motion.div>
              ))}
            </div>

            {/* CTA Persuasif après Témoignages */}
            <motion.div 
              className="text-center mt-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                {locale === 'fr' && '💎 Vous aussi, vivez l\'EXCELLENCE !'}
                {locale === 'en' && '💎 You too, experience EXCELLENCE!'}
                {locale === 'ar' && '💎 أنت أيضاً، اختبر التميز!'}
              </h3>
              <p className="text-lg mb-6 opacity-90">
                {locale === 'fr' && '🏆 Rejoignez + de 2500 clients qui nous font confiance • Satisfaction 100% garantie'}
                {locale === 'en' && '🏆 Join + 2500 clients who trust us • 100% satisfaction guaranteed'}
                {locale === 'ar' && '🏆 انضم إلى أكثر من 2500 عميل يثقون بنا • رضا مضمون 100%'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Scroll to featured lofts section
                    const loftsSection = document.querySelector('#featured-lofts');
                    if (loftsSection) {
                      loftsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  <Star className="w-5 h-5 inline mr-2" />
                  {locale === 'fr' && 'RÉSERVER MON SÉJOUR DE RÊVE'}
                  {locale === 'en' && 'BOOK MY DREAM STAY'}
                  {locale === 'ar' && 'احجز إقامة أحلامي'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Redirect to client search page
                    window.location.href = `/${locale}/client/search`;
                  }}
                  className="border-2 border-white text-white px-6 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-green-600 transition-all duration-300"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  <Phone className="w-5 h-5 inline mr-2" />
                  {locale === 'fr' && 'Appelez MAINTENANT'}
                  {locale === 'en' && 'Call NOW'}
                  {locale === 'ar' && 'اتصل الآن'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Lofts Section */}
        <motion.section 
          id="featured-lofts"
          variants={sectionVariants}
          className="py-20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {text.featuredTitle}
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {text.featuredSubtitle}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {realLofts.map((loft, index) => (
                <motion.div
                  key={loft.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
                >
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                    <img 
                      src={loft.image} 
                      alt={getLocalizedText(loft.title)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{loft.rating}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">({loft.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-white" />
                        <span className="text-sm text-white font-medium">
                          {getLocalizedText(loft.location)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2" style={{ fontFamily: 'Caveat, cursive' }}>
                      {getLocalizedText(loft.title)}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {getLocalizedText(loft.description)}
                    </p>

                    <div className="flex items-center space-x-4 mb-4">
                      {loft.amenities.map((amenity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg"
                        >
                          <AmenityIcon type={amenity} />
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Caveat, cursive' }}>
                          {loft.price.toLocaleString()} {loft.currency}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                          {text.perNight}
                        </span>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // Redirect to loft detail page for booking
                          window.location.href = `/${locale}/client/lofts/${loft.id}`;
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                      >
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {text.bookNow}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Services Section */}
        <motion.section 
          id="services"
          variants={sectionVariants}
          className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                {text.servicesTitle}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: text.propertyTitle, desc: text.propertyDesc, icon: "🏢" },
                { title: text.reservationTitle, desc: text.reservationDesc, icon: "📅" },
                { title: text.revenueTitle, desc: text.revenueDesc, icon: "💰" }
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="mb-6 text-center">
                    <motion.div 
                      className="text-4xl sm:text-5xl md:text-6xl mb-4"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 360,
                        transition: { duration: 0.6, ease: "easeInOut" }
                      }}
                    >
                      {service.icon}
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Caveat, cursive' }}>{service.title}</h3>
                  <p className="text-white/80 mb-6 text-center">{service.desc}</p>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Scroll to contact section
                      const contactSection = document.querySelector('#contact-section');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-white/30 w-full"
                    style={{ fontFamily: 'Caveat, cursive' }}
                  >
                    {locale === 'fr' && 'En savoir plus'}
                    {locale === 'en' && 'Learn more'}
                    {locale === 'ar' && 'اعرف المزيد'}
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* CTA Urgent Services */}
            <motion.div 
              className="text-center mt-12 bg-white/20 backdrop-blur-lg rounded-2xl p-8 border border-white/30"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
                {locale === 'fr' && '🎯 Ne ratez plus AUCUNE opportunité !'}
                {locale === 'en' && '🎯 Don\'t miss ANY opportunity!'}
                {locale === 'ar' && '🎯 لا تفوت أي فرصة!'}
              </h3>
              <p className="text-white/90 text-lg mb-6">
                {locale === 'fr' && '✅ Service VIP • Disponibilité 24/7 • Réservation en 1 clic'}
                {locale === 'en' && '✅ VIP Service • 24/7 Availability • 1-click booking'}
                {locale === 'ar' && '✅ خدمة VIP • متاح 24/7 • حجز بنقرة واحدة'}
              </p>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Redirect to client search with VIP filter
                  window.location.href = `/${locale}/client/search?category=premium`;
                }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-full text-xl font-bold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-xl animate-bounce"
                style={{ fontFamily: 'Caveat, cursive' }}
              >
                <Users className="w-6 h-6 inline mr-2" />
                {locale === 'fr' && 'ACCÈS VIP IMMÉDIAT'}
                {locale === 'en' && 'IMMEDIATE VIP ACCESS'}
                {locale === 'ar' && 'وصول VIP فوري'}
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* Owner Section */}
        <motion.section 
          variants={sectionVariants}
          className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 relative overflow-hidden"
        >
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'Caveat, cursive' }}>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {text.ownerTitle}
                  </span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  {text.ownerSubtitle}
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    'Gestion complète de votre propriété',
                    'Marketing professionnel et photos HD',
                    'Service client 24/7 pour vos locataires',
                    'Paiements garantis et assurance incluse'
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Agressif pour Propriétaires */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white mb-8">
                  <h4 className="text-xl font-bold mb-3" style={{ fontFamily: 'Caveat, cursive' }}>
                    {locale === 'fr' && '💰 DOUBLEZ vos revenus en 30 jours !'}
                    {locale === 'en' && '💰 DOUBLE your income in 30 days!'}
                    {locale === 'ar' && '💰 ضاعف دخلك في 30 يوماً!'}
                  </h4>
                  <p className="mb-4 opacity-90">
                    {locale === 'fr' && '🚀 Garantie écrite • 0€ de frais cachés • Paiement sous 48h'}
                    {locale === 'en' && '🚀 Written guarantee • €0 hidden fees • Payment within 48h'}
                    {locale === 'ar' && '🚀 ضمان مكتوب • 0€ رسوم مخفية • دفع خلال 48 ساعة'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Redirect to partner registration
                      window.location.href = `/${locale}/register?role=partner`;
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg animate-pulse" 
                    style={{ fontFamily: 'Caveat, cursive' }}
                  >
                    <ArrowRight className="w-5 h-5 inline mr-2" />
                    {locale === 'fr' && 'COMMENCER À GAGNER MAINTENANT'}
                    {locale === 'en' && 'START EARNING NOW'}
                    {locale === 'ar' && 'ابدأ الكسب الآن'}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Redirect to partner registration with evaluation focus
                      window.location.href = `/${locale}/register?role=partner&service=evaluation`;
                    }}
                    className="border-2 border-green-600 text-green-600 dark:text-green-400 px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-600 hover:text-white transition-all duration-300 shadow-lg" 
                    style={{ fontFamily: 'Caveat, cursive' }}
                  >
                    <Phone className="w-5 h-5 inline mr-2" />
                    {locale === 'fr' && 'Évaluation GRATUITE Express'}
                    {locale === 'en' && 'FREE Express Evaluation'}
                    {locale === 'ar' && 'تقييم مجاني سريع'}
                  </motion.button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                  {locale === 'fr' && '⚡ Réponse en moins de 2h • Plus de 150 propriétaires nous font déjà confiance'}
                  {locale === 'en' && '⚡ Response in less than 2h • More than 150 owners already trust us'}
                  {locale === 'ar' && '⚡ رد في أقل من ساعتين • أكثر من 150 مالك يثقون بنا بالفعل'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'Caveat, cursive' }}>
                  {locale === 'fr' && 'Revenus Moyens Mensuels'}
                  {locale === 'en' && 'Average Monthly Revenue'}
                  {locale === 'ar' && 'متوسط الإيرادات الشهرية'}
                </h3>
                
                <div className="space-y-6">
                  {[
                    { city: 'Alger (Hydra)', amount: '45,000 DZD' },
                    { city: 'Oran (Centre)', amount: '38,000 DZD' },
                    { city: 'Constantine', amount: '28,000 DZD' }
                  ].map((city, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600 dark:text-gray-300">{city.city}</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400" style={{ fontFamily: 'Caveat, cursive' }}>{city.amount}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400" style={{ fontFamily: 'Caveat, cursive' }}>+40%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {locale === 'fr' && 'Augmentation moyenne des revenus'}
                      {locale === 'en' && 'Average revenue increase'}
                      {locale === 'ar' && 'متوسط زيادة الإيرادات'}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Search Widget Section - En bas comme demandé */}
        <motion.section 
          id="contact-section"
          variants={sectionVariants}
          className="py-20 bg-gradient-to-br from-blue-900 to-purple-900 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Caveat, cursive' }}>
                {text.contactTitle}
              </h2>
              <p className="text-xl text-white/80 mb-8">
                {text.contactDesc}
              </p>
            </motion.div>

            {/* Widget de recherche */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-5xl mx-auto"
            >
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-white/90 mb-3" style={{ fontFamily: 'Caveat, cursive' }}>
                      <MapPin className="w-5 h-5 inline mr-2 text-yellow-400" />
                      {locale === 'fr' && 'Où souhaitez-vous séjourner ?'}
                      {locale === 'en' && 'Where would you like to stay?'}
                      {locale === 'ar' && 'أين تريد الإقامة؟'}
                    </label>
                    <input
                      type="text"
                      placeholder={text.searchPlaceholder}
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                      style={{ fontFamily: 'Caveat, cursive' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/90 mb-3" style={{ fontFamily: 'Caveat, cursive' }}>
                      <Calendar className="w-5 h-5 inline mr-2 text-yellow-400" />
                      {locale === 'fr' && 'Quand ?'}
                      {locale === 'en' && 'When?'}
                      {locale === 'ar' && 'متى؟'}
                    </label>
                    <input
                      type="date"
                      value={searchDates}
                      onChange={(e) => setSearchDates(e.target.value)}
                      className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/90 mb-3" style={{ fontFamily: 'Caveat, cursive' }}>
                      <Users className="w-5 h-5 inline mr-2 text-yellow-400" />
                      {text.guestsLabel}
                    </label>
                    <select
                      value={searchGuests}
                      onChange={(e) => setSearchGuests(e.target.value)}
                      className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                      style={{ fontFamily: 'Caveat, cursive' }}
                    >
                      <option value="1" className="text-gray-900 bg-white">1 personne</option>
                      <option value="2" className="text-gray-900 bg-white">2 personnes</option>
                      <option value="3" className="text-gray-900 bg-white">3 personnes</option>
                      <option value="4" className="text-gray-900 bg-white">4+ personnes</option>
                    </select>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Create search request with form data
                    const searchData = {
                      location: searchLocation || (locale === 'fr' ? 'Alger' : locale === 'en' ? 'Algiers' : 'الجزائر'),
                      dates: searchDates || (locale === 'fr' ? 'Dates flexibles' : locale === 'en' ? 'Flexible dates' : 'تواريخ مرنة'),
                      guests: searchGuests
                    };
                    
                    // Redirect to client search with search parameters
                    const params = new URLSearchParams();
                    if (searchData.location) params.set('location', searchData.location);
                    if (searchData.dates) params.set('dates', searchData.dates);
                    if (searchData.guests) params.set('guests', searchData.guests);
                    
                    window.location.href = `/${locale}/client/search?${params.toString()}`;
                  }}
                  className="w-full mt-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black py-5 rounded-2xl text-xl font-bold hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 transition-all duration-300 shadow-2xl"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  <Search className="w-6 h-6 inline mr-3" />
                  {text.searchButton}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Partner Logos Section */}
        <PartnerLogos locale={locale} />

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl" style={{ fontFamily: 'Caveat, cursive' }}>L</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Caveat, cursive' }}>
                      {footerText.brandName}
                    </h3>
                    <p className="text-sm text-gray-400">{footerText.tagline}</p>
                  </div>
                </div>
                <p className="text-gray-400 mb-6">
                  {footerText.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Caveat, cursive' }}>
                  {footerText.quickLinks}
                </h3>
                <div className="space-y-4">
                  <a href="#featured-lofts" className="block text-gray-400 hover:text-white transition-colors">
                    {footerText.ourLofts}
                  </a>
                  <a 
                    href="#" 
                    onClick={() => {
                      // Redirect to partner registration
                      window.location.href = `/${locale}/register?role=partner`;
                    }}
                    className="block text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {footerText.becomePartner}
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Caveat, cursive' }}>
                  {footerText.contact}
                </h3>
                <div className="space-y-4">
                  <a 
                    href={footerText.phoneLink}
                    className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5 text-blue-400" />
                    <span dir="ltr">{footerText.phone}</span>
                  </a>
                  <a 
                    href="mailto:contact@loftalgerie.com"
                    className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>contact@loftalgerie.com</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 text-center">
              {/* Logo Footer */}
              <div className="mb-6 flex justify-center">
                <Image 
                  src="/logo.jpg" 
                  alt="Loft Algérie" 
                  width={240} 
                  height={84} 
                  className="w-auto h-auto object-contain"
                  style={{ maxHeight: '80px', maxWidth: '280px' }}
                />
              </div>
              
              <p className="text-gray-400 mb-4">
                &copy; 2024 Loft Algérie - {text.allRightsReserved}
              </p>
              
              <div className="flex justify-center space-x-8">
                <a 
                  href={`/${locale}/login`} 
                  className="text-blue-300 hover:text-blue-200 transition-colors font-bold text-lg"
                >
                  {footerText.clientArea || (locale === 'fr' ? 'Espace Client' : locale === 'en' ? 'Client Area' : 'منطقة العميل')}
                </a>
                <a 
                  href="mailto:contact@loftalgerie.com" 
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                >
                  {footerText.contact}
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* CTA Flottant Agressif pour Propriétaires */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              // Create floating CTA message for owners
              // Redirect to partner registration
              window.location.href = `/${locale}/register?role=partner&source=floating`;
            }}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl shadow-2xl p-4 max-w-xs group cursor-pointer"
            style={{ fontFamily: 'Caveat, cursive' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
              <div>
                <p className="text-sm font-bold">
                  {locale === 'fr' && '💰 Propriétaire ?'}
                  {locale === 'en' && '💰 Owner ?'}
                  {locale === 'ar' && '💰 مالك ؟'}
                </p>
                <p className="text-xs opacity-90">
                  {locale === 'fr' && 'Gagnez +40% MAINTENANT'}
                  {locale === 'en' && 'Earn +40% NOW'}
                  {locale === 'ar' && 'اكسب +40% الآن'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </motion.div>

        <BackToTop />
      </motion.main>
    </div>
  );
}