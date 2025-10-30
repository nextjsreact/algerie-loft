import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Test basic connection
    const { data: allLofts, error: allError } = await supabase
      .from('lofts')
      .select('id, name, status, is_published, price_per_night')
      .limit(10)

    if (allError) {
      return NextResponse.json({
        error: 'Database error',
        details: allError.message
      }, { status: 500 })
    }

    // Test available lofts
    const { data: availableLofts, error: availableError } = await supabase
      .from('lofts')
      .select('id, name, status, is_published, price_per_night')
      .eq('status', 'available')
      .limit(10)

    // Test published lofts
    const { data: publishedLofts, error: publishedError } = await supabase
      .from('lofts')
      .select('id, name, status, is_published, price_per_night')
      .eq('is_published', true)
      .limit(10)

    return NextResponse.json({
      total_lofts: allLofts?.length || 0,
      all_lofts: allLofts || [],
      available_lofts: availableLofts || [],
      published_lofts: publishedLofts || [],
      available_error: availableError?.message,
      published_error: publishedError?.message
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}