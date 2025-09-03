import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch lofts with their related data
    const { data: loftsData, error: loftsError } = await supabase
      .from("lofts")
      .select(`
        id,
        name,
        address,
        description,
        price_per_month,
        status,
        owner_id,
        zone_area_id,
        company_percentage
      `)
      .order("created_at", { ascending: false })

    if (loftsError) {
      console.error("Error fetching lofts:", loftsError)
      return NextResponse.json({ error: "Failed to fetch lofts" }, { status: 500 })
    }

    // Fetch owners
    const { data: ownersData, error: ownersError } = await supabase
      .from("loft_owners")
      .select("id, name")
      .order("name")

    // Fetch zone areas
    const { data: zoneAreasData, error: zoneAreasError } = await supabase
      .from("zone_areas")
      .select("id, name")
      .order("name")

    if (ownersError || zoneAreasError) {
      console.error("Error fetching related data:", { ownersError, zoneAreasError })
    }

    // Create maps for quick lookup
    const ownersMap = new Map((ownersData || []).map(owner => [owner.id, owner.name]))
    const zonesMap = new Map((zoneAreasData || []).map(zone => [zone.id, zone.name]))

    // Transform data for availability component
    const transformedLofts = (loftsData || []).map(loft => ({
      id: loft.id,
      name: loft.name,
      region: zonesMap.get(loft.zone_area_id) || 'availability:unknown',
      owner: ownersMap.get(loft.owner_id) || 'availability:unknown',
      pricePerNight: Math.round((loft.price_per_month || 0) / 30), // Estimate daily rate
      capacity: 4, // Default capacity - you might want to add this field to your lofts table
      status: loft.status,
      image: '/images/loft-placeholder.jpg',
      amenities: ['wifi', 'parking', 'kitchen'], // Default amenities - you might want to add this field
      availability: {
        // You can expand this based on your reservation system
        [new Date().toISOString().split('T')[0]]: loft.status
      },
      address: loft.address,
      description: loft.description,
      monthlyPrice: loft.price_per_month,
      companyPercentage: loft.company_percentage,
      // Include IDs for filtering
      owner_id: loft.owner_id,
      zone_area_id: loft.zone_area_id
    }))

    // Prepare filter options from real data
    const regions = [
      { value: 'all', label: 'availability:allRegions' }, // Use translation key
      ...(zoneAreasData || []).map(zone => ({
        value: zone.id,
        label: zone.name
      }))
    ]

    const owners = [
      { value: 'all', label: 'availability:allOwners' }, // Use translation key
      ...(ownersData || []).map(owner => ({
        value: owner.id,
        label: owner.name
      }))
    ]

    return NextResponse.json({
      lofts: transformedLofts,
      filterOptions: {
        regions,
        owners,
        zoneAreas: zoneAreasData || [],
        ownersData: ownersData || []
      }
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}