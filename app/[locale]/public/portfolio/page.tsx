'use client'

import { useState, useMemo, useEffect } from 'react';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import BackToTop from '@/components/ui/BackToTop';
import PropertyFilter from '@/components/public/PropertyFilter';
import Breadcrumb from '@/components/public/Breadcrumb';

interface PortfolioPageProps {
  params: Promise<{ locale: string }>;
}

export default function PortfolioPage({ params }: PortfolioPageProps) {
  const [locale, setLocale] = useState('fr');
  const [filters, setFilters] = useState({ type: 'all', location: 'all' });

  useEffect(() => {
    params.then(({ locale }) => setLocale(locale));
  }, [params]);

  const properties = [
    {
      id: 1,
      title: locale === 'fr' ? "Appartement Moderne Centre-Ville" : locale === 'en' ? "Modern Downtown Apartment" : "شقة حديثة وسط المدينة",
      location: locale === 'fr' ? "Alger Centre" : locale === 'en' ? "Algiers Center" : "وسط الجزائر",
      type: locale === 'fr' ? "Appartement 3 pièces" : locale === 'en' ? "3-room Apartment" : "شقة 3 غرف",
      features: locale === 'fr' ? ["WiFi Haut Débit", "Climatisation", "Cuisine Équipée", "Parking"] :
                locale === 'en' ? ["High-Speed WiFi", "Air Conditioning", "Equipped Kitchen", "Parking"] :
                ["واي فاي عالي السرعة", "تكييف", "مطبخ مجهز", "موقف سيارات"],
      filterType: "apartment",
      filterLocation: "centre"
    },
    {
      id: 2,
      title: locale === 'fr' ? "Villa Contemporaine" : locale === 'en' ? "Contemporary Villa" : "فيلا معاصرة",
      location: locale === 'fr' ? "Hydra" : "Hydra",
      type: locale === 'fr' ? "Villa 5 pièces" : locale === 'en' ? "5-room Villa" : "فيلا 5 غرف",
      features: locale === 'fr' ? ["Jardin Privé", "Piscine", "Garage", "Sécurité 24h/24"] :
                locale === 'en' ? ["Private Garden", "Swimming Pool", "Garage", "24/7 Security"] :
                ["حديقة خاصة", "مسبح", "مرآب", "أمن 24/7"],
      filterType: "villa",
      filterLocation: "hydra"
    },
    {
      id: 3,
      title: locale === 'fr' ? "Studio Design" : locale === 'en' ? "Design Studio" : "استوديو تصميم",
      location: locale === 'fr' ? "Bab Ezzouar" : "Bab Ezzouar",
      type: locale === 'fr' ? "Studio" : "Studio",
      features: locale === 'fr' ? ["Meublé", "Balcon", "Proche Métro", "Internet Inclus"] :
                locale === 'en' ? ["Furnished", "Balcony", "Near Metro", "Internet Included"] :
                ["مفروش", "شرفة", "قريب من المترو", "إنترنت مشمول"],
      filterType: "studio",
      filterLocation: "bab_ezzouar"
    }
  ];

  const text = {
    title: locale === 'fr' ? "Notre Portfolio" : locale === 'en' ? "Our Portfolio" : "معرض أعمالنا",
    subtitle: locale === 'fr' ? "Découvrez une sélection de propriétés que nous gérons avec excellence." :
              locale === 'en' ? "Discover a selection of properties we manage with excellence." :
              "اكتشف مجموعة مختارة من العقارات التي ندير بامتياز.",
    login: locale === 'fr' ? "Connexion" : locale === 'en' ? "Login" : "تسجيل الدخول",
    clientArea: locale === 'fr' ? "Espace Client" : locale === 'en' ? "Client Area" : "منطقة العميل",
    contact: locale === 'fr' ? "Contact" : "Contact",
    allRightsReserved: locale === 'fr' ? "Tous droits réservés" : locale === 'en' ? "All rights reserved" : "جميع الحقوق محفوظة",
    noResults: locale === 'fr' ? "Aucune propriété ne correspond à vos critères." :
               locale === 'en' ? "No properties match your criteria." :
               "لا توجد عقارات تطابق معاييرك."
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const typeMatch = filters.type === 'all' || property.filterType === filters.type;
      const locationMatch = filters.location === 'all' || property.filterLocation === filters.location;
      return typeMatch && locationMatch;
    });
  }, [properties, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicHeader locale={locale} text={{ login: text.login }} />

      <main className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <Breadcrumb locale={locale} items={[{ label: text.title }]} />
          
          <section className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {text.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {text.subtitle}
            </p>
          </section>

          <PropertyFilter locale={locale} onFilterChange={setFilters} />

          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-300">{text.noResults}</p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProperties.map((property) => (
                <div key={property.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-4xl">🏠</span>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      📍 {property.location}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4">
                      {property.type}
                    </p>
                    
                    <div className="space-y-2">
                      {property.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

        </div>
      </main>

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