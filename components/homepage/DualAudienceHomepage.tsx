'use client';

import React, { useState } from 'react';
import { Star, MapPin, Wifi, Car, Coffee, Tv, Users, Phone, Mail, Calendar } from 'lucide-react';

interface DualAudienceHomepageProps {
  locale: string;
}

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
      fr: "Magnifique loft de 120m² avec terrasse privée et vue imprenable sur la baie d'Alger. Entièrement équipé, climatisé, parking sécurisé.",
      en: "Beautiful 120m² loft with private terrace and stunning view of Algiers bay. Fully equipped, air-conditioned, secure parking.",
      ar: "شقة جميلة 120 متر مربع مع تراس خاص وإطلالة خلابة على خليج الجزائر. مجهزة بالكامل، مكيفة، موقف آمن."
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
      fr: "Penthouse exceptionnel de 180m² au cœur d'Oran. Design contemporain, 3 chambres, cuisine américaine, jacuzzi sur toit-terrasse.",
      en: "Exceptional 180m² penthouse in the heart of Oran. Contemporary design, 3 bedrooms, open kitchen, rooftop jacuzzi.",
      ar: "بنتهاوس استثنائي 180 متر مربع في قلب وهران. تصميم معاصر، 3 غرف نوم، مطبخ أمريكي، جاكوزي على السطح."
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
      fr: "Loft unique de 95m² dans un bâtiment historique rénové. Plafonds hauts, poutres apparentes, proche des ponts suspendus.",
      en: "Unique 95m² loft in a renovated historic building. High ceilings, exposed beams, near the suspension bridges.",
      ar: "شقة فريدة 95 متر مربع في مبنى تاريخي مجدد. أسقف عالية، عوارض ظاهرة، قريب من الجسور المعلقة."
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

