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
  
  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  
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