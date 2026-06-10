import { Metadata } from 'next';
import LandingPremium from '@/components/homepage/LandingPremium';

interface PreviewLandingPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Alg\u00e9rie - Aper\u00e7u Landing Premium',
  description: 'Pr\u00e9visualisation de la nouvelle landing page premium.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PreviewLandingPage({ params }: PreviewLandingPageProps) {
  const { locale } = await params;

  return <LandingPremium locale={locale} />;
}
