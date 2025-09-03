/**
 * Configuration centralisée pour les optimisations de traduction
 */

export interface TranslationConfig {
  // Configuration du cache
  cache: {
    ttl: number; // Time to live en millisecondes
    maxSize: number; // Nombre maximum d'entrées
    cleanupInterval: number; // Intervalle de nettoyage en millisecondes
  };
  
  // Configuration du lazy loading
  lazyLoading: {
    enabled: boolean;
    preloadCritical: boolean; // Précharger les traductions critiques
    preloadRoutes: string[]; // Routes à précharger
  };
  
  // Configuration du bundle splitting
  bundleSplitting: {
    enabled: boolean;
    splitByLanguage: boolean;
    splitByNamespace: boolean;
    maxChunkSize: number; // Taille max en bytes
  };
  
  // Configuration du monitoring
  monitoring: {
    enabled: boolean;
    trackUsage: boolean;
    logPerformance: boolean;
    showDevTools: boolean;
  };
  
  // Configuration des namespaces
  namespaces: {
    critical: string[]; // Namespaces critiques à précharger
    common: string[]; // Namespaces communs
    routeMapping: Record<string, string[]>; // Mapping route -> namespaces
  };
}

// Configuration par défaut
export const defaultTranslationConfig: TranslationConfig = {
  cache: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 1000,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  },
  
  lazyLoading: {
    enabled: true,
    preloadCritical: true,
    preloadRoutes: ['/dashboard', '/lofts'],
  },
  
  bundleSplitting: {
    enabled: true,
    splitByLanguage: true,
    splitByNamespace: true,
    maxChunkSize: 50 * 1024, // 50KB
  },
  
  monitoring: {
    enabled: process.env.NODE_ENV === 'development',
    trackUsage: true,
    logPerformance: process.env.NODE_ENV === 'development',
    showDevTools: process.env.NODE_ENV === 'development',
  },
  
  namespaces: {
    critical: ['common', 'nav', 'auth'],
    common: ['common', 'nav', 'forms'],
    routeMapping: {
      '/': ['landing', 'common', 'nav'],
      '/login': ['auth', 'common'],
      '/register': ['auth', 'common'],
      '/dashboard': ['dashboard', 'common', 'nav'],
      '/lofts': ['lofts', 'common', 'nav', 'forms'],
      '/lofts/add': ['lofts', 'common', 'nav', 'forms'],
      '/lofts/edit': ['lofts', 'common', 'nav', 'forms'],
      '/transactions': ['transactions', 'common', 'nav', 'forms'],
      '/transactions/add': ['transactions', 'common', 'nav', 'forms'],
      '/teams': ['teams', 'common', 'nav', 'forms'],
      '/owners': ['owners', 'common', 'nav', 'forms'],
      '/tasks': ['tasks', 'common', 'nav', 'forms'],
      '/reservations': ['reservations', 'common', 'nav', 'forms'],
      '/reports': ['reports', 'analytics', 'common', 'nav'],
      '/analytics': ['analytics', 'reports', 'common', 'nav'],
      '/settings': ['settings', 'common', 'nav', 'forms'],
      '/admin': ['admin', 'common', 'nav'],
    },
  },
};

// Configuration pour la production (plus conservative)
export const productionTranslationConfig: TranslationConfig = {
  ...defaultTranslationConfig,
  cache: {
    ...defaultTranslationConfig.cache,
    ttl: 60 * 60 * 1000, // 1 heure en production
    maxSize: 500, // Moins d'entrées en production
  },
  monitoring: {
    enabled: false,
    trackUsage: false,
    logPerformance: false,
    showDevTools: false,
  },
  lazyLoading: {
    ...defaultTranslationConfig.lazyLoading,
    preloadRoutes: ['/dashboard'], // Moins de préchargement en production
  },
};

// Configuration pour les tests
export const testTranslationConfig: TranslationConfig = {
  ...defaultTranslationConfig,
  cache: {
    ttl: 1000, // 1 seconde pour les tests
    maxSize: 10,
    cleanupInterval: 100,
  },
  lazyLoading: {
    enabled: false, // Désactiver le lazy loading pour les tests
    preloadCritical: false,
    preloadRoutes: [],
  },
  monitoring: {
    enabled: false,
    trackUsage: false,
    logPerformance: false,
    showDevTools: false,
  },
};

/**
 * Obtenir la configuration selon l'environnement
 */
export function getTranslationConfig(): TranslationConfig {
  switch (process.env.NODE_ENV) {
    case 'production':
      return productionTranslationConfig;
    case 'test':
      return testTranslationConfig;
    default:
      return defaultTranslationConfig;
  }
}

/**
 * Fusionner une configuration personnalisée avec la configuration par défaut
 */
export function mergeTranslationConfig(
  customConfig: Partial<TranslationConfig>
): TranslationConfig {
  const baseConfig = getTranslationConfig();
  
  return {
    cache: { ...baseConfig.cache, ...customConfig.cache },
    lazyLoading: { ...baseConfig.lazyLoading, ...customConfig.lazyLoading },
    bundleSplitting: { ...baseConfig.bundleSplitting, ...customConfig.bundleSplitting },
    monitoring: { ...baseConfig.monitoring, ...customConfig.monitoring },
    namespaces: {
      ...baseConfig.namespaces,
      ...customConfig.namespaces,
      routeMapping: {
        ...baseConfig.namespaces.routeMapping,
        ...customConfig.namespaces?.routeMapping,
      },
    },
  };
}

/**
 * Valider la configuration
 */
export function validateTranslationConfig(config: TranslationConfig): string[] {
  const errors: string[] = [];
  
  if (config.cache.ttl <= 0) {
    errors.push('Cache TTL must be positive');
  }
  
  if (config.cache.maxSize <= 0) {
    errors.push('Cache max size must be positive');
  }
  
  if (config.bundleSplitting.maxChunkSize <= 0) {
    errors.push('Max chunk size must be positive');
  }
  
  if (config.namespaces.critical.length === 0) {
    errors.push('At least one critical namespace must be defined');
  }
  
  return errors;
}