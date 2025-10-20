import Head from 'next/head';
import { useTranslations } from 'next-intl';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  noIndex?: boolean;
  canonical?: string;
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  locale = 'fr',
  noIndex = false,
  canonical,
}: SEOHeadProps) {
  const t = useTranslations('seo');
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loft-algerie.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const ogImage = image ? `${baseUrl}${image}` : `${baseUrl}/images/og-default.jpg`;
  
  const defaultTitle = t('defaultTitle');
  const defaultDescription = t('defaultDescription');
  const siteName = t('siteName');
  
  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  
  const defaultKeywords = [
    'gestion propriétés Algérie',
    'location lofts',
    'hébergement touristique',
    'investissement immobilier',
    'Airbnb Algérie',
  ];
  const allKeywords = [...keywords, ...defaultKeywords];

  return (
    <Head>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <meta name="author" content={siteName} />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@LoftAlgerie" />
      <meta name="twitter:site" content="@LoftAlgerie" />
    </Head>
  );
}