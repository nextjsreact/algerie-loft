import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  // D'abord, laissons next-intl gérer l'internationalisation
  const response = intlMiddleware(request);

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/',
    '/fr',
    '/en', 
    '/ar',
    '/public',
    '/site-public',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];

  const pathname = request.nextUrl.pathname;
  
  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => {
    // Route exacte
    if (pathname === route) return true;
    // Route avec préfixe de locale
    if (pathname.startsWith('/fr' + route) || 
        pathname.startsWith('/en' + route) || 
        pathname.startsWith('/ar' + route)) return true;
    // Route contenant le pattern public
    if (pathname.includes('/public')) return true;
    return false;
  });

  // Si c'est une route publique, pas besoin d'authentification
  if (isPublicRoute) {
    return response;
  }

  // Pour les autres routes, vérifier l'authentification
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Si pas de session, rediriger vers login
  if (!session) {
    const locale = pathname.split('/')[1] || 'fr';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};