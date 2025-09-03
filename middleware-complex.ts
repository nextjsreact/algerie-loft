import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'

// Configuration next-intl
const intlMiddleware = createIntlMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always' // Toujours utiliser le préfixe de locale
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // D'abord, gérer l'internationalisation pour les routes sans locale
  const pathnameIsMissingLocale = ['fr', 'ar', 'en'].every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )
  
  if (pathnameIsMissingLocale && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    // Détecter la langue préférée depuis les cookies ou headers
    let preferredLocale = request.cookies.get('language')?.value || 'fr'
    if (!['fr', 'ar', 'en'].includes(preferredLocale)) {
      preferredLocale = 'fr'
    }
    
    return NextResponse.redirect(
      new URL(`/${preferredLocale}${pathname === '/' ? '' : pathname}`, request.url)
    )
  }
  
  // Si c'est une route API ou _next, passer directement
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Log incoming cookies (development only)
  // Set default language to 'fr' if not explicitly set
  let language = request.cookies.get('language')?.value;
  if (!language || !['en', 'fr', 'ar'].includes(language)) {
    supabaseResponse.cookies.set('language', 'fr', { 
      path: '/', 
      maxAge: 31536000,
      sameSite: 'lax'
    });
  }

  if (process.env.NODE_ENV === 'development') {
    const cookies = request.cookies.getAll();
    console.log("Middleware: Incoming cookies:", cookies.map(c => c.name));
    
    // Check for cookie size issues
    const totalCookieSize = cookies.reduce((total, cookie) =>
      total + cookie.name.length + (cookie.value?.length || 0), 0
    );
    
    if (totalCookieSize > 4000) { // Warn if approaching limit
      console.warn(`⚠️ Large cookie size detected: ${totalCookieSize} bytes`);
      console.warn('🧹 Clear cookies: Open scripts/clear-cookies.html in browser');
      console.warn('🔄 Or use private browsing: Ctrl+Shift+N');
    }
    
    // Auto-cleanup old Supabase cookies in development
    if (totalCookieSize > 6000) { // Critical size
      console.error('🚨 CRITICAL: Cookie size too large! This may cause 431 errors');
      console.error('🛠️ SOLUTION: Clear all cookies immediately');
      console.error('📁 Use: scripts/clear-cookies.html');
    }
  }

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; expires?: Date; sameSite?: boolean | "lax" | "strict" | "none" }) {
          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name: string, options: { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; expires?: Date; sameSite?: boolean | "lax" | "strict" | "none" }) {
          supabaseResponse.cookies.set(name, '', options)
        },
      },
    }
  )

  // Refresh session if expired and set cookies
  // IMPORTANT: Do not run any other code between createServerClient and getUser
  // or getSession. A simple mistake could make it very hard to debug issues
  // with users being randomly logged out.
  let session = null
  let user = null
  let sessionError = null
  let userError = null

  try {
    const sessionResult = await supabase.auth.getSession()
    session = sessionResult.data.session
    sessionError = sessionResult.error

    const userResult = await supabase.auth.getUser()
    user = userResult.data.user
    userError = userResult.error
  } catch (error) {
    console.error('Middleware: Error getting session/user:', error)
    return supabaseResponse
  }

  // Manually set cookies on the response
  if (session && session.access_token) {
    supabaseResponse.cookies.set({
      name: 'sb-access-token', // Or whatever your Supabase access token cookie is named
      value: session.access_token,
      httpOnly: true,
      secure: true, // Use true in production
      path: '/',
      maxAge: session.expires_in, // Or session.expires_at - Math.floor(Date.now() / 1000)
    });
  }
  if (session && session.refresh_token) {
    supabaseResponse.cookies.set({
      name: 'sb-refresh-token', // Or whatever your Supabase refresh token cookie is named
      value: session.refresh_token,
      httpOnly: true,
      secure: true, // Use true in production
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // Example: 7 days
    });
  }

  // Log cookies after session refresh attempt (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log("Middleware: Supabase response cookies after refresh:", supabaseResponse.cookies.getAll().map(c => c.name));
  }

  // Log errors only if they're not "session missing" errors
  if (sessionError || userError) {
    const isSessionMissing = sessionError?.message?.includes('Auth session missing') || 
                            userError?.message?.includes('Auth session missing');
    
    if (!isSessionMissing) {
      console.error("Middleware session or user error:", sessionError || userError);
    } else if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH) {
      console.log("Middleware: No session (normal for public requests)");
    }
  }

  // Extraire la locale du pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})/)
  const locale = localeMatch ? localeMatch[1] : 'fr'
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
  
  const publicRoutes = ["/login", "/register", "/forgot-password"]
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale)

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${locale}/login`
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (user && isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(redirectUrl)
  }

  // Executive route protection
  if (pathnameWithoutLocale.startsWith('/executive')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    // Get user profile to check role
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profile || profile.role !== 'executive') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `/${locale}/dashboard`
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware: Error checking executive role:', error)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `/${locale}/dashboard`
      return NextResponse.redirect(redirectUrl)
    }
  }

  // IMPORTANT: You must return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!
  return supabaseResponse
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