export default function DualAudienceHomepage({ locale }: DualAudienceHomepageProps) {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDates, setSearchDates] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');

  const content = {
    fr: {
      // Header
      login: "Connexion",
      signup: "Inscription",
      
      // Hero
      heroTitle: "Découvrez les Plus Beaux Lofts d'Algérie",
      heroSubtitle: "Réservez votre séjour idéal dans nos lofts sélectionnés avec soin à Alger, Oran et Constantine",
      searchPlaceholder: "Où souhaitez-vous séjourner ?",
      datesPlaceholder: "Dates de séjour",
      guestsLabel: "Voyageurs",
      searchButton: "Rechercher",
      
      // Featured
      featuredTitle: "Lofts Recommandés",
      featuredSubtitle: "Nos hébergements les mieux notés par nos clients",
      perNight: "/nuit",
      viewDetails: "Voir les détails",
      bookNow: "Réserver",
      
      // Stats
      happyGuests: "Clients Satisfaits",
      loftsAvailable: "Lofts Disponibles", 
      citiesCovered: "Villes Couvertes",
      avgRating: "Note Moyenne",
      
      // Owner section
      ownerTitle: "Propriétaires : Maximisez vos Revenus",
      ownerSubtitle: "Confiez-nous la gestion de votre bien et générez jusqu'à 40% de revenus supplémentaires",
      ownerBenefits: [
        "Gestion complète de votre propriété",
        "Marketing professionnel et photos HD",
        "Service client 24/7 pour vos locataires", 
        "Paiements garantis et assurance incluse"
      ],
      becomePartner: "Devenir Partenaire",
      
      // Footer
      footerDesc: "Loft Algérie - La référence de la location de lofts haut de gamme en Algérie",
      quickLinks: "Liens Rapides",
      contact: "Contact",
      followUs: "Suivez-nous",
      copyright: "© 2024 Loft Algérie. Tous droits réservés."
    },
    en: {
      // Header  
      login: "Login",
      signup: "Sign Up",
      
      // Hero
      heroTitle: "Discover Algeria's Most Beautiful Lofts",
      heroSubtitle: "Book your ideal stay in our carefully selected lofts in Algiers, Oran and Constantine",
      searchPlaceholder: "Where would you like to stay?",
      datesPlaceholder: "Check-in dates", 
      guestsLabel: "Guests",
      searchButton: "Search",
      
      // Featured
      featuredTitle: "Recommended Lofts",
      featuredSubtitle: "Our highest-rated accommodations by our guests",
      perNight: "/night",
      viewDetails: "View Details",
      bookNow: "Book Now",
      
      // Stats
      happyGuests: "Happy Guests",
      loftsAvailable: "Available Lofts",
      citiesCovered: "Cities Covered", 
      avgRating: "Average Rating",
      
      // Owner section
      ownerTitle: "Property Owners: Maximize Your Income",
      ownerSubtitle: "Trust us with your property management and generate up to 40% additional revenue",
      ownerBenefits: [
        "Complete property management",
        "Professional marketing and HD photos",
        "24/7 customer service for your tenants",
        "Guaranteed payments and insurance included"
      ],
      becomePartner: "Become a Partner",
      
      // Footer
      footerDesc: "Loft Algeria - The reference for luxury loft rentals in Algeria",
      quickLinks: "Quick Links", 
      contact: "Contact",
      followUs: "Follow Us",
      copyright: "© 2024 Loft Algeria. All rights reserved."
    },
    ar: {
      // Header
      login: "تسجيل الدخول", 
      signup: "التسجيل",
      
      // Hero
      heroTitle: "اكتشف أجمل الشقق المفروشة في الجزائر",
      heroSubtitle: "احجز إقامتك المثالية في شققنا المختارة بعناية في الجزائر ووهران وقسنطينة",
      searchPlaceholder: "أين تريد الإقامة؟",
      datesPlaceholder: "تواريخ الإقامة",
      guestsLabel: "الضيوف", 
      searchButton: "بحث",
      
      // Featured
      featuredTitle: "الشقق الموصى بها",
      featuredSubtitle: "أعلى أماكن الإقامة تقييماً من ضيوفنا",
      perNight: "/ليلة",
      viewDetails: "عرض التفاصيل",
      bookNow: "احجز الآن",
      
      // Stats  
      happyGuests: "ضيوف راضون",
      loftsAvailable: "شقق متاحة",
      citiesCovered: "مدن مغطاة",
      avgRating: "التقييم المتوسط",
      
      // Owner section
      ownerTitle: "أصحاب العقارات: اعظموا دخلكم", 
      ownerSubtitle: "عهدوا إلينا بإدارة ممتلكاتكم واحصلوا على دخل إضافي يصل إلى 40%",
      ownerBenefits: [
        "إدارة كاملة لممتلكاتكم",
        "تسويق احترافي وصور عالية الجودة", 
        "خدمة عملاء 24/7 للمستأجرين",
        "مدفوعات مضمونة وتأمين شامل"
      ],
      becomePartner: "كن شريكاً",
      
      // Footer
      footerDesc: "لوفت الجزائر - المرجع في تأجير الشقق المفروشة الفاخرة في الجزائر",
      quickLinks: "روابط سريعة",
      contact: "اتصل بنا", 
      followUs: "تابعنا",
      copyright: "© 2024 لوفت الجزائر. جميع الحقوق محفوظة."
    }
  };

  const t = content[locale as keyof typeof content] || content.fr;

  return (
    <div className="min-h-screen bg-white">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Loft Algérie</h1>
                <p className="text-xs text-gray-500">Premium Rentals</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#lofts" className="text-gray-600 hover:text-blue-600 transition-colors">
                {locale === 'fr' && 'Nos Lofts'}
                {locale === 'en' && 'Our Lofts'}
                {locale === 'ar' && 'شققنا'}
              </a>
              <a href="#owners" className="text-gray-600 hover:text-blue-600 transition-colors">
                {locale === 'fr' && 'Propriétaires'}
                {locale === 'en' && 'Owners'}
                {locale === 'ar' && 'الملاك'}
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <button className="text-gray-600 hover:text-blue-600 px-6 py-3 rounded-lg transition-colors font-bold text-lg">
                {t.login}
              </button>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg">
                {t.signup}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Search */}
        <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
                {t.heroSubtitle}
              </p>
            </div>

            {/* Search Widget */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {locale === 'fr' && 'Destination'}
                    {locale === 'en' && 'Destination'}
                    {locale === 'ar' && 'الوجهة'}
                  </label>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {locale === 'fr' && 'Dates'}
                    {locale === 'en' && 'Dates'}
                    {locale === 'ar' && 'التواريخ'}
                  </label>
                  <input
                    type="date"
                    value={searchDates}
                    onChange={(e) => setSearchDates(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    {t.guestsLabel}
                  </label>
                  <select
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>
              <button className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                {t.searchButton}
              </button>
            </div>
          </div>
        </section>        {
/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">2,500+</div>
                <div className="text-gray-600">{t.happyGuests}</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">150+</div>
                <div className="text-gray-600">{t.loftsAvailable}</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">12</div>
                <div className="text-gray-600">{t.citiesCovered}</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.8</div>
                <div className="text-gray-600">{t.avgRating}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Lofts Section */}
        <section id="lofts" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t.featuredTitle}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t.featuredSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {realLofts.map((loft) => (
                <div key={loft.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={loft.image} 
                      alt={loft.title[locale as keyof typeof loft.title]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{loft.rating}</span>
                        <span className="text-xs text-gray-600">({loft.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {loft.title[locale as keyof typeof loft.title]}
                      </h3>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{loft.location[locale as keyof typeof loft.location]}</span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {loft.description[locale as keyof typeof loft.description]}
                    </p>

                    {/* Amenities */}
                    <div className="flex items-center space-x-3 mb-4">
                      {loft.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-1 text-gray-500">
                          <AmenityIcon type={amenity} />
                        </div>
                      ))}
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          {loft.price.toLocaleString()} {loft.currency}
                        </span>
                        <span className="text-gray-600 text-sm">{t.perNight}</span>
                      </div>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        {t.bookNow}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors">
                {locale === 'fr' && 'Voir tous les lofts'}
                {locale === 'en' && 'View all lofts'}
                {locale === 'ar' && 'عرض جميع الشقق'}
              </button>
            </div>
          </div>
        </section>

        {/* Property Owner Section */}
        <section id="owners" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {t.ownerTitle}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {t.ownerSubtitle}
                </p>

                <div className="space-y-4 mb-8">
                  {t.ownerBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                    {t.becomePartner}
                  </button>
                  <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
                    {locale === 'fr' && 'En savoir plus'}
                    {locale === 'en' && 'Learn more'}
                    {locale === 'ar' && 'اعرف المزيد'}
                  </button>
                </div>
              </div>

              {/* Stats/Visual */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {locale === 'fr' && 'Revenus Moyens Mensuels'}
                  {locale === 'en' && 'Average Monthly Revenue'}
                  {locale === 'ar' && 'متوسط الإيرادات الشهرية'}
                </h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Alger (Hydra)</span>
                    <span className="text-2xl font-bold text-green-600">45,000 DZD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Oran (Centre)</span>
                    <span className="text-2xl font-bold text-green-600">38,000 DZD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Constantine</span>
                    <span className="text-2xl font-bold text-green-600">28,000 DZD</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">+40%</div>
                    <div className="text-sm text-gray-600">
                      {locale === 'fr' && 'Augmentation moyenne des revenus'}
                      {locale === 'en' && 'Average revenue increase'}
                      {locale === 'ar' && 'متوسط زيادة الإيرادات'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{t.contact}</h3>
                <div className="space-y-3">
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
              
              <div>
                <h3 className="text-xl font-bold mb-4">{t.quickLinks}</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                    {locale === 'fr' && 'Nos Lofts'}
                    {locale === 'en' && 'Our Lofts'}
                    {locale === 'ar' && 'شققنا'}
                  </a>
                  <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                    {locale === 'fr' && 'Devenir Partenaire'}
                    {locale === 'en' && 'Become Partner'}
                    {locale === 'ar' && 'كن شريكاً'}
                  </a>
                  <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                    {locale === 'fr' && 'Support Client'}
                    {locale === 'en' && 'Customer Support'}
                    {locale === 'ar' && 'دعم العملاء'}
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">{t.followUs}</h3>
                <p className="text-gray-300 mb-4">{t.footerDesc}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>{t.copyright}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}