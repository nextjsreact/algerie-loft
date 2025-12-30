'use client';

import React from 'react';
import Image from 'next/image';

interface Partner {
  id: string;
  name: string;
  logo: string;
  logoDark?: string; // Logo alternatif pour le mode sombre
  website: string;
  description?: string;
}

interface PartnerLogosProps {
  locale: string;
}

// Partenaires touristiques officiels
const partners: Partner[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: '/partners/airbnb-logo.svg',
    website: 'https://www.airbnb.com',
    description: 'Plateforme de location de logements'
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: '/partners/booking-logo.svg',
    website: 'https://www.booking.com',
    description: 'Réservation d\'hôtels et hébergements'
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: '/partners/expedia-logo.svg',
    website: 'https://www.expedia.com',
    description: 'Agence de voyage en ligne'
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    logo: '/partners/tripadvisor-logo.svg',
    website: 'https://www.tripadvisor.com',
    description: 'Avis et recommandations de voyage'
  },
  {
    id: 'hotels',
    name: 'Hotels.com',
    logo: '/partners/hotels-logo.svg',
    website: 'https://www.hotels.com',
    description: 'Réservation d\'hôtels dans le monde'
  },
  {
    id: 'destination-algeria',
    name: 'Destination Algeria',
    logo: '/partners/destination-algerie-light-logo.svg',  // Texte foncé pour fond clair
    logoDark: '/partners/destination-algerie-dark-logo.svg', // Texte blanc pour fond sombre
    website: 'https://www.destination-algeria.com',
    description: 'Partenaire touristique officiel'
  }
];

const translations = {
  fr: {
    title: 'Nos Partenaires',
    subtitle: 'Ils nous font confiance'
  },
  en: {
    title: 'Our Partners',
    subtitle: 'They trust us'
  },
  ar: {
    title: 'شركاؤنا',
    subtitle: 'يثقون بنا'
  }
};

export function PartnerLogos({ locale }: PartnerLogosProps) {
  const t = translations[locale as keyof typeof translations] || translations.fr;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t.subtitle}
          </p>
        </div>

        {/* Partner Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner) => (
            <a
              key={partner.id}
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-100 dark:border-gray-700"
              title={partner.description || partner.name}
            >
              <div className="relative w-full h-16 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100">
                {partner.logo.startsWith('data:') ? (
                  // SVG en base64 - utiliser img directement
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    {/* Logo pour mode light */}
                    <Image
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      fill
                      className={`object-contain ${partner.logoDark ? 'dark:hidden' : ''}`}
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 font-semibold text-sm">${partner.name}</div>`;
                        }
                      }}
                    />
                    {/* Logo pour mode dark (si disponible) */}
                    {partner.logoDark && (
                      <Image
                        src={partner.logoDark}
                        alt={`${partner.name} logo`}
                        fill
                        className="object-contain hidden dark:block"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    )}
                  </>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* Optional: Add a CTA for becoming a partner */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {locale === 'fr' && 'Vous souhaitez devenir partenaire ?'}
            {locale === 'en' && 'Want to become a partner?'}
            {locale === 'ar' && 'هل تريد أن تصبح شريكاً؟'}
          </p>
          <a
            href={`/${locale}/contact`}
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            {locale === 'fr' && 'Contactez-nous'}
            {locale === 'en' && 'Contact us'}
            {locale === 'ar' && 'اتصل بنا'}
          </a>
        </div>
      </div>
    </section>
  );
}
