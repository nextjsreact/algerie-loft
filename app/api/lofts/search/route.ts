import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SearchFilters, ClientLoftView } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: SearchFilters = {
      check_in: searchParams.get('check_in') || undefined,
      check_out: searchParams.get('check_out') || undefined,
      location: searchParams.get('location') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : 1,
      amenities: searchParams.get('amenities')?.split(',') || []
    }

    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 12
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Use the search function from the database
    const { data: lofts, error } = await supabase.rpc('search_available_lofts', {
      p_check_in: filters.check_in || null,
      p_check_out: filters.check_out || null,
      p_location: filters.location || null,
      p_min_price: filters.min_price || null,
      p_max_price: filters.max_price || null,
      p_guests: filters.guests || 1
    })

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Failed to search lofts' },
        { status: 500 }
      )
    }

    // Get partner information for each loft
    const loftIds = lofts?.map((loft: any) => loft.id) || []
    
    const { data: partnersData, error: partnersError } = await supabase
      .from('lofts')
      .select(`
        id,
        owner_id,
        profiles!lofts_owner_id_fkey (
          id,
          full_name
        ),
        partner_profiles!inner (
          business_name
        )
      `)
      .in('id', loftIds)

    if (partnersError) {
      console.error('Partners fetch error:', partnersError)
    }

    // Transform data to ClientLoftView format
    const clientLofts: ClientLoftView[] = (lofts || []).map((loft: any) => {
      const partnerInfo = partnersData?.find(p => p.id === loft.id)
      
      return {
        id: loft.id,
        name: loft.name,
        address: loft.address,
        description: loft.description,
        price_per_night: loft.price_per_night,
        status: loft.status,
        images: [], // TODO: Add image handling
        amenities: [], // TODO: Add amenities handling
        average_rating: Number(loft.average_rating) || 0,
        review_count: Number(loft.review_count) || 0,
        partner: {
          id: partnerInfo?.owner_id || '',
          name: partnerInfo?.profiles?.full_name || 'Propriétaire',
          business_name: partnerInfo?.partner_profiles?.business_name
        }
      }
    })

    // Apply pagination
    const paginatedLofts = clientLofts.slice(offset, offset + limit)
    const totalCount = clientLofts.length

    return NextResponse.json({
      lofts: paginatedLofts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}