import { Metadata } from 'next';
import LandingV8 from '@/components/homepage/LandingV8';

interface LandingV8PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Cinématique',
  description: 'Une expérience cinématique pour découvrir l\'Algérie autrement.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV8Page({ params }: LandingV8PageProps) {
  const { locale } = await params;
  return <LandingV8 locale={locale} />;
}