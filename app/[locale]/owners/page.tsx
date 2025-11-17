import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import type { LoftOwner } from "@/lib/types"
import { OwnersWrapper } from "@/components/owners/owners-wrapper"

export default async function OwnersPage() {
  const session = await requireRole(["admin"])
  const supabase = await createClient()

  // Utiliser partner_profiles au lieu de loft_owners
  const { data: ownersData, error } = await supabase
    .from("partner_profiles")
    .select(
      `
      *,
      lofts:lofts!partner_id (
        id,
        price_per_night
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching partners:", error)
    // Si la table n'existe pas ou est vide, retourner un tableau vide
    return <OwnersWrapper owners={[]} />
  }

  const owners = (ownersData || []).map((owner) => {
    const lofts = (owner.lofts || []) as unknown as { price_per_night: number }[]
    const loft_count = lofts.length
    const total_monthly_value = lofts.reduce(
      (acc, loft) => acc + (loft.price_per_night || 0),
      0
    )
    
    // Adapter les champs de partner_profiles au format attendu par OwnersWrapper
    return {
      id: owner.id,
      name: owner.business_name || owner.full_name || 'N/A',
      email: owner.email || '',
      phone: owner.phone || '',
      address: owner.address || '',
      ownership_type: owner.business_name ? 'company' : 'third_party',
      created_at: owner.created_at,
      loft_count: String(loft_count),
      total_monthly_value: String(total_monthly_value),
    }
  }) as (LoftOwner & { loft_count: string; total_monthly_value: string })[]

  return (
    <OwnersWrapper owners={owners} />
  )
}
