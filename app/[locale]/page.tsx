import FuturisticPublicPage from '@/components/futuristic/FuturisticPublicPage';
import { Metadata } from 'next';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Loft Algérie - Gestion Professionnelle de Lofts en Algérie",
      description: "Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise reconnue. Gestion complète, réservations et optimisation des revenus.",
    },
    en: {
      title: "Loft Algeria - Professional Loft Management in Algeria",
      description: "Professional loft and accommodation management services in Algeria. Maximize your rental income with our recognized expertise. Complete management, reservations and revenue optimization.",
    },
    ar: {
      title: "لوفت الجزائر - إدارة احترافية للشقق المفروشة في الجزائر",
      description: "خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. اعظم عوائدك الإيجارية مع خبرتنا المعترف بها. إدارة شاملة وحجوزات وتحسين الإيرادات.",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `https://loftalgerie.com/${locale}`,
      languages: {
        'fr': 'https://loftalgerie.com/fr',
        'en': 'https://loftalgerie.com/en',
        'ar': 'https://loftalgerie.com/ar',
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `https://loftalgerie.com/${locale}`,
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

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  
  return <FuturisticPublicPage locale={locale} />;
}