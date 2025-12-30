/**
 * Domain configuration utilities for loftalgerie.com
 */

export interface DomainConfig {
  domain: string;
  defaultRoute: string;
  publicRoutes: string[];
  adminRoutes: string[];
  locales: string[];
  redirects: RedirectRule[];
}

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  locale?: boolean;
}

export interface RouteMapping {
  public: {
    root: string;
    services: string;
    portfolio: string;
    about: string;
    contact: string;
  };
  admin: {
    dashboard: string;
    login: string;
    protected: string[];
  };
}

/**
 * Main domain configuration for loftalgerie.com
 */
export const domainConfig: DomainConfig = {
  domain: 'loftalgerie.com',
  defaultRoute: '/public',
  publicRoutes: [
    '/public',
    '/site-public',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ],
  adminRoutes: [
    '/admin',
    '/dashboard',
    '/profile',
    '/settings'
  ],
  locales: ['fr', 'en', 'ar'],
  redirects: [
    {
      source: '/',
      destination: '/public',
      permanent: false,
      locale: true
    }
  ]
};

/**
 * Route mapping for clean URLs
 */
export const routeMapping: RouteMapping = {
  public: {
    root: '/public',
    services: '/public/services',
    portfolio: '/public/portfolio',
    about: '/public/about',
    contact: '/public/contact'
  },
  admin: {
    dashboard: '/admin/dashboard',
    login: '/login',
    protected: ['/admin', '/dashboard', '/profile', '/settings']
  }
};

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return domainConfig.publicRoutes.some(route => {
    // Check with and without locale prefix
    return pathname.includes(route) || 
           pathname.match(new RegExp(`^/[a-z]{2}${route}`)) ||
           pathname.match(new RegExp(`^/[a-z]{2}${route}/`));
  });
}

/**
 * Check if a route is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return domainConfig.adminRoutes.some(route => {
    return pathname.includes(route) || 
           pathname.match(new RegExp(`^/[a-z]{2}${route}`)) ||
           pathname.match(new RegExp(`^/[a-z]{2}${route}/`));
  });
}

/**
 * Get the canonical URL for a given path and locale
 */
export function getCanonicalUrl(path: string, locale: string = 'fr'): string {
  const baseUrl = `https://${domainConfig.domain}`;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/${locale}${cleanPath}`;
}

/**
 * Get alternate language URLs for SEO
 */
export function getAlternateUrls(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  domainConfig.locales.forEach(locale => {
    alternates[locale] = getCanonicalUrl(path, locale);
  });
  
  return alternates;
}

/**
 * Check if the current domain is the custom domain
 */
export function isCustomDomain(hostname: string): boolean {
  return hostname === domainConfig.domain || hostname === `www.${domainConfig.domain}`;
}

/**
 * Get the appropriate redirect URL based on locale and route
 */
export function getRedirectUrl(locale: string, route: string = '/public'): string {
  return `/${locale}${route}`;
}

/**
 * Extract locale from pathname
 */
export function extractLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (domainConfig.locales.includes(firstSegment)) {
    return firstSegment;
  }
  
  return 'fr'; // default locale
}

/**
 * Build clean public URLs for the custom domain
 */
export function buildPublicUrl(route: string, locale: string = 'fr'): string {
  const baseRoute = routeMapping.public[route as keyof typeof routeMapping.public];
  if (!baseRoute) {
    return getCanonicalUrl('/public', locale);
  }
  
  return getCanonicalUrl(baseRoute, locale);
}