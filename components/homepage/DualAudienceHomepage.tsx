'use client';

import React from 'react';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';

interface DualAudienceHomepageProps {
  locale: string;
}

/**
 * Dual-Audience Homepage Component - Simplified Version
 */
export default function DualAudienceHomepage({ locale }: DualAudienceHomepageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PublicHeader locale={locale} />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {locale === 'fr' && 'Réservez votre loft idéal en Algérie'}
              {locale === 'en' && 'Book your ideal loft in Algeria'}
              {locale === 'ar' && 'احجز شقتك المثالية في الجزائر'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {locale === 'fr' && 'Découvrez nos lofts exceptionnels avec service professionnel'}
              {locale === 'en' && 'Discover our exceptional lofts with professional service'}
              {locale === 'ar' && 'اكتشف شققنا الاستثنائية مع الخدمة المهنية'}
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              {locale === 'fr' && 'Réserver maintenant'}
              {locale === 'en' && 'Book now'}
              {locale === 'ar' && 'احجز الآن'}
            </button>
          </div>
        </section>

        {/* Featured Lofts Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {locale === 'fr' && 'Lofts en vedette'}
              {locale === 'en' && 'Featured Lofts'}
              {locale === 'ar' && 'الشقق المميزة'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">Loft {i}</h3>
                    <p className="text-gray-600 mb-4">
                      {locale === 'fr' && 'Magnifique loft moderne avec toutes les commodités'}
                      {locale === 'en' && 'Beautiful modern loft with all amenities'}
                      {locale === 'ar' && 'شقة حديثة جميلة مع جميع وسائل الراحة'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">€{50 + i * 10}/nuit</span>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        {locale === 'fr' && 'Voir'}
                        {locale === 'en' && 'View'}
                        {locale === 'ar' && 'عرض'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Property Owner Section */}
        <section className="py-16 bg-blue-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">
              {locale === 'fr' && 'Propriétaires, maximisez vos revenus'}
              {locale === 'en' && 'Property owners, maximize your income'}
              {locale === 'ar' && 'أصحاب العقارات، اعظموا دخلكم'}
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {locale === 'fr' && 'Confiez-nous la gestion de votre propriété et bénéficiez de notre expertise pour optimiser vos revenus locatifs.'}
              {locale === 'en' && 'Entrust us with the management of your property and benefit from our expertise to optimize your rental income.'}
              {locale === 'ar' && 'عهد إلينا بإدارة ممتلكاتك واستفد من خبرتنا لتحسين دخلك الإيجاري.'}
            </p>
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              {locale === 'fr' && 'Devenir partenaire'}
              {locale === 'en' && 'Become a partner'}
              {locale === 'ar' && 'كن شريكاً'}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <PublicFooter locale={locale} />
    </div>
  );
}