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
    .select("id, owner_id, price_per_night, price_per_month")

  console.log('=== DEBUG OWNERS PAGE ===')
  console.log('Total owners:', ownersData?.length || 0)
  console.log('Total lofts:', allLofts?.length || 0)
  console.log('Sample loft:', allLofts?.[0])
  console.log('Sample owner:', ownersData?.[0])

  if (error) {
    console.error("Error fetching owners:", error.message, error.details, error.hint)
    // Si la table n'existe pas ou est vide, retourner un tableau vide
    return <OwnersWrapper owners={[]} />
  }

  const owners = (ownersData || []).map((owner: any) => {
    // Compter les lofts associés à ce propriétaire via owner_id
    const ownerLofts = (allLofts || []).filter((loft: any) => 
      loft.owner_id === owner.id
    )
    const loft_count = ownerLofts.length
    
    // Calculer la valeur mensuelle totale en utilisant price_per_month ou price_per_night * 30
    const total_monthly_value = ownerLofts.reduce((sum: number, loft: any) => {
      const monthlyPrice = loft.price_per_month || (loft.price_per_night ? loft.price_per_night * 30 : 0)
      return sum + (monthlyPrice || 0)
    }, 0)
    
    // Log pour le premier owner pour debug
    if (owner.id === ownersData[0]?.id) {
      console.log('First owner debug:', {
        owner_id: owner.id,
        owner_name: owner.name,
        matching_lofts: ownerLofts.length,
        sample_loft_ids: ownerLofts.slice(0, 3).map(l => ({ 
          id: l.id, 
          owner_id: l.owner_id
        }))
      })
    }
    
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
