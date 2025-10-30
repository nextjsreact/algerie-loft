import FusionDualAudienceHomepage from '@/components/homepage/FusionDualAudienceHomepage';
import { Metadata } from 'next';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Loft Algérie - Découvrez les Plus Beaux Lofts d'Algérie | Réservation & Gestion",
      description: "🏆 Réservez votre loft de rêve en Algérie ! Alger, Oran, Constantine. ✨ -20% première réservation + petit-déjeuner GRATUIT. Propriétaires: doublez vos revenus en 30 jours. Service VIP 24/7.",
      keywords: "loft algérie, réservation loft alger, hébergement oran, gestion propriété algérie, revenus locatifs, loft constantine, séjour algérie",
    },
    en: {
      title: "Loft Algeria - Discover Algeria's Most Beautiful Lofts | Booking & Management",
      description: "🏆 Book your dream loft in Algeria! Algiers, Oran, Constantine. ✨ -20% first booking + FREE breakfast. Property owners: double your income in 30 days. VIP service 24/7.",
      keywords: "loft algeria, algiers loft booking, oran accommodation, algeria property management, rental income, constantine loft, algeria stay",
    },
    ar: {
      title: "لوفت الجزائر - اكتشف أجمل الشقق المفروشة في الجزائر | حجز وإدارة",
      description: "🏆 احجز شقة أحلامك في الجزائر! الجزائر، وهران، قسنطينة. ✨ خصم 20% أول حجز + إفطار مجاني. أصحاب العقارات: ضاعفوا دخلكم في 30 يوماً. خدمة VIP 24/7.",
      keywords: "شقق مفروشة الجزائر, حجز شقة الجزائر العاصمة, إقامة وهران, إدارة عقارات الجزائر, دخل إيجاري, شقة قسنطينة, إقامة الجزائر",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
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
      images: [
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=630&fit=crop',
          width: 1200,
          height: 630,
          alt: 'Loft moderne avec vue panoramique - Loft Algérie',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=630&fit=crop'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  
  return <FusionDualAudienceHomepage locale={locale} />;
}