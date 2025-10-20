import { Metadata } from 'next';

interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

export function generateMetadata(config: MetaTagsConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const {
    title,
    description,
    keywords = [],
    image = '/images/og-default.jpg',
    url = '',
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
    locale = 'fr',
    alternateLocales = ['en', 'ar'],
    noIndex = false,
    noFollow = false,
    canonical,
  } = config;

  const fullUrl = `${baseUrl}${url}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

  // Generate alternate language URLs
  const alternates: Record<string, string> = {};
  alternateLocales.forEach((altLocale) => {
    if (altLocale !== locale) {
      alternates[altLocale] = altLocale === 'fr' 
        ? `${baseUrl}${url}` 
        : `${baseUrl}/${altLocale}${url}`;
    }
  });

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : [{ name: 'Loft Algérie' }],
    creator: 'Loft Algérie',
    publisher: 'Loft Algérie',
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonical || fullUrl,
      languages: Object.keys(alternates).length > 0 ? alternates : undefined,
    },
    openGraph: {
      type: type as any,
      locale: getOpenGraphLocale(locale),
      url: fullUrl,
      siteName: 'Loft Algérie',
      title,
      description,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : ['Loft Algérie'],
        section,
        tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LoftAlgerie',
      creator: '@LoftAlgerie',
      title,
      description,
      images: [fullImageUrl],
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  return metadata;
}

function getOpenGraphLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'fr': 'fr_DZ',
    'en': 'en_US',
    'ar': 'ar_DZ',
  };
  return localeMap[locale] || 'fr_DZ';
}

// Predefined metadata configurations for common pages
export const homePageMetadata = (locale: string = 'fr'): MetaTagsConfig => ({
  title: locale === 'fr' 
    ? 'Loft Algérie - Gestion Professionnelle de Propriétés'
    : locale === 'en'
    ? 'Loft Algeria - Professional Property Management'
    : 'لوفت الجزائر - إدارة احترافية للعقارات',
  description: locale === 'fr'
    ? 'Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise en gestion immobilière.'
    : locale === 'en'
    ? 'Professional loft and accommodation management services in Algeria. Maximize your rental income with our real estate management expertise.'
    : 'خدمات إدارة احترافية للشقق والإقامة في الجزائر. اعظم عائداتك الإيجارية مع خبرتنا في إدارة العقارات.',
  keywords: locale === 'fr'
    ? ['gestion propriétés Algérie', 'location lofts', 'hébergement touristique', 'investissement immobilier', 'Airbnb Algérie', 'gestion locative']
    : locale === 'en'
    ? ['property management Algeria', 'loft rental', 'tourist accommodation', 'real estate investment', 'Airbnb Algeria', 'rental management']
    : ['إدارة العقارات الجزائر', 'تأجير الشقق', 'الإقامة السياحية', 'الاستثمار العقاري', 'إيربنب الجزائر', 'إدارة الإيجارات'],
  locale,
});

export const servicesPageMetadata = (locale: string = 'fr'): MetaTagsConfig => ({
  title: locale === 'fr'
    ? 'Nos Services - Gestion Complète de Propriétés | Loft Algérie'
    : locale === 'en'
    ? 'Our Services - Complete Property Management | Loft Algeria'
    : 'خدماتنا - إدارة شاملة للعقارات | لوفت الجزائر',
  description: locale === 'fr'
    ? 'Découvrez nos services complets de gestion immobilière : maintenance, réservations, nettoyage, marketing et optimisation des revenus locatifs.'
    : locale === 'en'
    ? 'Discover our complete real estate management services: maintenance, reservations, cleaning, marketing and rental income optimization.'
    : 'اكتشف خدماتنا الشاملة لإدارة العقارات: الصيانة، الحجوزات، التنظيف، التسويق وتحسين العائدات الإيجارية.',
  keywords: locale === 'fr'
    ? ['services gestion immobilière', 'maintenance propriétés', 'réservations en ligne', 'nettoyage professionnel', 'marketing immobilier']
    : locale === 'en'
    ? ['real estate management services', 'property maintenance', 'online reservations', 'professional cleaning', 'real estate marketing']
    : ['خدمات إدارة العقارات', 'صيانة العقارات', 'الحجوزات الإلكترونية', 'التنظيف المهني', 'التسويق العقاري'],
  url: '/services',
  locale,
});

export const portfolioPageMetadata = (locale: string = 'fr'): MetaTagsConfig => ({
  title: locale === 'fr'
    ? 'Portfolio - Nos Propriétés Gérées | Loft Algérie'
    : locale === 'en'
    ? 'Portfolio - Our Managed Properties | Loft Algeria'
    : 'معرض الأعمال - العقارات التي ندير | لوفت الجزائر',
  description: locale === 'fr'
    ? 'Explorez notre portfolio de lofts et propriétés gérés en Algérie. Découvrez la qualité de nos services à travers nos réalisations.'
    : locale === 'en'
    ? 'Explore our portfolio of managed lofts and properties in Algeria. Discover the quality of our services through our achievements.'
    : 'استكشف معرض أعمالنا من الشقق والعقارات المدارة في الجزائر. اكتشف جودة خدماتنا من خلال إنجازاتنا.',
  keywords: locale === 'fr'
    ? ['portfolio immobilier', 'lofts Algérie', 'propriétés gérées', 'hébergements de luxe', 'locations saisonnières']
    : locale === 'en'
    ? ['real estate portfolio', 'lofts Algeria', 'managed properties', 'luxury accommodations', 'seasonal rentals']
    : ['معرض العقارات', 'شقق الجزائر', 'العقارات المدارة', 'الإقامة الفاخرة', 'الإيجارات الموسمية'],
  url: '/portfolio',
  locale,
});

export const contactPageMetadata = (locale: string = 'fr'): MetaTagsConfig => ({
  title: locale === 'fr'
    ? 'Contact - Parlons de Votre Projet | Loft Algérie'
    : locale === 'en'
    ? 'Contact - Let\'s Talk About Your Project | Loft Algeria'
    : 'اتصل بنا - لنتحدث عن مشروعك | لوفت الجزائر',
  description: locale === 'fr'
    ? 'Contactez-nous pour discuter de vos besoins en gestion immobilière. Devis gratuit et consultation personnalisée disponibles.'
    : locale === 'en'
    ? 'Contact us to discuss your real estate management needs. Free quote and personalized consultation available.'
    : 'اتصل بنا لمناقشة احتياجاتك في إدارة العقارات. عرض أسعار مجاني واستشارة شخصية متاحة.',
  keywords: locale === 'fr'
    ? ['contact Loft Algérie', 'devis gestion immobilière', 'consultation gratuite', 'service client']
    : locale === 'en'
    ? ['contact Loft Algeria', 'real estate management quote', 'free consultation', 'customer service']
    : ['اتصل لوفت الجزائر', 'عرض أسعار إدارة العقارات', 'استشارة مجانية', 'خدمة العملاء'],
  url: '/contact',
  locale,
});

export const aboutPageMetadata = (locale: string = 'fr'): MetaTagsConfig => ({
  title: locale === 'fr'
    ? 'À Propos - Notre Histoire et Expertise | Loft Algérie'
    : locale === 'en'
    ? 'About - Our Story and Expertise | Loft Algeria'
    : 'من نحن - قصتنا وخبرتنا | لوفت الجزائر',
  description: locale === 'fr'
    ? 'Découvrez l\'histoire de Loft Algérie, notre équipe d\'experts et notre mission d\'excellence dans la gestion immobilière en Algérie.'
    : locale === 'en'
    ? 'Discover the story of Loft Algeria, our team of experts and our mission of excellence in real estate management in Algeria.'
    : 'اكتشف قصة لوفت الجزائر، فريق خبرائنا ومهمتنا للتميز في إدارة العقارات في الجزائر.',
  keywords: locale === 'fr'
    ? ['à propos Loft Algérie', 'équipe experts immobilier', 'histoire entreprise', 'mission valeurs']
    : locale === 'en'
    ? ['about Loft Algeria', 'real estate expert team', 'company history', 'mission values']
    : ['عن لوفت الجزائر', 'فريق خبراء العقارات', 'تاريخ الشركة', 'المهمة والقيم'],
  url: '/about',
  locale,
});

export const blogPageMetadata = (locale: string = 'fr'): MetaTagsConfig => ({
  title: locale === 'fr'
    ? 'Blog - Actualités et Conseils Immobiliers | Loft Algérie'
    : locale === 'en'
    ? 'Blog - Real Estate News and Tips | Loft Algeria'
    : 'المدونة - أخبار ونصائح عقارية | لوفت الجزائر',
  description: locale === 'fr'
    ? 'Restez informé des dernières tendances immobilières en Algérie. Conseils d\'experts, actualités du marché et guides pratiques.'
    : locale === 'en'
    ? 'Stay informed about the latest real estate trends in Algeria. Expert advice, market news and practical guides.'
    : 'ابق على اطلاع بأحدث الاتجاهات العقارية في الجزائر. نصائح الخبراء، أخبار السوق والأدلة العملية.',
  keywords: locale === 'fr'
    ? ['blog immobilier Algérie', 'actualités immobilières', 'conseils investissement', 'marché immobilier']
    : locale === 'en'
    ? ['real estate blog Algeria', 'real estate news', 'investment advice', 'real estate market']
    : ['مدونة العقارات الجزائر', 'أخبار العقارات', 'نصائح الاستثمار', 'سوق العقارات'],
  url: '/blog',
  locale,
});