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
  
  // Routes publiques - ne pas appliquer l'authentification
  const isPublicPath = 
    pathname === '/' ||
    pathname === '/fr' ||
    pathname === '/en' ||
    pathname === '/ar' ||
    pathname.startsWith('/fr/public') ||
    pathname.startsWith('/en/public') ||
    pathname.startsWith('/ar/public') ||
    pathname.startsWith('/fr/login') ||
    pathname.startsWith('/en/login') ||
    pathname.startsWith('/ar/login') ||
    pathname.startsWith('/fr/register') ||
    pathname.startsWith('/en/register') ||
    pathname.startsWith('/ar/register') ||
    pathname.startsWith('/fr/forgot-password') ||
    pathname.startsWith('/en/forgot-password') ||
    pathname.startsWith('/ar/forgot-password') ||
    pathname.startsWith('/fr/reset-password') ||
    pathname.startsWith('/en/reset-password') ||
    pathname.startsWith('/ar/reset-password') ||
    pathname.startsWith('/site-public');

  // Pour les routes publiques, appliquer seulement l'internationalisation
  if (isPublicPath) {
    return intlMiddleware(request);
  }

  // Pour les autres routes, appliquer l'internationalisation puis l'authentification
  const response = intlMiddleware(request);
  
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