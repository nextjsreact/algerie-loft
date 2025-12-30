import { NextRequest, NextResponse } from 'next/server';

// Performance optimization middleware
export function performanceMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  // Cache control for static assets
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/_next/static/') || 
      pathname.startsWith('/static/') ||
      pathname.match(/\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Cache static assets for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/')) {
    // API routes - no cache by default
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    // HTML pages - cache for 1 hour, revalidate
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }
  
  // Preload critical resources
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    response.headers.set('Link', [
      '</logo.png>; rel=preload; as=image',
      '</_next/static/css/app.css>; rel=preload; as=style',
      '</_next/static/chunks/main.js>; rel=preload; as=script'
    ].join(', '));
  }
  
  // Compress responses (if not already handled by deployment platform)
  if (request.headers.get('accept-encoding')?.includes('br')) {
    response.headers.set('Content-Encoding', 'br');
  } else if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }
  
  // Add performance timing header
  response.headers.set('Server-Timing', `middleware;dur=${Date.now()}`);
  
  return response;
}

// Resource hints for critical resources
export function addResourceHints(response: NextResponse, pathname: string) {
  const hints: string[] = [];
  
  // DNS prefetch for external domains
  hints.push('<//fonts.googleapis.com>; rel=dns-prefetch');
  hints.push('<//fonts.gstatic.com>; rel=dns-prefetch');
  
  // Preconnect to critical origins
  hints.push('<//fonts.googleapis.com>; rel=preconnect; crossorigin');
  
  // Prefetch likely next pages
  if (pathname === '/') {
    hints.push('</dashboard>; rel=prefetch');
    hints.push('</login>; rel=prefetch');
  } else if (pathname === '/login') {
    hints.push('</dashboard>; rel=prefetch');
  }
  
  if (hints.length > 0) {
    const existingLink = response.headers.get('Link') || '';
    const newLink = existingLink ? `${existingLink}, ${hints.join(', ')}` : hints.join(', ');
    response.headers.set('Link', newLink);
  }
  
  return response;
}

// Performance monitoring
export function addPerformanceMonitoring(response: NextResponse) {
  // Add timing headers for monitoring
  const timing = {
    'middleware-start': Date.now(),
    'middleware-end': Date.now()
  };
  
  const timingHeader = Object.entries(timing)
    .map(([key, value]) => `${key};dur=${value}`)
    .join(', ');
    
  response.headers.set('Server-Timing', timingHeader);
  
  return response;
}

// Content Security Policy for performance and security
export function addCSP(response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseWsUrl = supabaseUrl.replace('https://', 'wss://');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    // In development, allow all WebSocket connections for debugging tools
    // In production, only allow specific origins
    isDevelopment 
      ? `connect-src 'self' https: ws: wss: ${supabaseUrl} ${supabaseWsUrl}`
      : `connect-src 'self' https: wss: ${supabaseUrl} ${supabaseWsUrl}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}