import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loftId = params.id
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
      .from('loft_reviews')
      .select(`
        id,
        rating,
        review_text,
        created_at,
        is_published,
        response_text,
        response_date
      `)
      .eq('loft_id', loftId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Reviews fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reviews: reviews || []
    })

  } catch (error) {
    console.error('Reviews API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}