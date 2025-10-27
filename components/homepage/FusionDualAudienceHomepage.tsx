'use client';

import { motion } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';
import { Star, MapPin, Wifi, Car, Coffee, Tv, Users, Phone, Mail, Calendar, Search, ArrowRight } from 'lucide-react';
import FuturisticHero from '@/components/futuristic/FuturisticHero';
import CrispSlideCarousel from '@/components/futuristic/CrispSlideCarousel';
import AnimatedServiceCard from '@/components/futuristic/AnimatedServiceCard';
import EnhancedStatsSection from '@/components/futuristic/EnhancedStatsSection';
import AnimatedContact from '@/components/futuristic/AnimatedContact';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import TestimonialsSection from '@/components/public/TestimonialsSection';
import SmoothScroll from '@/components/ui/SmoothScroll';
import BackToTop from '@/components/ui/BackToTop';
import { SectionBackground } from '@/components/futuristic/AnimatedBackground';
import { useResponsiveAnimations } from '@/hooks/useResponsiveAnimations';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface FusionDualAudienceHomepageProps {
  locale: string;
}

// Données réelles de lofts algériens avec animations
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
      fr: "Magnifique loft de 120m² avec terrasse privée et vue imprenable sur la baie d'Alger. Entièrement équipé, climatisé, parking sécurisé.",
      en: "Beautiful 120m² loft with private terrace and stunning view of Algiers bay. Fully equipped, air-conditioned, secure parking.",
      ar: "شقة جميلة 120 متر مربع مع تراس خاص وإطلالة خلابة على خليج الجزائر. مجهزة بالكامل، مكيفة، موقف آمن."
    },
    price: 25000,
    currency: "DZD",
    rating: 4.8,
    reviews: 127,
    amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
    featured: true
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
      fr: "Penthouse exceptionnel de 180m² au cœur d'Oran. Design contemporain, 3 chambres, cuisine américaine, jacuzzi sur toit-terrasse.",
      en: "Exceptional 180m² penthouse in the heart of Oran. Contemporary design, 3 bedrooms, open kitchen, rooftop jacuzzi.",
      ar: "بنتهاوس استثنائي 180 متر مربع في قلب وهران. تصميم معاصر، 3 غرف نوم، مطبخ أمريكي، جاكوزي على السطح."
    },
    price: 45000,
    currency: "DZD", 
    rating: 4.9,
    reviews: 89,
    amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop",
    featured: true
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
      fr: "Loft unique de 95m² dans un bâtiment historique rénové. Plafonds hauts, poutres apparentes, proche des ponts suspendus.",
      en: "Unique 95m² loft in a renovated historic building. High ceilings, exposed beams, near the suspension bridges.",
      ar: "شقة فريدة 95 متر مربع في مبنى تاريخي مجدد. أسقف عالية، عوارض ظاهرة، قريب من الجسور المعلقة."
    },
    price: 18000,
    currency: "DZD",
    rating: 4.7,
    reviews: 156,
    amenities: ['Wifi', 'Coffee', 'Tv'],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop",
    featured: true
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
  const { getMotionVariants, shouldEnableFeature } = useResponsiveAnimations();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDates, setSearchDates] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');
  
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

  // Preload images based on audience
  useEffect(() => {
    if (isOptimized && audience === 'guest') {
      preloadImages([
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop'
      ]);
    }
  }, [isOptimized, audience, preloadImages]);

  // Contenu multilingue fusionné
  const content = {
    fr: {
      // Hero futuriste avec focus dual-audience
      title: "Découvrez les Plus Beaux Lofts d'Algérie",
      subtitle: "Réservez votre séjour idéal dans nos lofts sélectionnés avec soin à Alger, Oran et Constantine. Gestion professionnelle pour propriétaires.",
      
      // Search widget
      searchPlaceholder: "Où souhaitez-vous séjourner ?",
      datesPlaceholder: "Dates de séjour",
      guestsLabel: "Voyageurs",
      searchButton: "Rechercher des Lofts",
      
      // CTA buttons
      discoverLofts: "Découvrir nos Lofts",
      becomePartner: "Devenir Partenaire",
      
      // Featured section
      featuredTitle: "Lofts Recommandés",
      featuredSubtitle: "Nos hébergements les mieux notés par nos clients",
      perNight: "/nuit",
      bookNow: "Réserver",
      
      // Stats
      happyGuests: "Clients Satisfaits",
      loftsAvailable: "Lofts Disponibles", 
      citiesCovered: "Villes Couvertes",
      avgRating: "Note Moyenne",
      
      // Services (gardés de la version futuriste)
      servicesTitle: "Nos Services",
      property: { title: "Gestion de Propriétés", desc: "Gestion complète de vos biens immobiliers avec suivi personnalisé, optimisation des revenus et maintenance préventive." },
      reservation: { title: "Réservations", desc: "Système de réservation professionnel pour maximiser votre taux d'occupation et automatiser la gestion des clients." },
      revenue: { title: "Optimisation Revenus", desc: "Stratégies personnalisées pour maximiser vos revenus locatifs avec analyse de marché et ajustement des prix." },
      
      // Owner section
      ownerTitle: "Propriétaires : Maximisez vos Revenus",
      ownerSubtitle: "Confiez-nous la gestion de votre bien et générez jusqu'à 40% de revenus supplémentaires",
      
      // Contact
      contactTitle: "Prêt à maximiser vos revenus ?",
      contactDesc: "Contactez-nous pour une consultation gratuite et découvrez comment nous pouvons optimiser la gestion de vos propriétés.",
      contactUs: "Nous contacter",
      
      // Footer
      login: "Connexion",
      allRightsReserved: "Tous droits réservés"
    },
    en: {
      title: "Discover Algeria's Most Beautiful Lofts",
      subtitle: "Book your ideal stay in our carefully selected lofts in Algiers, Oran and Constantine. Professional management for property owners.",
      
      searchPlaceholder: "Where would you like to stay?",
      datesPlaceholder: "Check-in dates", 
      guestsLabel: "Guests",
      searchButton: "Search Lofts",
      
      discoverLofts: "Discover our Lofts",
      becomePartner: "Become a Partner",
      
      featuredTitle: "Recommended Lofts",
      featuredSubtitle: "Our highest-rated accommodations by our guests",
      perNight: "/night",
      bookNow: "Book Now",
      
      happyGuests: "Happy Guests",
      loftsAvailable: "Available Lofts",
      citiesCovered: "Cities Covered", 
      avgRating: "Average Rating",
      
      servicesTitle: "Our Services",
      property: { title: "Property Management", desc: "Complete management of your real estate with personalized monitoring, revenue optimization and preventive maintenance." },
      reservation: { title: "Reservations", desc: "Professional booking system to maximize your occupancy rate and automate client management." },
      revenue: { title: "Revenue Optimization", desc: "Personalized strategies to maximize your rental income with market analysis and price adjustments." },
      
      ownerTitle: "Property Owners: Maximize Your Income",
      ownerSubtitle: "Trust us with your property management and generate up to 40% additional revenue",
      
      contactTitle: "Ready to maximize your income?",
      contactDesc: "Contact us for a free consultation and discover how we can optimize your property management.",
      contactUs: "Contact us",
      
      login: "Login",
      allRightsReserved: "All rights reserved"
    },
    ar: {
      title: "اكتشف أجمل الشقق المفروشة في الجزائر",
      subtitle: "احجز إقامتك المثالية في شققنا المختارة بعناية في الجزائر ووهران وقسنطينة. إدارة احترافية لأصحاب العقارات.",
      
      searchPlaceholder: "أين تريد الإقامة؟",
      datesPlaceholder: "تواريخ الإقامة",
      guestsLabel: "الضيوف", 
      searchButton: "البحث عن الشقق",
      
      discoverLofts: "اكتشف شققنا",
      becomePartner: "كن شريكاً",
      
      featuredTitle: "الشقق الموصى بها",
      featuredSubtitle: "أعلى أماكن الإقامة تقييماً من ضيوفنا",
      perNight: "/ليلة",
      bookNow: "احجز الآن",
      
      happyGuests: "ضيوف راضون",
      loftsAvailable: "شقق متاحة",
      citiesCovered: "مدن مغطاة",
      avgRating: "التقييم المتوسط",
      
      servicesTitle: "خدماتنا",
      property: { title: "إدارة العقارات", desc: "إدارة شاملة لعقاراتك مع متابعة شخصية وتحسين الإيرادات والصيانة الوقائية." },
      reservation: { title: "الحجوزات", desc: "نظام حجز احترافي لزيادة معدل الإشغال وأتمتة إدارة العملاء." },
      revenue: { title: "تحسين الإيرادات", desc: "استراتيجيات شخصية لزيادة دخلك الإيجاري مع تحليل السوق وتعديل الأسعار." },
      
      ownerTitle: "أصحاب العقارات: اعظموا دخلكم", 
      ownerSubtitle: "عهدوا إلينا بإدارة ممتلكاتكم واحصلوا على دخل إضافي يصل إلى 40%",
      
      contactTitle: "مستعد لزيادة دخلك إلى أقصى حد؟",
      contactDesc: "اتصل بنا للحصول على استشارة مجانية واكتشف كيف يمكننا تحسين إدارة عقاراتك.",
      contactUs: "اتصل بنا",
      
      login: "تسجيل الدخول",
      allRightsReserved: "جميع الحقوق محفوظة"
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
        {/* Hero Section Fusionné - Futuriste + Dual-Audience */}
        <motion.section variants={sectionVariants} className="relative">
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {text.title}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl opacity-90 max-w-4xl mx-auto">
                  {text.subtitle}
                </p>
              </motion.div>

              {/* Dual CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <button className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <Search className="w-5 h-5 inline mr-2" />
                  {text.discoverLofts}
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                  <ArrowRight className="w-5 h-5 inline mr-2" />
                  {text.becomePartner}
                </button>
              </motion.div>

              {/* Search Widget Futuriste */}
              <motion.div 
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {locale === 'fr' && 'Destination'}
                        {locale === 'en' && 'Destination'}
                        {locale === 'ar' && 'الوجهة'}
                      </label>
                      <input
                        type="text"
                        placeholder={text.searchPlaceholder}
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {locale === 'fr' && 'Dates'}
                        {locale === 'en' && 'Dates'}
                        {locale === 'ar' && 'التواريخ'}
                      </label>
                      <input
                        type="date"
                        value={searchDates}
                        onChange={(e) => setSearchDates(e.target.value)}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-white backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <Users className="w-4 h-4 inline mr-1" />
                        {text.guestsLabel}
                      </label>
                      <select
                        value={searchGuests}
                        onChange={(e) => setSearchGuests(e.target.value)}
                        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-white backdrop-blur-sm"
                      >
                        <option value="1" className="text-gray-900">1</option>
                        <option value="2" className="text-gray-900">2</option>
                        <option value="3" className="text-gray-900">3</option>
                        <option value="4" className="text-gray-900">4+</option>
                      </select>
                    </div>
                  </div>
                  <button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                    {text.searchButton}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>   
     {/* Stats Section Futuriste */}
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
                      <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
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
          </div>
        </motion.section>

        {/* Featured Lofts Section avec Design Futuriste */}
        <motion.section 
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
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
                  {/* Image avec effet hover */}
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                    <img 
                      src={loft.image} 
                      alt={loft.title[locale as keyof typeof loft.title]}
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
                          {loft.location[locale as keyof typeof loft.location]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                      {loft.title[locale as keyof typeof loft.title]}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {loft.description[locale as keyof typeof loft.description]}
                    </p>

                    {/* Amenities avec animations */}
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

                    {/* Price and Action */}
                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {loft.price.toLocaleString()} {loft.currency}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                          {text.perNight}
                        </span>
                      </div>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                        {text.bookNow}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Button */}
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <button className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {locale === 'fr' && 'Voir tous les lofts'}
                {locale === 'en' && 'View all lofts'}
                {locale === 'ar' && 'عرض جميع الشقق'}
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Services Section Futuriste */}
        <motion.section 
          variants={sectionVariants}
          className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white relative overflow-hidden"
        >
          {/* Animated background elements */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {text.servicesTitle}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: 'property', title: text.property.title, desc: text.property.desc },
                { icon: 'reservation', title: text.reservation.title, desc: text.reservation.desc },
                { icon: 'revenue', title: text.revenue.title, desc: text.revenue.desc }
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="mb-6">
                    {/* Service icon placeholder - replace with actual icons */}
                    <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center">
                      {/* Add appropriate icon here */}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                  <p className="text-white/80">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Owner Section Futuriste */}
        <motion.section 
          variants={sectionVariants}
          className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 relative overflow-hidden"
        >
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
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

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    {text.becomePartner}
                  </button>
                  <button className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-300">
                    {locale === 'fr' && 'En savoir plus'}
                    {locale === 'en' && 'Learn more'}
                    {locale === 'ar' && 'اعرف المزيد'}
                  </button>
                </div>
              </motion.div>

              {/* Stats/Visual */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
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
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{city.amount}</span>
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
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">+40%</div>
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

        {/* Contact Section Futuriste */}
        <motion.section 
          variants={sectionVariants}
          className="py-20 bg-gradient-to-br from-blue-900 to-purple-900 text-white relative overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {text.contactTitle}
              </h2>
              <p className="text-xl text-white/80 mb-8">
                {text.contactDesc}
              </p>
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                {text.contactUs}
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer Futuriste */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Brand */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">L</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Loft Algérie</h3>
                    <p className="text-sm text-gray-400">Premium Rentals</p>
                  </div>
                </div>
                <p className="text-gray-400 mb-6">
                  {locale === 'fr' && 'La référence de la location de lofts haut de gamme en Algérie'}
                  {locale === 'en' && 'The reference for luxury loft rentals in Algeria'}
                  {locale === 'ar' && 'المرجع في تأجير الشقق المفروشة الفاخرة في الجزائر'}
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6">
                  {locale === 'fr' && 'Liens Rapides'}
                  {locale === 'en' && 'Quick Links'}
                  {locale === 'ar' && 'روابط سريعة'}
                </h3>
                <div className="space-y-4">
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {locale === 'fr' && 'Nos Lofts'}
                    {locale === 'en' && 'Our Lofts'}
                    {locale === 'ar' && 'شققنا'}
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {locale === 'fr' && 'Devenir Partenaire'}
                    {locale === 'en' && 'Become Partner'}
                    {locale === 'ar' && 'كن شريكاً'}
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {locale === 'fr' && 'Support Client'}
                    {locale === 'en' && 'Customer Support'}
                    {locale === 'ar' && 'دعم العملاء'}
                  </a>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold mb-6">
                  {locale === 'fr' && 'Contact'}
                  {locale === 'en' && 'Contact'}
                  {locale === 'ar' && 'اتصل بنا'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <span>+213 23 45 67 89</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>contact@loftalgerie.com</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>{text.allRightsReserved}</p>
            </div>
          </div>
        </footer>

        <BackToTop />
      </motion.main>
    </div>
  );
}