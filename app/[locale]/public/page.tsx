import DualAudienceHomepage from '@/components/homepage/DualAudienceHomepage';
import { Metadata } from 'next';

interface PublicPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Loft Algérie - Réservez votre loft idéal en Algérie",
      description: "Découvrez des lofts uniques en Algérie. Réservation facile, gestion professionnelle pour propriétaires. Séjours authentiques et revenus optimisés.",
    },
    en: {
      title: "Loft Algeria - Book your ideal loft in Algeria",
      description: "Discover unique lofts in Algeria. Easy booking, professional management for owners. Authentic stays and optimized revenue.",
    },
    ar: {
      title: "لوفت الجزائر - احجز شقتك المفروشة المثالية في الجزائر",
      description: "اكتشف شققاً مفروشة فريدة في الجزائر. حجز سهل، إدارة احترافية للمالكين. إقامات أصيلة وإيرادات محسنة.",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `https://loftalgerie.com/${locale}/public`,
      languages: {
        'fr': 'https://loftalgerie.com/fr/public',
        'en': 'https://loftalgerie.com/en/public',
        'ar': 'https://loftalgerie.com/ar/public',
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `https://loftalgerie.com/${locale}/public`,
      siteName: 'Loft Algérie',
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'en' ? 'en_US' : 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { locale } = await params;
  
  return <DualAudienceHomepage locale={locale} />;
}