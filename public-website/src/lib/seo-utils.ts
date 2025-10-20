import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
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
  noFollow?: boolean;
  canonical?: string;
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const {
    title,
    description,
    keywords = [],
    image = '/images/og-default.jpg',
    url = '',
    type = 'website',
    locale = 'fr',
    alternateLocales = ['en', 'ar'],
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
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

  return {
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
}

function getOpenGraphLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'fr': 'fr_DZ',
    'en': 'en_US',
    'ar': 'ar_DZ',
  };
  return localeMap[locale] || 'fr_DZ';
}

// Generate structured data for different content types
export function generateStructuredData(type: string, data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const baseData = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'website':
      return {
        ...baseData,
        '@type': 'WebSite',
        name: 'Loft Algérie',
        description: 'Services professionnels de gestion de lofts et hébergements en Algérie',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Loft Algérie',
          url: baseUrl,
        },
      };

    case 'organization':
      return {
        ...baseData,
        '@type': 'Organization',
        name: 'Loft Algérie',
        description: 'Services professionnels de gestion de lofts et hébergements en Algérie',
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        image: `${baseUrl}/images/og-default.jpg`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: data.phone || '+213-XXX-XXX-XXX',
          contactType: 'customer service',
          availableLanguage: ['French', 'English', 'Arabic'],
        },
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DZ',
          addressLocality: data.city || 'Alger',
          addressRegion: data.region || 'Alger',
          streetAddress: data.address || '',
        },
        sameAs: [
          data.facebook || '',
          data.instagram || '',
          data.linkedin || '',
        ].filter(Boolean),
        foundingDate: data.foundingDate || '2020',
        numberOfEmployees: data.employeeCount || '10-50',
        areaServed: {
          '@type': 'Country',
          name: 'Algeria',
        },
      };

    case 'service':
      return {
        ...baseData,
        '@type': 'Service',
        name: data.name,
        description: data.description,
        provider: {
          '@type': 'Organization',
          name: 'Loft Algérie',
          url: baseUrl,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Algeria',
        },
        serviceType: data.serviceType || 'Property Management',
        category: data.category || 'Real Estate Services',
        offers: data.offers ? {
          '@type': 'Offer',
          description: data.offers.description,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        } : undefined,
      };

    case 'property':
      return {
        ...baseData,
        '@type': 'Accommodation',
        name: data.name,
        description: data.description,
        url: `${baseUrl}${data.url || ''}`,
        image: data.images || [],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DZ',
          addressLocality: data.city || 'Alger',
          streetAddress: data.address || '',
        },
        geo: data.coordinates ? {
          '@type': 'GeoCoordinates',
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
        } : undefined,
        amenityFeature: data.amenities?.map((amenity: string) => ({
          '@type': 'LocationFeatureSpecification',
          name: amenity,
        })) || [],
        numberOfRooms: data.rooms,
        floorSize: data.size ? {
          '@type': 'QuantitativeValue',
          value: data.size,
          unitCode: 'MTK',
        } : undefined,
        petsAllowed: data.petsAllowed || false,
      };

    case 'article':
      return {
        ...baseData,
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          '@type': 'Organization',
          name: 'Loft Algérie',
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Loft Algérie',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/images/logo.png`,
          },
        },
        datePublished: data.publishedAt,
        dateModified: data.updatedAt || data.publishedAt,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}${data.url || ''}`,
        },
      };

    case 'breadcrumb':
      return {
        ...baseData,
        '@type': 'BreadcrumbList',
        itemListElement: data.items?.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url ? `${baseUrl}${item.url}` : undefined,
        })) || [],
      };

    default:
      return baseData;
  }
}

// SEO-friendly URL slug generator
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Generate meta description from content
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '');
  
  // Truncate to maxLength
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Find the last complete sentence within the limit
  const truncated = cleanContent.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.7) {
    return cleanContent.substring(0, lastSentence + 1);
  }
  
  // Find the last complete word
  const lastSpace = truncated.lastIndexOf(' ');
  return cleanContent.substring(0, lastSpace) + '...';
}

// Extract keywords from content
export function extractKeywords(content: string, maxKeywords: number = 10): string[] {
  // Remove HTML tags and convert to lowercase
  const cleanContent = content.replace(/<[^>]*>/g, '').toLowerCase();
  
  // Common stop words to exclude
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'car',
    'ni', 'or', 'ce', 'ces', 'cette', 'cet', 'son', 'sa', 'ses', 'mon', 'ma', 'mes',
    'ton', 'ta', 'tes', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu',
    'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'qui', 'que', 'quoi', 'dont',
    'où', 'quand', 'comment', 'pourquoi', 'avec', 'sans', 'pour', 'par', 'dans', 'sur',
    'sous', 'entre', 'vers', 'chez', 'depuis', 'pendant', 'avant', 'après', 'the', 'a',
    'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is',
    'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);
  
  // Extract words (3+ characters)
  const words = cleanContent
    .match(/\b\w{3,}\b/g) || []
    .filter(word => !stopWords.has(word));
  
  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// Generate canonical URL
export function generateCanonicalUrl(path: string, locale?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  
  if (!locale || locale === 'fr') {
    return `${baseUrl}${path}`;
  }
  
  return `${baseUrl}/${locale}${path}`;
}

// Generate hreflang links
export function generateHreflangLinks(path: string, locales: string[] = ['fr', 'en', 'ar']): Array<{ hreflang: string; href: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  
  return locales.map(locale => ({
    hreflang: locale === 'fr' ? 'fr-DZ' : locale === 'en' ? 'en-US' : 'ar-DZ',
    href: locale === 'fr' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
  }));
}

// Validate SEO requirements
export function validateSEO(config: SEOConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Title validation
  if (!config.title) {
    errors.push('Title is required');
  } else if (config.title.length < 30) {
    errors.push('Title should be at least 30 characters');
  } else if (config.title.length > 60) {
    errors.push('Title should not exceed 60 characters');
  }
  
  // Description validation
  if (!config.description) {
    errors.push('Description is required');
  } else if (config.description.length < 120) {
    errors.push('Description should be at least 120 characters');
  } else if (config.description.length > 160) {
    errors.push('Description should not exceed 160 characters');
  }
  
  // Keywords validation
  if (config.keywords && config.keywords.length > 10) {
    errors.push('Too many keywords (max 10 recommended)');
  }
  
  // Image validation
  if (config.image && !config.image.startsWith('http') && !config.image.startsWith('/')) {
    errors.push('Image URL should be absolute or start with /');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}