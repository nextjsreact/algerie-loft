import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AnalyticsProvider } from "@/components/providers/analytics-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Loft Algérie - Gestion des Lofts",
  description: "Application complète de gestion des lofts",
  metadataBase: new URL('https://loftalgerie.com'),
  alternates: {
    canonical: '/',
    languages: {
      'fr': '/fr',
      'en': '/en',
      'ar': '/ar',
    },
  },
  openGraph: {
    title: "Loft Algérie - Gestion des Lofts",
    description: "Application complète de gestion des lofts",
    url: 'https://loftalgerie.com',
    siteName: 'Loft Algérie',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Loft Algérie - Gestion des Lofts",
    description: "Application complète de gestion des lofts",
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Set RTL direction immediately based on URL
              (function() {
                const path = window.location.pathname;
                const isArabic = path.startsWith('/ar/') || path === '/ar';
                if (isArabic) {
                  document.documentElement.dir = 'rtl';
                  document.documentElement.lang = 'ar';
                  document.documentElement.style.wordSpacing = '0.25em';
                  document.documentElement.style.letterSpacing = '0.02em';
                } else {
                  document.documentElement.dir = 'ltr';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}