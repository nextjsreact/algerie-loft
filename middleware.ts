import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

// Configuration next-intl
const intlMiddleware = createMiddleware({
  locales: ['fr', 'en', 'ar'],
  defaultLocale: 'fr',
  localePrefix: 'always'
})

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclure explicitement les routes d'authentification OAuth
  if (pathname.startsWith('/api/auth/')) {
    console.log(`🔄 [Middleware] Skipping intl for auth route: ${pathname}`)
    return NextResponse.next()
  }

  // Exclure les fichiers spéciaux PWA/SEO à la racine
  if (
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/browserconfig.xml' ||
    pathname.startsWith('/sw.') ||
    pathname.startsWith('/workbox-')
  ) {
    return NextResponse.next()
  }
  
  // Appliquer le middleware d'internationalisation
  const response = intlMiddleware(request)
  
  // Ajouter des headers de performance
  response.headers.set('X-Middleware-Cache', 'optimized')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}

export const config = {
  matcher: [
    // Matcher optimisé pour éviter les fichiers statiques ET les routes API d'auth
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/',
    '/(fr|en|ar)/:path*'
  ]
}