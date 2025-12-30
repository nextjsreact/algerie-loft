// Configuration du cache pour de meilleures performances
export const CACHE_CONFIG = {
  // Durées de cache (en millisecondes)
  DURATIONS: {
    SHORT: 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes  
    LONG: 30 * 60 * 1000,  // 30 minutes
    VERY_LONG: 24 * 60 * 60 * 1000 // 24 heures
  },
  
  // Clés de cache
  KEYS: {
    LOFTS_LIST: 'lofts:list',
    LOFT_DETAIL: 'loft:detail',
    USER_PROFILE: 'user:profile',
    TRANSLATIONS: 'translations'
  }
}

// Cache simple avec localStorage
export class SimpleCache {
  static set(key: string, data: any, ttl: number = CACHE_CONFIG.DURATIONS.MEDIUM) {
    if (typeof window === 'undefined') return
    
    const item = {
      data,
      expiry: Date.now() + ttl
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Cache storage failed:', error)
    }
  }
  
  static get(key: string) {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const parsed = JSON.parse(item)
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      localStorage.removeItem(key)
      return null
    }
  }
  
  static clear() {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

export default SimpleCache