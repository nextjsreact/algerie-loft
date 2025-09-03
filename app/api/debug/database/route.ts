import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check lofts
    const { data: lofts, error: loftsError, count: loftsCount } = await supabase
      .from("lofts")
      .select("*", { count: 'exact' })

    // Check owners
    const { data: owners, error: ownersError, count: ownersCount } = await supabase
      .from("loft_owners")
      .select("*", { count: 'exact' })

    // Check zone areas
    const { data: zoneAreas, error: zoneAreasError, count: zoneAreasCount } = await supabase
      .from("zone_areas")
      .select("*", { count: 'exact' })

    return NextResponse.json({
      success: true,
      data: {
        lofts: {
          count: loftsCount,
          data: lofts,
          error: loftsError
        },
        owners: {
          count: ownersCount,
          data: owners,
          error: ownersError
        },
        zoneAreas: {
          count: zoneAreasCount,
          data: zoneAreas,
          error: zoneAreasError
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}