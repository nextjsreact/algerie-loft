import { Metadata } from 'next';
import LandingV7 from '@/components/homepage/LandingV7';

interface LandingV7PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Minimum',
  description: 'Découvrez une collection de lofts d\'exception en Algérie. Design minimaliste.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV7Page({ params }: LandingV7PageProps) {
  const { locale } = await params;

  return <LandingV7 locale={locale} />;
}
