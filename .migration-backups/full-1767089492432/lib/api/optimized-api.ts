/**
 * API optimisée avec cache et performance améliorée
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { unstable_cache } from 'next/cache'

// Types
interface CacheOptions {
  revalidate?: number
  tags?: string[]
}

interface QueryOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Cache wrapper pour les requêtes Supabase
export const createCachedSupabaseQuery = <T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options: CacheOptions = {}
) => {
  const { revalidate = 300, tags = [] } = options // 5 minutes par défaut
  
  return unstable_cache(
    async () => {
      console.log(`🔄 Cache miss for ${cacheKey}`)
      const startTime = Date.now()
      
      try {
        const result = await queryFn()
        const duration = Date.now() - startTime
        console.log(`✅ Query ${cacheKey} completed in ${duration}ms`)
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`❌ Query ${cacheKey} failed after ${duration}ms:`, error)
        throw error
      }
    },
    [cacheKey],
    {
      revalidate,
      tags: [cacheKey, ...tags]
    }
  )
}

// Fonction optimisée pour récupérer les lofts
export async function getOptimizedLofts(options: QueryOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options

  const cacheKey = `lofts:${page}:${limit}:${search}:${status}:${sortBy}:${sortOrder}`
  
  const cachedQuery = createCachedSupabaseQuery(
    async () => {
      const supabase = createClient()
      
      // Construction de la requête optimisée
      let query = supabase
        .from('lofts')
        .select(`
          id,
          name,
          address,
          price_per_night,
          status,
          max_guests,
          average_rating,
          created_at,
          updated_at,
          photos:loft_photos(
            url,
            alt_text
          )
        `)

      // Filtres
      if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      // Tri
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: lofts, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Optimiser les photos (prendre seulement la première)
      const optimizedLofts = lofts?.map(loft => ({
        ...loft,
        photos: loft.photos?.slice(0, 1) || [] // Seulement la première photo pour la liste
      })) || []

      return {
        lofts: optimizedLofts,
        totalCount: count || 0,
        hasMore: (count || 0) > page * limit,
        page,
        limit
      }
    },
    cacheKey,
    {
      revalidate: 300, // 5 minutes
      tags: ['lofts', 'lofts-list']
    }
  )

  return cachedQuery()
}

// Fonction optimisée pour récupérer un loft spécifique
export async function getOptimizedLoft(loftId: string) {
  const cacheKey = `loft:${loftId}`
  
  const cachedQuery = createCachedSupabaseQuery(
    async () => {
      const supabase = createClient()
      
      const { data: loft, error } = await supabase
        .from('lofts')
        .select(`
          *,
          photos:loft_photos(*),
          owner:owners(*),
          zone:zone_areas(*)
        `)
        .eq('id', loftId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Loft non trouvé
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return loft
    },
    cacheKey,
    {
      revalidate: 600, // 10 minutes pour un loft spécifique
      tags: ['lofts', `loft:${loftId}`]
    }
  )

  return cachedQuery()
}

// Middleware pour optimiser les réponses API
export function withPerformanceOptimization(handler: Function) {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    const url = new URL(request.url)
    
    // Headers de performance
    const headers = new Headers()
    headers.set('X-Response-Time', '0') // Sera mis à jour
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')

    try {
      // Exécuter le handler
      const response = await handler(request)
      
      // Calculer le temps de réponse
      const duration = Date.now() - startTime
      
      // Ajouter les headers de performance
      if (response instanceof NextResponse) {
        response.headers.set('X-Response-Time', `${duration}ms`)
        response.headers.set('X-Cache-Status', 'MISS') // Sera MISS par défaut
        
        // Headers de cache selon le type de requête
        if (request.method === 'GET') {
          if (url.pathname.includes('/lofts/')) {
            response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
          } else {
            response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
          }
        }
      }

      // Log des performances
      console.log(`📊 API ${request.method} ${url.pathname} - ${duration}ms`)
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow API response: ${url.pathname} took ${duration}ms`)
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ API Error ${url.pathname} after ${duration}ms:`, error)
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'X-Response-Time': `${duration}ms`,
            'Cache-Control': 'no-cache'
          }
        }
      )
    }
  }
}

// Utilitaire pour invalider le cache
export async function invalidateCache(tags: string[]) {
  try {
    // Next.js revalidateTag pour invalider le cache
    const { revalidateTag } = await import('next/cache')
    
    for (const tag of tags) {
      revalidateTag(tag)
      console.log(`🗑️ Cache invalidated for tag: ${tag}`)
    }
  } catch (error) {
    console.error('Error invalidating cache:', error)
  }
}

// Fonction pour précharger les données critiques
export async function preloadCriticalData() {
  try {
    console.log('🚀 Preloading critical data...')
    
    // Précharger les lofts les plus populaires
    await getOptimizedLofts({ 
      limit: 10, 
      sortBy: 'average_rating',
      sortOrder: 'desc'
    })
    
    console.log('✅ Critical data preloaded')
  } catch (error) {
    console.error('❌ Error preloading critical data:', error)
  }
}

// Export des utilitaires
export {
  type QueryOptions,
  type CacheOptions
}