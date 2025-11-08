/**
 * Optimisations de Performance Immédiates
 * Fonctions utilitaires pour améliorer les performances instantanément
 */

import React from 'react'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// 1. Cache pour les requêtes de base de données
export const createCachedQuery = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = 300 // 5 minutes par défaut
) => {
  return unstable_cache(
    async (...args: T) => {
      console.log(`🔄 Cache miss for ${keyPrefix}:`, args)
      const result = await fn(...args)
      console.log(`✅ Cache set for ${keyPrefix}`)
      return result
    },
    [keyPrefix],
    {
      revalidate,
      tags: [keyPrefix]
    }
  )
}

// 2. Memoization pour les composants React
export const memoizeComponent = cache

// 3. Debounce pour les inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 4. Throttle pour les événements fréquents
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 5. Lazy loading pour les composants
export const createLazyComponent = (importFn: () => Promise<any>) => {
  return React.lazy(importFn)
}

// 6. Préchargement des ressources critiques
export const preloadResource = (href: string, as: string = 'script') => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  }
}

// 7. Optimisation des images
export const getOptimizedImageProps = (
  src: string,
  width: number,
  height: number,
  quality: number = 75
) => ({
  src,
  width,
  height,
  quality,
  loading: 'lazy' as const,
  placeholder: 'blur' as const,
  blurDataURL: `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/></svg>`
  ).toString('base64')}`,
})

// 8. Cache localStorage avec TTL
export class LocalStorageCache {
  private static instance: LocalStorageCache
  
  static getInstance(): LocalStorageCache {
    if (!LocalStorageCache.instance) {
      LocalStorageCache.instance = new LocalStorageCache()
    }
    return LocalStorageCache.instance
  }

  set(key: string, value: any, ttl: number = 300000): void { // 5 minutes par défaut
    if (typeof window === 'undefined') return
    
    const item = {
      value,
      expiry: Date.now() + ttl
    }
    localStorage.setItem(key, JSON.stringify(item))
  }

  get(key: string): any | null {
    if (typeof window === 'undefined') return null
    
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    try {
      const item = JSON.parse(itemStr)
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key)
        return null
      }
      return item.value
    } catch {
      localStorage.removeItem(key)
      return null
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

// 9. Optimisation des requêtes API
export const createOptimizedFetch = (baseURL: string = '') => {
  const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  return async (
    endpoint: string,
    options: RequestInit & { ttl?: number } = {}
  ) => {
    const { ttl = 300000, ...fetchOptions } = options // 5 minutes par défaut
    const cacheKey = `${endpoint}:${JSON.stringify(fetchOptions)}`
    
    // Vérifier le cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`🎯 Cache hit for ${endpoint}`)
      return cached.data
    }

    // Faire la requête
    console.log(`🔄 Fetching ${endpoint}`)
    const response = await fetch(`${baseURL}${endpoint}`, fetchOptions)
    const data = await response.json()

    // Mettre en cache
    cache.set(cacheKey, { data, timestamp: Date.now(), ttl })
    
    return data
  }
}

// 10. Monitoring des performances
export const performanceMonitor = {
  startTiming: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${label}-start`)
    }
  },

  endTiming: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      
      const measure = performance.getEntriesByName(label)[0]
      console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`)
      
      // Nettoyer les marks
      performance.clearMarks(`${label}-start`)
      performance.clearMarks(`${label}-end`)
      performance.clearMeasures(label)
    }
  }
}

// 11. Optimisation des re-renders
export const createStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T => {
  const ref = React.useRef<T>(callback)
  const depsRef = React.useRef(deps)

  if (!shallowEqual(deps, depsRef.current)) {
    ref.current = callback
    depsRef.current = deps
  }

  return React.useCallback((...args: Parameters<T>) => {
    return ref.current(...args)
  }, []) as T
}

// Utilitaire pour la comparaison shallow
function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// 12. Lazy loading des traductions
export const createLazyTranslations = () => {
  const translationCache = new Map<string, any>()

  return {
    async loadTranslation(locale: string, namespace: string) {
      const key = `${locale}-${namespace}`
      
      if (translationCache.has(key)) {
        return translationCache.get(key)
      }

      try {
        const translation = await import(`../../messages/${locale}.json`)
        const namespaceData = namespace.split('.').reduce((obj, key) => obj?.[key], translation.default)
        
        translationCache.set(key, namespaceData)
        return namespaceData
      } catch (error) {
        console.error(`Failed to load translation ${key}:`, error)
        return {}
      }
    },

    clearCache() {
      translationCache.clear()
    }
  }
}

export default {
  createCachedQuery,
  memoizeComponent,
  debounce,
  throttle,
  preloadResource,
  getOptimizedImageProps,
  LocalStorageCache,
  createOptimizedFetch,
  performanceMonitor,
  createStableCallback,
  createLazyTranslations
}