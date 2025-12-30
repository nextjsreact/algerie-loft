// Optimisations pour next-intl
import { cache } from 'react';
import { Locale } from '@/i18n';
import { getTranslationConfig } from '@/lib/config/translation-config';

// Cache pour les messages de traduction avec TTL
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const messageCache = new Map<string, CacheEntry>();
const config = getTranslationConfig();

// Fonction pour vérifier si une entrée de cache est valide
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < config.cache.ttl;
}

// Fonction cachée pour charger les messages avec lazy loading
export const getMessages = cache(async (locale: Locale, namespaces?: string[]) => {
  const cacheKey = namespaces 
    ? `messages-${locale}-${namespaces.join(',')}`
    : `messages-${locale}`;
  
  // Vérifier le cache avec TTL
  const cachedEntry = messageCache.get(cacheKey);
  if (cachedEntry && isCacheValid(cachedEntry)) {
    return cachedEntry.data;
  }
  
  try {
    let messages: any;
    
    if (namespaces && namespaces.length > 0) {
      // Lazy loading par namespace
      messages = await loadMessagesByNamespaces(locale, namespaces);
    } else {
      // Chargement complet
      messages = (await import(`@/messages/${locale}.json`)).default;
    }
    
    // Mettre en cache avec TTL
    messageCache.set(cacheKey, {
      data: messages,
      timestamp: Date.now(),
      ttl: config.cache.ttl
    });
    
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback vers le français en cas d'erreur
    if (locale !== 'fr') {
      return getMessages('fr', namespaces);
    }
    return {};
  }
});

// Fonction pour charger seulement les namespaces nécessaires
async function loadMessagesByNamespaces(locale: Locale, namespaces: string[]): Promise<any> {
  try {
    // Charger le fichier complet une seule fois
    const allMessages = (await import(`@/messages/${locale}.json`)).default;
    
    // Filtrer par namespaces
    const filteredMessages: any = {};
    namespaces.forEach(namespace => {
      if (allMessages[namespace]) {
        filteredMessages[namespace] = allMessages[namespace];
      }
    });
    
    return filteredMessages;
  } catch (error) {
    console.error(`Failed to load namespaces ${namespaces.join(', ')} for locale ${locale}:`, error);
    return {};
  }
}

// Fonction pour précharger les messages de toutes les langues
export async function preloadAllMessages() {
  const locales: Locale[] = ['fr', 'en', 'ar'];
  
  await Promise.all(
    locales.map(async (locale) => {
      try {
        await getMessages(locale);
      } catch (error) {
        console.warn(`Failed to preload messages for ${locale}:`, error);
      }
    })
  );
}

// Fonction pour obtenir les clés de traduction manquantes
export function getMissingKeys(messages: any, requiredKeys: string[]): string[] {
  const missingKeys: string[] = [];
  
  requiredKeys.forEach(key => {
    if (!getNestedValue(messages, key)) {
      missingKeys.push(key);
    }
  });
  
  return missingKeys;
}

// Fonction utilitaire pour accéder aux valeurs imbriquées
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Configuration des namespaces par route (utilise la configuration centralisée)
export const routeNamespaces = config.namespaces.routeMapping;

// Fonction pour obtenir les namespaces nécessaires pour une route
export function getNamespacesForRoute(pathname: string): string[] {
  // Supprimer le préfixe de locale de l'URL
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  
  // Trouver la correspondance la plus spécifique
  const matchingRoute = Object.keys(routeNamespaces)
    .sort((a, b) => b.length - a.length) // Trier par longueur décroissante
    .find(route => cleanPath.startsWith(route));
  
  return matchingRoute ? routeNamespaces[matchingRoute] : ['common'];
}

// Fonction pour créer des messages filtrés par namespace
export function filterMessagesByNamespaces(messages: any, namespaces: string[]): any {
  const filtered: any = {};
  
  namespaces.forEach(namespace => {
    if (messages[namespace]) {
      filtered[namespace] = messages[namespace];
    }
  });
  
  return filtered;
}

// Préchargement intelligent des traductions
export async function preloadRouteTranslations(pathname: string, locale: Locale): Promise<void> {
  const namespaces = getNamespacesForRoute(pathname);
  
  // Précharger les traductions pour cette route
  await getMessages(locale, namespaces);
  
  // Précharger aussi les namespaces communs pour les autres langues
  const commonNamespaces = ['common', 'nav'];
  const otherLocales = (['fr', 'ar', 'en'] as Locale[]).filter(l => l !== locale);
  
  // Préchargement en arrière-plan (non bloquant)
  Promise.all(
    otherLocales.map(otherLocale => 
      getMessages(otherLocale, commonNamespaces).catch(err => 
        console.warn(`Failed to preload common translations for ${otherLocale}:`, err)
      )
    )
  );
}

// Nettoyage du cache avec stratégie LRU
export function cleanupCache(maxEntries: number = config.cache.maxSize): void {
  if (messageCache.size <= maxEntries) return;
  
  // Convertir en array et trier par timestamp
  const entries = Array.from(messageCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // Supprimer les plus anciennes entrées
  const toDelete = entries.slice(0, entries.length - maxEntries);
  toDelete.forEach(([key]) => messageCache.delete(key));
  
  console.log(`Cache cleanup: removed ${toDelete.length} entries`);
}

// Fonction pour obtenir les statistiques du cache
export function getCacheStats(): {
  size: number;
  hitRate: number;
  entries: Array<{ key: string; age: number; size: number }>;
} {
  const entries = Array.from(messageCache.entries()).map(([key, entry]) => ({
    key,
    age: Date.now() - entry.timestamp,
    size: JSON.stringify(entry.data).length
  }));
  
  return {
    size: messageCache.size,
    hitRate: 0, // TODO: Implémenter le tracking des hits/misses
    entries
  };
}

// Fonction pour précharger les traductions critiques au démarrage
export async function preloadCriticalTranslations(locale: Locale): Promise<void> {
  if (!config.lazyLoading.preloadCritical) return;
  
  const criticalNamespaces = config.namespaces.critical;
  
  try {
    await getMessages(locale, criticalNamespaces);
    console.log(`Preloaded critical translations for ${locale}`);
  } catch (error) {
    console.error(`Failed to preload critical translations for ${locale}:`, error);
  }
}