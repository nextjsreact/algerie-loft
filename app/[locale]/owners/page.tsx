import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import type { LoftOwner } from "@/lib/types"
import { OwnersWrapper } from "@/components/owners/owners-wrapper"

export default async function OwnersPage() {
  const session = await requireRole(["admin"])
  const supabase = await createClient()

  const { data: ownersData, error } = await supabase
    .from("loft_owners")
    .select(
      `
      *,
      lofts (
        id,
        price_per_month
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const owners = ownersData.map((owner) => {
    const lofts = owner.lofts as unknown as { price_per_month: number }[]
    const loft_count = lofts.length
    const total_monthly_value = lofts.reduce(
      (acc, loft) => acc + loft.price_per_month,
      0
    )
    return {
      ...owner,
      loft_count: String(loft_count),
      total_monthly_value: String(total_monthly_value),
    }
  }) as (LoftOwner & { loft_count: string; total_monthly_value: string })[]

  return (
    <OwnersWrapper owners={owners} />
  )
}
