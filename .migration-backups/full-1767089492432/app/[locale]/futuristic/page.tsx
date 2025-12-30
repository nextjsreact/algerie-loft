import FuturisticPublicPage from '@/components/futuristic/FuturisticPublicPage.backup';
import { Metadata } from 'next';

interface FuturisticPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FuturisticPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const metaContent = {
    fr: {
      title: "Page Futuriste - Loft Algérie (Archive)",
      description: "Version futuriste archivée de la page principale avec animations avancées et effets visuels.",
    },
    en: {
      title: "Futuristic Page - Loft Algeria (Archive)",
      description: "Archived futuristic version of the main page with advanced animations and visual effects.",
    },
    ar: {
      title: "الصفحة المستقبلية - لوفت الجزائر (أرشيف)",
      description: "نسخة مستقبلية مؤرشفة من الصفحة الرئيسية مع رسوم متحركة متقدمة وتأثيرات بصرية.",
    }
  };

  const content = metaContent[locale as keyof typeof metaContent] || metaContent.fr;

  return {
    title: content.title,
    description: content.description,
    robots: 'noindex, nofollow', // Archive page, don't index
  };
}

export default async function FuturisticPage({ params }: FuturisticPageProps) {
  const { locale } = await params;
  
  return <FuturisticPublicPage locale={locale} />;
}