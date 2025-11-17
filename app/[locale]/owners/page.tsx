import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import type { LoftOwner } from "@/lib/types"
import { OwnersWrapper } from "@/components/owners/owners-wrapper"

export default async function OwnersPage() {
  const session = await requireRole(["admin"])
  const supabase = await createClient()

  // Utiliser partner_profiles au lieu de loft_owners
  // Simplifié sans la relation lofts pour l'instant
  const { data: ownersData, error } = await supabase
    .from("partner_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching partners:", error.message, error.details, error.hint)
    // Si la table n'existe pas ou est vide, retourner un tableau vide
    return <OwnersWrapper owners={[]} />
  }

  const owners = (ownersData || []).map((owner) => {
    // Pour l'instant, pas de lofts associés
    const loft_count = 0
    const total_monthly_value = 0
    
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
