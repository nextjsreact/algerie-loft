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
  const response = intlMiddleware(request);

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/public',
    '/site-public',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];

  // Vérifier si la route actuelle est publique
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some(route => {
    // Vérifier avec et sans préfixe de locale
    return pathname.includes(route) || 
           pathname.match(new RegExp(`^/[a-z]{2}${route}$`)) ||
           pathname.match(new RegExp(`^/[a-z]{2}${route}/`));
  });

  // Si c'est une route publique, on retourne directement la réponse sans vérification d'auth
  if (isPublicRoute) {
    return response;
  }

  // Pour les autres routes, on vérifie l'authentification
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

  // Si pas de session et pas une route publique, rediriger vers login
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
     * - reset-password (password reset page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|reset-password).*)',
  ],
};