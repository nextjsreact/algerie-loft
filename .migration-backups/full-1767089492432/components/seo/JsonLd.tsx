interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Schema pour l'organisation
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Loft Algérie',
    url: 'https://loft-algerie.com',
    logo: 'https://loft-algerie.com/logo.png',
    description: 'Plateforme de réservation et gestion de lofts en Algérie',
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
      'https://twitter.com/loftalgerie',
    ],
  }

  return <JsonLd data={schema} />
}

// Schema pour un loft spécifique
export function LoftSchema({ loft }: { loft: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: loft.name,
    description: loft.description,
    image: loft.photos?.[0] || '',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'DZ',
      addressLocality: loft.city || 'Alger',
    },
    geo: loft.latitude && loft.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: loft.latitude,
      longitude: loft.longitude,
    } : undefined,
    amenityFeature: loft.amenities?.map((amenity: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
    })),
    numberOfRooms: loft.bedrooms,
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: loft.max_guests,
    },
    priceRange: loft.price_per_night ? `${loft.price_per_night} DZD` : undefined,
  }

  return <JsonLd data={schema} />
}

// Schema pour les avis
export function ReviewSchema({ reviews }: { reviews: any[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  }

  return <JsonLd data={schema} />
}

// Schema pour le breadcrumb
export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={schema} />
}

// Schema pour la page d'accueil
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Loft Algérie',
    url: 'https://loft-algerie.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://loft-algerie.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={schema} />
}
