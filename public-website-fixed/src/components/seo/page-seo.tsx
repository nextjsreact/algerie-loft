import { Metadata } from 'next';
import { generateSEOMetadata, SEOProps } from '@/lib/seo';
import { 
  StructuredData, 
  OrganizationStructuredData, 
  WebsiteStructuredData,
  BreadcrumbStructuredData 
} from './structured-data';

interface PageSEOProps extends SEOProps {
  children?: React.ReactNode;
  breadcrumbs?: Array<{ name: string; url: string }>;
  structuredData?: any;
  includeOrganization?: boolean;
  includeWebsite?: boolean;
}

export async function generatePageMetadata(props: SEOProps): Promise<Metadata> {
  return await generateSEOMetadata(props);
}

export function PageSEO({
  children,
  breadcrumbs,
  structuredData,
  includeOrganization = true,
  includeWebsite = false,
}: PageSEOProps) {
  return (
    <>
      {/* Organization structured data (included on most pages) */}
      {includeOrganization && <OrganizationStructuredData />}
      
      {/* Website structured data (usually only on homepage) */}
      {includeWebsite && <WebsiteStructuredData />}
      
      {/* Breadcrumb structured data */}
      {breadcrumbs && breadcrumbs.length > 1 && (
        <BreadcrumbStructuredData items={breadcrumbs} />
      )}
      
      {/* Custom structured data */}
      {structuredData && <StructuredData data={structuredData} />}
      
      {/* Additional SEO enhancements */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* Preload critical resources */}
      <link
        rel="preload"
        href="/images/hero-bg.webp"
        as="image"
        type="image/webp"
      />
      
      {children}
    </>
  );
}

// Utility function to generate common breadcrumbs
export function generateBreadcrumbs(
  path: string,
  locale: string = 'fr'
): Array<{ name: string; url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const segments = path.split('/').filter(Boolean);
  
  // Remove locale from segments if present
  if (['fr', 'en', 'ar'].includes(segments[0])) {
    segments.shift();
  }
  
  const breadcrumbs = [
    {
      name: locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : 'الرئيسية',
      url: locale === 'fr' ? baseUrl : `${baseUrl}/${locale}`,
    },
  ];
  
  let currentPath = locale === 'fr' ? '' : `/${locale}`;
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Map segment names to localized versions
    const segmentNames: Record<string, Record<string, string>> = {
      services: {
        fr: 'Services',
        en: 'Services',
        ar: 'الخدمات',
      },
      portfolio: {
        fr: 'Portfolio',
        en: 'Portfolio',
        ar: 'المعرض',
      },
      about: {
        fr: 'À propos',
        en: 'About',
        ar: 'حولنا',
      },
      contact: {
        fr: 'Contact',
        en: 'Contact',
        ar: 'اتصل بنا',
      },
      blog: {
        fr: 'Actualités',
        en: 'News',
        ar: 'الأخبار',
      },
    };
    
    const name = segmentNames[segment]?.[locale] || segment;
    
    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`,
    });
  });
  
  return breadcrumbs;
}

// SEO utilities for specific page types
export const SEOTemplates = {
  homepage: (locale: string = 'fr'): SEOProps => ({
    title: locale === 'fr' 
      ? 'Gestion Professionnelle de Propriétés en Algérie'
      : locale === 'en'
      ? 'Professional Property Management in Algeria'
      : 'إدارة احترافية للعقارات في الجزائر',
    description: locale === 'fr'
      ? 'Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise.'
      : locale === 'en'
      ? 'Professional loft and accommodation management services in Algeria. Maximize your rental income with our expertise.'
      : 'خدمات إدارة احترافية للشقق والإقامات في الجزائر. اعظم عوائد الإيجار مع خبرتنا.',
    keywords: locale === 'fr'
      ? ['gestion propriétés Algérie', 'location lofts', 'hébergement touristique', 'investissement immobilier']
      : locale === 'en'
      ? ['property management Algeria', 'loft rentals', 'tourist accommodation', 'real estate investment']
      : ['إدارة العقارات الجزائر', 'تأجير الشقق', 'الإقامة السياحية', 'الاستثمار العقاري'],
    type: 'website',
    locale,
  }),
  
  services: (locale: string = 'fr'): SEOProps => ({
    title: locale === 'fr' 
      ? 'Nos Services de Gestion Immobilière'
      : locale === 'en'
      ? 'Our Property Management Services'
      : 'خدمات إدارة العقارات',
    description: locale === 'fr'
      ? 'Découvrez notre gamme complète de services de gestion immobilière : gestion locative, maintenance, réservations et plus.'
      : locale === 'en'
      ? 'Discover our complete range of property management services: rental management, maintenance, reservations and more.'
      : 'اكتشف مجموعتنا الكاملة من خدمات إدارة العقارات: إدارة الإيجارات والصيانة والحجوزات والمزيد.',
    keywords: locale === 'fr'
      ? ['services gestion immobilière', 'gestion locative', 'maintenance propriétés', 'réservations']
      : locale === 'en'
      ? ['property management services', 'rental management', 'property maintenance', 'reservations']
      : ['خدمات إدارة العقارات', 'إدارة الإيجارات', 'صيانة العقارات', 'الحجوزات'],
    locale,
  }),
  
  portfolio: (locale: string = 'fr'): SEOProps => ({
    title: locale === 'fr' 
      ? 'Portfolio de Propriétés Gérées'
      : locale === 'en'
      ? 'Managed Properties Portfolio'
      : 'معرض العقارات المدارة',
    description: locale === 'fr'
      ? 'Explorez notre portfolio de lofts et propriétés gérés avec succès en Algérie.'
      : locale === 'en'
      ? 'Explore our portfolio of successfully managed lofts and properties in Algeria.'
      : 'استكشف معرض الشقق والعقارات التي ندير بنجاح في الجزائر.',
    keywords: locale === 'fr'
      ? ['portfolio propriétés', 'lofts Algérie', 'hébergements gérés', 'exemples réalisations']
      : locale === 'en'
      ? ['property portfolio', 'Algeria lofts', 'managed accommodations', 'project examples']
      : ['معرض العقارات', 'شقق الجزائر', 'الإقامات المدارة', 'أمثلة المشاريع'],
    locale,
  }),
  
  contact: (locale: string = 'fr'): SEOProps => ({
    title: locale === 'fr' 
      ? 'Contactez-nous - Loft Algérie'
      : locale === 'en'
      ? 'Contact Us - Loft Algeria'
      : 'اتصل بنا - لوفت الجزائر',
    description: locale === 'fr'
      ? 'Contactez notre équipe pour discuter de vos besoins en gestion immobilière. Devis gratuit et consultation personnalisée.'
      : locale === 'en'
      ? 'Contact our team to discuss your property management needs. Free quote and personalized consultation.'
      : 'اتصل بفريقنا لمناقشة احتياجاتك في إدارة العقارات. عرض أسعار مجاني واستشارة شخصية.',
    keywords: locale === 'fr'
      ? ['contact gestion immobilière', 'devis gratuit', 'consultation', 'Alger']
      : locale === 'en'
      ? ['property management contact', 'free quote', 'consultation', 'Algiers']
      : ['اتصال إدارة العقارات', 'عرض أسعار مجاني', 'استشارة', 'الجزائر'],
    locale,
  }),
};