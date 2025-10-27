import { Metadata } from 'next';
import FusionDualAudienceHomepage from '@/components/homepage/FusionDualAudienceHomepage';

interface FusionPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params }: FusionPageProps): Promise<Metadata> {
  const { locale } = params;
  
  const metaContent = {
    fr: {
      title: "Loft Algérie - Nouvelle Homepage Fusion",
      description: "Découvrez notre nouvelle homepage qui combine design futuriste et données réelles pour une expérience unique de location de lofts en Algérie.",
    },
    en: {
      title: "Loft Algeria - New Fusion Homepage",
      description: "Discover our new homepage that combines futuristic design and real data for a unique loft rental experience in Algeria.",
    },
    ar: {
      title: "لوفت الجزائر - الصفحة الرئيسية الجديدة",
      description: "اكتشف صفحتنا الرئيسية الجديدة التي تجمع بين التصميم المستقبلي والبيانات الحقيقية لتجربة فريدة في تأجير الشقق في الجزائر.",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `https://loftalgerie.com/${locale}/fusion`,
      languages: {
        'fr': 'https://loftalgerie.com/fr/fusion',
        'en': 'https://loftalgerie.com/en/fusion',
        'ar': 'https://loftalgerie.com/ar/fusion',
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `https://loftalgerie.com/${locale}/fusion`,
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

export default function FusionPage({ params }: FusionPageProps) {
  return (
    <div>
      {/* Bandeau de démonstration */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-center fixed top-0 w-full z-50 shadow-lg">
        <p className="text-sm font-medium">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 mr-2">
            DÉMO
          </span>
          {params.locale === 'fr' && 'Fusion du design futuriste avec les vraies données'}
          {params.locale === 'en' && 'Fusion of futuristic design with real data'}
          {params.locale === 'ar' && 'دمج التصميم المستقبلي مع البيانات الحقيقية'}
        </p>
      </div>
      
      {/* Ajout d'un padding pour compenser le bandeau fixe */}
      <div className="pt-10">
        <FusionDualAudienceHomepage locale={params.locale} />
      </div>
    </div>
  );
}