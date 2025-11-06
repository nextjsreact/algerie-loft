'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

// Cache pour les traductions chargées
const translationCache = new Map()

export function useLazyTranslations(namespace?: string) {
  const locale = useLocale()
  const [translations, setTranslations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadTranslations = async () => {
      const cacheKey = `${locale}-${namespace || 'main'}`
      
      // Vérifier le cache d'abord
      if (translationCache.has(cacheKey)) {
        setTranslations(translationCache.get(cacheKey))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Charger les traductions optimisées
        const response = await fetch(`/api/translations/${locale}${namespace ? `/${namespace}` : ''}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Mettre en cache
        translationCache.set(cacheKey, data)
        setTranslations(data)
        
      } catch (err) {
        console.error('Translation loading error:', err)
        setError(err.message)
        
        // Fallback vers les traductions par défaut
        try {
          const fallback = await import(`@/messages/${locale}-optimized.json`)
          setTranslations(fallback.default)
          translationCache.set(cacheKey, fallback.default)
        } catch (fallbackErr) {
          console.error('Fallback translation loading failed:', fallbackErr)
        }
        
      } finally {
        setLoading(false)
      }
    }

    loadTranslations()
  }, [locale, namespace])

  return { translations, loading, error }
}

// Hook pour précharger les traductions
export function usePreloadTranslations() {
  const preload = async (locale: string, namespace?: string) => {
    const cacheKey = `${locale}-${namespace || 'main'}`
    
    if (!translationCache.has(cacheKey)) {
      try {
        const response = await fetch(`/api/translations/${locale}${namespace ? `/${namespace}` : ''}`)
        if (response.ok) {
          const data = await response.json()
          translationCache.set(cacheKey, data)
        }
      } catch (error) {
        console.warn('Preload failed:', error)
      }
    }
  }

  return { preload }
}
