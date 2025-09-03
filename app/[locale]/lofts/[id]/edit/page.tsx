import { getOwners } from "@/app/actions/owners"
import { getZoneAreas } from "@/app/actions/zone-areas"
import { getInternetConnectionTypes } from "@/app/actions/internet-connections"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { EditLoftWrapper } from "@/components/lofts/edit-loft-wrapper"

export default async function EditLoftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: loft, error } = await supabase
    .from("lofts")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !loft) {
    notFound()
  }

  const owners = await getOwners()
  const zoneAreas = await getZoneAreas()
  const { data: internetConnectionTypesData, error: internetConnectionTypesError } = await getInternetConnectionTypes()
  
  const internetConnectionTypes = internetConnectionTypesData || []

  return (
    <EditLoftWrapper
      loft={loft}
      owners={owners}
      zoneAreas={zoneAreas}
      internetConnectionTypes={internetConnectionTypes}
    />
  )
}
