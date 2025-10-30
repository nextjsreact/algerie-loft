import FusionDualAudienceHomepage from '@/components/homepage/FusionDualAudienceHomepage';
import { Metadata } from 'next';

interface FusionPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FusionPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Page Fusion - Loft Algérie | Expérience Dual-Audience",
      description: "Page fusion optimisée pour clients et propriétaires. Réservations instantanées et gestion de revenus locatifs en Algérie.",
    },
    en: {
      title: "Fusion Page - Loft Algeria | Dual-Audience Experience", 
      description: "Fusion page optimized for guests and property owners. Instant bookings and rental income management in Algeria.",
    },
    ar: {
      title: "صفحة الدمج - لوفت الجزائر | تجربة الجمهور المزدوج",
      description: "صفحة دمج محسنة للضيوف وأصحاب العقارات. حجوزات فورية وإدارة دخل إيجاري في الجزائر.",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
  };
}

export default async function FusionPage({ params }: FusionPageProps) {
  const { locale } = await params;
  
  return <FusionDualAudienceHomepage locale={locale} />;
}