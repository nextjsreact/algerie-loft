'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useEffect, useCallback } from 'react'

// Cache avancé pour les traductions avec métadonnées
interface CacheEntry {
  value: any;
  timestamp: number;
  hitCount: number;
  namespace: string;
}

const translationCache = new Map<string, CacheEntry>()
const CACHE_MAX_SIZE = 1000
const CACHE_TTL = 1000 * 60 * 15 // 15 minutes

// Statistiques du cache
let cacheHits = 0
let cacheMisses = 0

/**
 * Hook optimisé pour les traductions avec cache avancé
 * Utilise un cache en mémoire avec TTL et LRU pour éviter les re-calculs
 */
export function useCachedTranslations(namespace: string) {
  const t = useTranslations(namespace)
  
  // Nettoyage périodique du cache
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      const entries = Array.from(translationCache.entries())
      
      // Supprimer les entrées expirées
      entries.forEach(([key, entry]) => {
        if (now - entry.timestamp > CACHE_TTL) {
          translationCache.delete(key)
        }
      })
      
      // Appliquer la stratégie LRU si le cache est trop grand
      if (translationCache.size > CACHE_MAX_SIZE) {
        const sortedEntries = entries
          .sort((a, b) => a[1].hitCount - b[1].hitCount)
          .slice(0, entries.length - CACHE_MAX_SIZE + 100) // Garder de la marge
        
        sortedEntries.forEach(([key]) => translationCache.delete(key))
      }
    }
    
    const interval = setInterval(cleanup, 60000) // Nettoyage toutes les minutes
    return () => clearInterval(interval)
  }, [])
  
  return useMemo(() => {
    const cacheKey = `${namespace}`
    
    // Vérifier si le namespace est déjà en cache
    const cachedEntry = translationCache.get(cacheKey)
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      cachedEntry.hitCount++
      cacheHits++
      return cachedEntry.value
    }
    
    cacheMisses++
    
    // Créer un proxy pour cacher les traductions individuelles
    const cachedT = new Proxy(t, {
      get(target, prop) {
        const key = String(prop)
        const fullKey = `${cacheKey}.${key}`
        
        // Vérifier le cache pour cette clé spécifique
        const cachedKeyEntry = translationCache.get(fullKey)
        if (cachedKeyEntry && Date.now() - cachedKeyEntry.timestamp < CACHE_TTL) {
          cachedKeyEntry.hitCount++
          cacheHits++
          return cachedKeyEntry.value
        }
        
        cacheMisses++
        
        try {
          const value = target(key as any)
          
          // Mettre en cache la valeur
          translationCache.set(fullKey, {
            value,
            timestamp: Date.now(),
            hitCount: 1,
            namespace
          })
          
          return value
        } catch (error) {
          console.warn(`Translation key not found: ${fullKey}`, error)
          return key // Fallback vers la clé elle-même
        }
      }
    })
    
    // Mettre en cache le namespace complet
    translationCache.set(cacheKey, {
      value: cachedT,
      timestamp: Date.now(),
      hitCount: 1,
      namespace
    })
    
    return cachedT
  }, [namespace, t])
}

/**
 * Nettoie le cache des traductions
 * Utile lors des changements de langue
 */
export function clearTranslationCache() {
  translationCache.clear()
  cacheHits = 0
  cacheMisses = 0
}

/**
 * Nettoie seulement les entrées d'un namespace spécifique
 */
export function clearNamespaceCache(namespace: string) {
  const keysToDelete = Array.from(translationCache.keys())
    .filter(key => key.startsWith(namespace))
  
  keysToDelete.forEach(key => translationCache.delete(key))
}

/**
 * Obtient les statistiques du cache côté client
 */
export function getClientCacheStats() {
  const totalRequests = cacheHits + cacheMisses
  const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0
  
  return {
    size: translationCache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: Math.round(hitRate * 100) / 100,
    entries: Array.from(translationCache.entries()).map(([key, entry]) => ({
      key,
      namespace: entry.namespace,
      hitCount: entry.hitCount,
      age: Date.now() - entry.timestamp
    }))
  }
}

/**
 * Hook pour précharger les traductions d'un namespace
 */
export function usePreloadTranslations(namespaces: string[]) {
  const preloadedTranslations = useMemo(() => {
    const translations: Record<string, any> = {}
    
    namespaces.forEach(namespace => {
      try {
        translations[namespace] = useCachedTranslations(namespace)
      } catch (error) {
        console.warn(`Failed to preload namespace ${namespace}:`, error)
      }
    })
    
    return translations
  }, [namespaces])
  
  return preloadedTranslations
}

/**
 * Hook pour les traductions communes (nav, common, etc.)
 * Pré-charge les traductions les plus utilisées
 */
export function useCommonTranslations() {
  const nav = useCachedTranslations('nav')
  const common = useCachedTranslations('common')
  const auth = useCachedTranslations('auth')
  
  return { nav, common, auth }
}

/**
 * Hook pour optimiser les traductions par route
 */
export function useRouteTranslations(pathname: string) {
  const getNamespacesForRoute = useCallback((path: string): string[] => {
    // Supprimer le préfixe de locale
    const cleanPath = path.replace(/^\/[a-z]{2}/, '') || '/'
    
    // Mapping des routes vers les namespaces
    const routeMap: Record<string, string[]> = {
      '/dashboard': ['dashboard', 'common', 'nav'],
      '/lofts': ['lofts', 'common', 'nav', 'forms'],
      '/transactions': ['transactions', 'common', 'nav', 'forms'],
      '/teams': ['teams', 'common', 'nav'],
      '/tasks': ['tasks', 'common', 'nav'],
      '/reservations': ['reservations', 'common', 'nav'],
      '/reports': ['reports', 'analytics', 'common', 'nav'],
      '/settings': ['settings', 'common', 'nav'],
    }
    
    // Trouver la correspondance la plus spécifique
    const matchingRoute = Object.keys(routeMap)
      .sort((a, b) => b.length - a.length)
      .find(route => cleanPath.startsWith(route))
    
    return matchingRoute ? routeMap[matchingRoute] : ['common', 'nav']
  }, [])
  
  const namespaces = useMemo(() => getNamespacesForRoute(pathname), [pathname, getNamespacesForRoute])
  
  return usePreloadTranslations(namespaces)
}