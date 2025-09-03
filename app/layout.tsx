import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Loft Algérie - Gestion des Lofts",
  description: "Application complète de gestion des lofts",
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
        {children}
      </body>
    </html>
  )
}