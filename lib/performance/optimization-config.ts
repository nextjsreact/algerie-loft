/**
 * Configuration d'optimisation des performances
 * Centralise toutes les optimisations de l'application
 */

// Configuration du cache
export const CACHE_CONFIG = {
  // Cache des requêtes API
  API_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  STATIC_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 heures
  
  // Cache des images
  IMAGE_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 jours
  
  // Cache des traductions
  I18N_CACHE_TTL: 60 * 60 * 1000, // 1 heure
} as const;

// Configuration du lazy loading
export const LAZY_LOADING_CONFIG = {
  // Intersection Observer options
  rootMargin: '50px',
  threshold: 0.1,
  
  // Composants à charger en lazy
  LAZY_COMPONENTS: [
    'ReportGenerator',
    'PhotoUpload',
    'BillManagement',
    'TransactionChart',
    'PerformanceDashboard'
  ],
} as const;

// Configuration de la pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Tailles par type de contenu
  TRANSACTIONS_PAGE_SIZE: 25,
  LOFTS_PAGE_SIZE: 12,
  NOTIFICATIONS_PAGE_SIZE: 15,
  RESERVATIONS_PAGE_SIZE: 20,
} as const;

// Configuration des images
export const IMAGE_OPTIMIZATION = {
  // Qualités par contexte
  THUMBNAIL_QUALITY: 60,
  GALLERY_QUALITY: 80,
  HERO_QUALITY: 90,
  
  // Tailles responsives
  BREAKPOINTS: [640, 768, 1024, 1280, 1536],
  
  // Formats supportés
  FORMATS: ['image/avif', 'image/webp', 'image/jpeg'],
  
  // Lazy loading
  LOADING_STRATEGY: 'lazy' as const,
  PRIORITY_IMAGES: ['logo', 'hero', 'above-fold'],
} as const;

// Configuration du debouncing
export const DEBOUNCE_CONFIG = {
  SEARCH_DELAY: 300,
  RESIZE_DELAY: 150,
  SCROLL_DELAY: 100,
  INPUT_DELAY: 200,
} as const;

// Configuration de la compression
export const COMPRESSION_CONFIG = {
  // Gzip/Brotli
  ENABLE_COMPRESSION: true,
  COMPRESSION_LEVEL: 6,
  
  // Minification
  MINIFY_CSS: true,
  MINIFY_JS: true,
  MINIFY_HTML: true,
} as const;

// Configuration du prefetching
export const PREFETCH_CONFIG = {
  // Pages critiques à précharger
  CRITICAL_ROUTES: [
    '/home',
    '/dashboard',
    '/lofts',
    '/reservations'
  ],
  
  // Ressources à précharger
  PRELOAD_RESOURCES: [
    '/logo.jpg',
    '/fonts/inter.woff2'
  ],
} as const;

// Configuration des Web Vitals
export const WEB_VITALS_CONFIG = {
  // Seuils de performance
  LCP_THRESHOLD: 2500, // Largest Contentful Paint
  FID_THRESHOLD: 100,  // First Input Delay
  CLS_THRESHOLD: 0.1,  // Cumulative Layout Shift
  
  // Monitoring
  ENABLE_MONITORING: true,
  SAMPLE_RATE: 0.1, // 10% des sessions
} as const;