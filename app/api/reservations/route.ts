import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loftId = searchParams.get('loft_id')
    const status = searchParams.get('status')
    const includeBlocks = searchParams.get('include_blocks') !== 'false' // default true

    const supabase = await createClient(true)

    // 1. Fetch reservations
    let query = supabase
      .from('reservations')
      .select('*, lofts:loft_id(id, name, address)')
      .order('check_in_date', { ascending: false })

    if (loftId) query = query.eq('loft_id', loftId)
    if (status) query = query.eq('status', status)

    const { data: reservations, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 2. Fetch availability blocks (manual blocks only, not 'booked' which are from reservations)
    let blocks: any[] = []
    if (includeBlocks) {
      let blocksQuery = supabase
        .from('loft_availability')
        .select('loft_id, date, blocked_reason, lofts:loft_id(id, name, address)')
        .eq('is_available', false)
        .neq('blocked_reason', 'booked') // exclude reservation-generated blocks
        .order('date', { ascending: false })

      if (loftId) blocksQuery = blocksQuery.eq('loft_id', loftId)

      const { data: blocksData } = await blocksQuery

      // Group consecutive blocked dates into ranges per loft+reason
      if (blocksData && blocksData.length > 0) {
        const grouped = new Map<string, { loft_id: string; loft: any; reason: string; dates: string[] }>()
        blocksData.forEach((b: any) => {
          const key = `${b.loft_id}-${b.blocked_reason}`
          if (!grouped.has(key)) {
            grouped.set(key, { loft_id: b.loft_id, loft: b.lofts, reason: b.blocked_reason, dates: [] })
          }
          grouped.get(key)!.dates.push(b.date)
        })

        grouped.forEach(g => {
          const sorted = g.dates.sort()
          // Split into consecutive ranges
          let rangeStart = sorted[0]
          let rangeEnd = sorted[0]
          for (let i = 1; i <= sorted.length; i++) {
            const curr = sorted[i]
            const prev = sorted[i - 1]
            const isConsecutive = curr && new Date(curr).getTime() - new Date(prev).getTime() === 86400000
            if (isConsecutive) {
              rangeEnd = curr
            } else {
              blocks.push({
                id: `block-${g.loft_id}-${rangeStart}`,
                loft_id: g.loft_id,
                lofts: g.loft,
                guest_name: null,
                check_in_date: rangeStart,
                check_out_date: rangeEnd,
                status: 'blocked',
                blocked_reason: g.reason,
                total_amount: 0,
                _is_block: true,
              })
              rangeStart = curr
              rangeEnd = curr
            }
          }
        })
      }
    }

    // 3. Merge and sort by check_in_date desc
    const all = [...(reservations || []), ...blocks]
      .sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime())

    return NextResponse.json({ success: true, reservations: all })
  } catch (error) {
    console.error('[API reservations GET] unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
