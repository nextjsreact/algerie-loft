import type { Metadata } from 'next';
import './globals.css';



export const metadata: Metadata = {
  title: {
    template: '%s | Loft Algérie',
    default: 'Loft Algérie - Gestion Professionnelle de Propriétés',
  },
  description:
    'Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise.',
  keywords: [
    'gestion propriétés Algérie',
    'location lofts',
    'hébergement touristique',
    'investissement immobilier',
    'Airbnb Algérie',
    'gestion locative',
    'maintenance propriétés',
  ],
  authors: [{ name: 'Loft Algérie' }],
  creator: 'Loft Algérie',
  publisher: 'Loft Algérie',
  metadataBase: new URL('https://loft-algerie.com'),
  alternates: {
    canonical: 'https://loft-algerie.com',
    languages: {
      'fr': 'https://loft-algerie.com',
      'en': 'https://loft-algerie.com/en',
      'ar': 'https://loft-algerie.com/ar',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_DZ',
    url: 'https://loft-algerie.com',
    siteName: 'Loft Algérie',
    title: 'Loft Algérie - Gestion Professionnelle de Propriétés',
    description: 'Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Loft Algérie - Gestion Professionnelle de Propriétés',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@LoftAlgerie',
    creator: '@LoftAlgerie',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}