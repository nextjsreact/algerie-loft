import { Metadata } from 'next';
import LandingV10 from '@/components/homepage/LandingV10';

interface Props { params: Promise<{ locale: string }> }

export const metadata: Metadata = {
  title: 'Loft Algérie — Bold & Graphique',
  description: 'Version bold graphique, contraste noir et vert émeraude.',
  robots: { index: false, follow: false },
};

export default async function LandingV10Page({ params }: Props) {
  const { locale } = await params;
  return <LandingV10 locale={locale} />;
}
