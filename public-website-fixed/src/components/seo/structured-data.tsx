'use client';

import { usePathname } from 'next/navigation';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'service' | 'property' | 'article' | 'breadcrumb';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';

  const generateStructuredData = () => {
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
          url: `${baseUrl}${pathname}`,
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
            '@id': `${baseUrl}${pathname}`,
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
  };

  const structuredData = generateStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

// Specific structured data components for common use cases
export function WebsiteStructuredData() {
  return <StructuredData type="website" data={{}} />;
}

export function OrganizationStructuredData(data: {
  phone?: string;
  city?: string;
  region?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  foundingDate?: string;
  employeeCount?: string;
}) {
  return <StructuredData type="organization" data={data} />;
}

export function ServiceStructuredData(data: {
  name: string;
  description: string;
  serviceType?: string;
  category?: string;
  offers?: {
    description: string;
  };
}) {
  return <StructuredData type="service" data={data} />;
}

export function PropertyStructuredData(data: {
  name: string;
  description: string;
  images?: string[];
  city?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  amenities?: string[];
  rooms?: number;
  size?: number;
  petsAllowed?: boolean;
}) {
  return <StructuredData type="property" data={data} />;
}

export function ArticleStructuredData(data: {
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return <StructuredData type="article" data={data} />;
}

export function BreadcrumbStructuredData(data: {
  items: Array<{ name: string; url?: string }>;
}) {
  return <StructuredData type="breadcrumb" data={data} />;
}