import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

// Configuration next-intl
const intlMiddleware = createMiddleware({
  locales: ['fr', 'en', 'ar'],
  defaultLocale: 'fr',
  localePrefix: 'always'
})

export default function middleware(request: NextRequest) {
  // Appliquer le middleware d'internationalisation
  const response = intlMiddleware(request)
  
  // Ajouter des headers de performance
  response.headers.set('X-Middleware-Cache', 'optimized')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}

export const config = {
  matcher: [
    // Matcher optimisé pour éviter les fichiers statiques
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/',
    '/(fr|en|ar)/:path*'
  ]
}