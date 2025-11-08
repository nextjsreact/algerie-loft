import { NextRequest, NextResponse } from 'next/server'
import { getOptimizedLofts, withPerformanceOptimization } from '@/lib/api/optimized-api'

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Extraire les paramètres de requête
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 par page
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  try {
    const result = await getOptimizedLofts({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    })

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        page,
        limit,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        totalPages: Math.ceil(result.totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error in optimized lofts API:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch lofts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Appliquer le middleware de performance
export const GET = withPerformanceOptimization(handler)