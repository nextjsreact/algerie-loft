import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'executive', 'manager'])
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient(true) // Use service role

    // Get all owners with their user_id links
    const { data: owners, error: ownersError } = await supabase
      .from('owners')
      .select('id, name, business_name, user_id, email, phone')
      .order('name')

    if (ownersError) {
      console.error('Error fetching owners:', ownersError)
      return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 })
    }

    // Get all lofts
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, owner_id')
      .order('name')

    if (loftsError) {
      console.error('Error fetching lofts:', loftsError)
      return NextResponse.json({ error: 'Failed to fetch lofts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        owners: {
          count: owners?.length || 0,
          data: owners || []
        },
        lofts: {
          count: lofts?.length || 0,
          data: lofts || []
        }
      }
    })

  } catch (error) {
    console.error('Error in debug database:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}