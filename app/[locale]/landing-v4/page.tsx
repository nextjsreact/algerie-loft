import { Metadata } from 'next';
import LandingV4 from '@/components/homepage/LandingV4';

interface LandingV4PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Landing V4',
  description: 'Découvrez une collection de lofts d\'exception en Algérie.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV4Page({ params }: LandingV4PageProps) {
  const { locale } = await params;

  return <LandingV4 locale={locale} />;
}
