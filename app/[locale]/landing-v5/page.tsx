import { Metadata } from 'next';
import LandingV5 from '@/components/homepage/LandingV5';

interface LandingV5PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Dark Luxe',
  description: 'Découvrez une collection de lofts d\'exception en Algérie. Design immersif.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV5Page({ params }: LandingV5PageProps) {
  const { locale } = await params;

  return <LandingV5 locale={locale} />;
}
