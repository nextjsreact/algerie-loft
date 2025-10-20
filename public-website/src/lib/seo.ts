import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  alternateLocales?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
}

export async function generateSEOMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  locale = 'fr',
  alternateLocales = ['fr', 'en', 'ar'],
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex = false,
  canonical,
}: SEOProps): Promise<Metadata> {
  const t = await getTranslations('seo');
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const ogImage = image ? `${baseUrl}${image}` : `${baseUrl}/images/og-default.jpg`;
  
  // Default SEO values
  const defaultTitle = t('defaultTitle');
  const defaultDescription = t('defaultDescription');
  const siteName = t('siteName');
  
  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  
  // Generate keywords
  const defaultKeywords = [
    'gestion propriétés Algérie',
    'location lofts',
    'hébergement touristique',
    'investissement immobilier',
    'Airbnb Algérie',
  ];
  const allKeywords = [...keywords, ...defaultKeywords];
  
  // Generate alternate languages
  const alternates: Record<string, string> = {};
  alternateLocales.forEach((loc) => {
    if (loc !== locale) {
      alternates[loc] = url ? `${baseUrl}/${loc}${url}` : `${baseUrl}/${loc}`;
    }
  });
  
  const metadata: Metadata = {
    title: finalTitle,
    description: finalDescription,
    keywords: allKeywords.join(', '),
    authors: author ? [{ name: author }] : [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonical || fullUrl,
      languages: alternates,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: fullUrl,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
      locale,
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [ogImage],
      creator: '@LoftAlgerie',
      site: '@LoftAlgerie',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
  };
  
  return metadata;
}

export function generateStructuredData(type: string, data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  };
  
  return {
    ...baseData,
    ...data,
  };
}

export function generateOrganizationSchema() {
  return generateStructuredData('Organization', {
    name: 'Loft Algérie',
    url: 'https://loft-algerie.com',
    logo: 'https://loft-algerie.com/images/logo.png',
    description: 'Services professionnels de gestion de lofts et hébergements en Algérie',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'DZ',
      addressLocality: 'Alger',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+213-XXX-XXX-XXX',
      contactType: 'customer service',
      availableLanguage: ['French', 'English', 'Arabic'],
    },
    sameAs: [
      'https://facebook.com/loftalgerie',
      'https://instagram.com/loftalgerie',
      'https://linkedin.com/company/loftalgerie',
    ],
  });
}

export function generateWebsiteSchema() {
  return generateStructuredData('WebSite', {
    name: 'Loft Algérie',
    url: 'https://loft-algerie.com',
    description: 'Services professionnels de gestion de lofts et hébergements en Algérie',
    inLanguage: ['fr', 'en', 'ar'],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://loft-algerie.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  });
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider: string;
  areaServed: string;
  serviceType: string;
}) {
  return generateStructuredData('Service', {
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: service.provider,
    },
    areaServed: service.areaServed,
    serviceType: service.serviceType,
  });
}

export function generatePropertySchema(property: {
  name: string;
  description: string;
  address: string;
  images: string[];
  amenities: string[];
  priceRange?: string;
}) {
  return generateStructuredData('Accommodation', {
    name: property.name,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressCountry: 'DZ',
    },
    image: property.images,
    amenityFeature: property.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
    })),
    ...(property.priceRange && { priceRange: property.priceRange }),
  });
}