import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AnalyticsProvider } from "@/components/providers/analytics-provider"
import { LogoInitializer } from "@/components/providers/logo-initializer"
import { PerformanceProvider } from "@/components/providers/PerformanceProvider"
import { DatabaseInitializer } from "@/components/providers/database-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Loft Algérie - Gestion des Lofts",
  description: "Application complète de gestion des lofts",
  metadataBase: new URL('https://loftalgerie.com'),
  manifest: '/manifest.json',
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Loft Algérie',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Loft Algérie',
    'application-name': 'Loft Algérie',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#2563eb',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Loft Algérie" />
        <link rel="apple-touch-icon" href="/logo.png" />
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
              
              // Register service worker for offline support
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <PerformanceProvider enableMonitoring={process.env.NODE_ENV === 'development'}>
          <DatabaseInitializer enableSeeding={process.env.NODE_ENV !== 'production'}>
            <LogoInitializer>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </LogoInitializer>
          </DatabaseInitializer>
        </PerformanceProvider>
      </body>
    </html>
  )
}