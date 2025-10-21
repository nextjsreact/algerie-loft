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
  const pathname = request.nextUrl.pathname;
  const hostname = request.nextUrl.hostname;
  
  // Log pour diagnostic (sera visible dans les logs Vercel)
  console.log(`[MIDDLEWARE] ${hostname}${pathname}`);
  
  // Routes publiques complètes - TOUTES les routes qui ne nécessitent pas d'auth
  const publicPaths = [
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
  
  // Vérifier si c'est une route publique (exacte ou avec préfixe de locale)
  const isPublicRoute = publicPaths.some(publicPath => {
    // Route exacte
    if (pathname === publicPath) return true;
    // Route avec préfixe de locale
    if (pathname === `/fr${publicPath}` || 
        pathname === `/en${publicPath}` || 
        pathname === `/ar${publicPath}`) return true;
    // Route qui commence par le pattern public
    if (pathname.startsWith(`/fr${publicPath}/`) || 
        pathname.startsWith(`/en${publicPath}/`) || 
        pathname.startsWith(`/ar${publicPath}/`)) return true;
    return false;
  });

  console.log(`[MIDDLEWARE] isPublicRoute: ${isPublicRoute}`);

  // Si c'est une route publique, appliquer seulement l'internationalisation
  if (isPublicRoute) {
    console.log(`[MIDDLEWARE] Public route - applying i18n only`);
    return intlMiddleware(request);
  }

  // Pour les routes privées, appliquer i18n puis vérifier l'auth
  console.log(`[MIDDLEWARE] Private route - checking auth`);
  const response = intlMiddleware(request);
  
  try {
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
    console.log(`[MIDDLEWARE] Session exists: ${!!session}`);

    if (!session) {
      const locale = pathname.split('/')[1] || 'fr';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      console.log(`[MIDDLEWARE] No session - redirecting to: ${loginUrl.pathname}`);
      return NextResponse.redirect(loginUrl);
    }

    console.log(`[MIDDLEWARE] Session valid - allowing access`);
    return response;
  } catch (error) {
    console.error(`[MIDDLEWARE] Auth error:`, error);
    const locale = pathname.split('/')[1] || 'fr';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }
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