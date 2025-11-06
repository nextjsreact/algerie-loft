import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Configuration des locales supportées
const locales = ['fr', 'en', 'ar']
const defaultLocale = 'fr'

// Cache des redirections pour éviter les recalculs
const redirectCache = new Map<string, string>()

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Vérifier si le chemin contient déjà une locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Si pas de locale dans le chemin
  if (!pathnameHasLocale) {
    // Vérifier le cache d'abord
    const cacheKey = `${pathname}-${request.headers.get('accept-language')}`
    if (redirectCache.has(cacheKey)) {
      const cachedRedirect = redirectCache.get(cacheKey)!
      return NextResponse.redirect(new URL(cachedRedirect, request.url))
    }

    // Détecter la locale préférée
    let locale = defaultLocale

    // 1. Vérifier le cookie NEXT_LOCALE
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
    if (localeCookie && locales.includes(localeCookie)) {
      locale = localeCookie
    } else {
      // 2. Vérifier l'en-tête Accept-Language
      const acceptLanguage = request.headers.get('accept-language')
      if (acceptLanguage) {
        const preferredLocale = acceptLanguage
          .split(',')
          .map(lang => lang.split(';')[0].trim())
          .find(lang => {
            const shortLang = lang.split('-')[0]
            return locales.includes(shortLang)
          })
        
        if (preferredLocale) {
          const shortLang = preferredLocale.split('-')[0]
          if (locales.includes(shortLang)) {
            locale = shortLang
          }
        }
      }
    }

    // Construire la nouvelle URL
    const newUrl = `/${locale}${pathname}`
    
    // Mettre en cache la redirection
    redirectCache.set(cacheKey, newUrl)
    
    // Limiter la taille du cache
    if (redirectCache.size > 1000) {
      const firstKey = redirectCache.keys().next().value
      redirectCache.delete(firstKey)
    }

    return NextResponse.redirect(new URL(newUrl, request.url))
  }

  // Optimiser les en-têtes pour les performances
  const response = NextResponse.next()
  
  // Ajouter des en-têtes de cache pour les ressources statiques
  if (pathname.includes('/api/translations/')) {
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  }
  
  // Ajouter des en-têtes de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  return response
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques et les API routes non-traduction
    '/((?!api/(?!translations)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}