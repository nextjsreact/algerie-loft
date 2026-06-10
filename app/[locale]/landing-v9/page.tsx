import { Metadata } from 'next';
import LandingV9 from '@/components/homepage/LandingV9';

interface LandingV9PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Carte Interactive',
  description: 'Explorez l\'Algérie par ville. Choisissez votre destination.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV9Page({ params }: LandingV9PageProps) {
  const { locale } = await params;
  return <LandingV9 locale={locale} />;
}