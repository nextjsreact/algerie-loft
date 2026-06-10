import { Metadata } from 'next';
import LandingV10 from '@/components/homepage/LandingV10';

interface LandingV10PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Loft Algérie - Notre Histoire',
  description: 'Lisez notre histoire. Celle des lieux, des hôtes, des voyageurs.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandingV10Page({ params }: LandingV10PageProps) {
  const { locale } = await params;
  return <LandingV10 locale={locale} />;
}