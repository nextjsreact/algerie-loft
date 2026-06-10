import { Metadata } from 'next';
import LandingV8 from '@/components/homepage/LandingV8';

interface Props { params: Promise<{ locale: string }> }

export const metadata: Metadata = {
  title: 'Loft Algérie — Editorial Luxe',
  description: 'Version éditoriale luxe, style magazine noir.',
  robots: { index: false, follow: false },
};

export default async function LandingV8Page({ params }: Props) {
  const { locale } = await params;
  return <LandingV8 locale={locale} />;
}
