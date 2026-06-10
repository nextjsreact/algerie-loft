import { Metadata } from 'next';
import LandingV6 from '@/components/homepage/LandingV6';

interface LandingV6PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Héritage Algérien',
  description: 'Découvrez une collection de lofts d\'exception en Algérie. Design vibrant et chaleureux.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV6Page({ params }: LandingV6PageProps) {
  const { locale } = await params;

  return <LandingV6 locale={locale} />;
}
