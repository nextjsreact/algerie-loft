import { Metadata } from 'next';
import LandingV3 from '@/components/homepage/LandingV3';

interface LandingV3PageProps {
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

export default async function LandingV3Page({ params }: LandingV3PageProps) {
  const { locale } = await params;

  return <LandingV3 locale={locale} />;
}
