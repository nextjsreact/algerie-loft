import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import type { LoftOwner } from "@/lib/types"
import { OwnersWrapper } from "@/components/owners/owners-wrapper"

export default async function OwnersPage() {
  const session = await requireRole(["admin"])
  const supabase = await createClient()

  // Utiliser la table unifiée owners
  const { data: ownersData, error } = await supabase
    .from("owners")
    .select("*")
    .order("created_at", { ascending: false })
  
  // Récupérer tous les lofts pour compter
  const { data: allLofts } = await supabase
    .from("lofts")
    .select("id, new_owner_id, price_per_night")

  if (error) {
    console.error("Error fetching owners:", error.message, error.details, error.hint)
    // Si la table n'existe pas ou est vide, retourner un tableau vide
    return <OwnersWrapper owners={[]} />
  }

  const owners = (ownersData || []).map((owner: any) => {
    // Compter les lofts associés à ce propriétaire
    const ownerLofts = (allLofts || []).filter((loft: any) => loft.new_owner_id === owner.id)
    const loft_count = ownerLofts.length
    const total_monthly_value = ownerLofts.reduce((sum: number, loft: any) => {
      return sum + (loft.price_per_night || 0) * 30
    }, 0)
    
    // Les champs sont maintenant directement compatibles
    return {
      id: owner.id,
      name: owner.name || owner.business_name || 'N/A',
      email: owner.email || '',
      phone: owner.phone || '',
      address: owner.address || '',
      ownership_type: owner.ownership_type || owner.business_type || 'third_party',
      created_at: owner.created_at,
      loft_count: String(loft_count),
      total_monthly_value: String(total_monthly_value),
      user_id: owner.user_id, // Ajouter user_id pour identifier les partners
    }
  }) as (LoftOwner & { loft_count: string; total_monthly_value: string; user_id?: string })[]

  return (
    <OwnersWrapper owners={owners} />
  )
}
