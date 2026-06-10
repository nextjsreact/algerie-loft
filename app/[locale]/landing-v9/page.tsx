import { Metadata } from 'next';
import LandingV9 from '@/components/homepage/LandingV9';

interface Props { params: Promise<{ locale: string }> }

export const metadata: Metadata = {
  title: 'Loft Algérie — Méditerranée Dorée',
  description: 'Version chaleur méditerranéenne, tons sable et terra cotta.',
  robots: { index: false, follow: false },
};

export default async function LandingV9Page({ params }: Props) {
  const { locale } = await params;
  return <LandingV9 locale={locale} />;
}
