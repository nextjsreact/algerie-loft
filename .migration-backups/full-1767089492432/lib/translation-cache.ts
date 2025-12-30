/**
 * Cache optimisé pour les traductions
 */

// Cache en mémoire pour les traductions
const translationCache = new Map<string, any>();
const cacheTimestamps = new Map<string, number>();

// Durée de vie du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

export class TranslationCache {
  static get(key: string): any | null {
    const timestamp = cacheTimestamps.get(key);
    
    // Vérifier si le cache est expiré
    if (timestamp && Date.now() - timestamp > CACHE_TTL) {
      this.delete(key);
      return null;
    }
    
    return translationCache.get(key) || null;
  }
  
  static set(key: string, value: any): void {
    translationCache.set(key, value);
    cacheTimestamps.set(key, Date.now());
  }
  
  static delete(key: string): void {
    translationCache.delete(key);
    cacheTimestamps.delete(key);
  }
  
  static clear(): void {
    translationCache.clear();
    cacheTimestamps.clear();
  }
  
  static has(key: string): boolean {
    const timestamp = cacheTimestamps.get(key);
    
    // Vérifier si le cache est expiré
    if (timestamp && Date.now() - timestamp > CACHE_TTL) {
      this.delete(key);
      return false;
    }
    
    return translationCache.has(key);
  }
  
  static size(): number {
    return translationCache.size;
  }
  
  // Précharger les traductions essentielles
  static async preloadEssentials(locale: string): Promise<void> {
    const essentialKeys = ['nav', 'common', 'auth', 'lofts'];
    
    for (const key of essentialKeys) {
      const cacheKey = `${locale}-${key}`;
      
      if (!this.has(cacheKey)) {
        try {
          // Charger depuis les fichiers optimisés
          const module = await import(`@/messages/${locale}-optimized.json`);
          const data = module.default;
          
          if (data[key]) {
            this.set(cacheKey, data[key]);
          }
        } catch (error) {
          console.warn(`Failed to preload ${key} for ${locale}:`, error);
        }
      }
    }
  }
}

// Précharger au démarrage
if (typeof window !== 'undefined') {
  // Précharger les traductions pour la locale actuelle
  const currentLocale = document.documentElement.lang || 'fr';
  TranslationCache.preloadEssentials(currentLocale);
}