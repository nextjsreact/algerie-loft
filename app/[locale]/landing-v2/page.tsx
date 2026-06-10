import { Metadata } from 'next';
import LandingV2 from '@/components/homepage/LandingV2';

interface LandingV2PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - L\'art de séjourner en Algérie',
  description: 'Découvrez une collection de lofts d\'exception en Algérie. Réservez en direct, sans intermédiaire.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV2Page({ params }: LandingV2PageProps) {
  const { locale } = await params;

  return <LandingV2 locale={locale} />;
}
