// Performance optimization utilities

// Image optimization helpers
export function generateImageSizes(maxWidth: number = 1920): string {
  const breakpoints = [640, 768, 1024, 1280, 1536, maxWidth];
  return breakpoints
    .filter(bp => bp <= maxWidth)
    .map(bp => `(max-width: ${bp}px) ${bp}px`)
    .join(', ') + `, ${maxWidth}px`;
}

export function generateResponsiveImageProps(
  src: string,
  alt: string,
  width: number,
  height: number,
  priority: boolean = false
) {
  return {
    src,
    alt,
    width,
    height,
    priority,
    sizes: generateImageSizes(width),
    quality: 85,
    placeholder: 'blur' as const,
    blurDataURL: generateBlurDataURL(width, height),
  };
}

export function generateBlurDataURL(width: number, height: number): string {
  const aspectRatio = width / height;
  const blurWidth = 8;
  const blurHeight = Math.round(blurWidth / aspectRatio);
  
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${blurWidth}" height="${blurHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>`
  ).toString('base64')}`;
}

// Resource preloading utilities
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  const criticalResources = [
    { href: '/images/hero-bg.webp', as: 'image', type: 'image/webp' },
    { href: '/images/logo.png', as: 'image', type: 'image/png' },
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
  });
}

// Lazy loading utilities
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Performance monitoring utilities
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return fn();
  }

  const startTime = performance.now();
  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const endTime = performance.now();
      console.log(`${name} took ${endTime - startTime} milliseconds`);
    });
  } else {
    const endTime = performance.now();
    console.log(`${name} took ${endTime - startTime} milliseconds`);
    return result;
  }
}

// Bundle size optimization
export function dynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  return importFn().catch((error) => {
    console.error('Dynamic import failed:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  });
}

// Memory management utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache utilities
export class SimpleCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttl: number = 300000): void { // 5 minutes default
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Network optimization
export function prefetchRoute(href: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

export function preconnectToOrigin(origin: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  document.head.appendChild(link);
}

// Service Worker utilities
export function registerServiceWorker(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register(swPath)
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);
      return registration;
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
      return null;
    });
}

// Critical CSS utilities
export function inlineCriticalCSS(css: string): void {
  if (typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Performance budget monitoring
export interface PerformanceBudget {
  maxBundleSize: number; // in KB
  maxImageSize: number; // in KB
  maxLoadTime: number; // in ms
  maxCLS: number;
  maxFID: number; // in ms
  maxLCP: number; // in ms
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxBundleSize: 250, // 250KB
  maxImageSize: 100, // 100KB
  maxLoadTime: 3000, // 3 seconds
  maxCLS: 0.1,
  maxFID: 100, // 100ms
  maxLCP: 2500, // 2.5 seconds
};

export function checkPerformanceBudget(
  metrics: Partial<PerformanceBudget>,
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  Object.entries(metrics).forEach(([key, value]) => {
    const budgetKey = key as keyof PerformanceBudget;
    if (value !== undefined && value > budget[budgetKey]) {
      violations.push(`${key}: ${value} exceeds budget of ${budget[budgetKey]}`);
    }
  });

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Resource hints utilities
export function addResourceHints(): void {
  if (typeof window === 'undefined') return;

  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
    document.head.appendChild(link);
  });
}