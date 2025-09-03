"use server"

import { createClient } from '@/utils/supabase/server'
import type { Database } from "@/lib/types"

type LoftOwner = Database['public']['Tables']['loft_owners']['Row']

export async function getOwnersForFilter(): Promise<{ value: string; label: string }[]> {
  const supabase = await createClient()
  
  const { data: owners, error } = await supabase
    .from("loft_owners")
    .select("id, name")
    .order("name")

  if (error) {
    console.error("Error fetching owners for filter:", error)
    return []
  }

  return owners.map(owner => ({
    value: owner.id,
    label: owner.name
  }))
}

export async function getLoftsWithAvailability() {
  const supabase = await createClient()
  
  const { data: lofts, error } = await supabase
    .from("lofts")
    .select(`
      id,
      name,
      address,
      price_per_day,
      status,
      zone_area_id,
      owner_id,
      loft_owners!inner(
        id,
        name
      ),
      zone_areas(
        name
      )
    `)
    .order("name")

  if (error) {
    console.error("Error fetching lofts:", error)
    return []
  }

  return lofts.map(loft => ({
    id: loft.id,
    name: loft.name,
    region: loft.zone_areas?.name || 'Unknown',
    owner: loft.loft_owners.name,
    ownerId: loft.owner_id,
    capacity: 4, // Default capacity, you might want to add this field to your lofts table
    pricePerNight: loft.price_per_day,
    status: loft.status,
    amenities: ['wifi', 'kitchen'], // Default amenities, you might want to add this field
    availability: {} // You'll need to implement availability logic
  }))
}