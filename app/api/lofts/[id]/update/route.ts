import { NextRequest, NextResponse } from "next/server"
import { requireAuthAPI } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

const ALLOWED_FIELDS = [
  'name', 'description', 'address', 'status', 'company_percentage', 'owner_percentage',
  'zone_area_id', 'airbnb_listing_id', 'internet_connection_type_id',
  'water_customer_code', 'water_contract_code', 'water_meter_number', 'water_correspondent',
  'electricity_pdl_ref', 'electricity_customer_number', 'electricity_meter_number', 'electricity_correspondent',
  'gas_pdl_ref', 'gas_customer_number', 'gas_meter_number', 'gas_correspondent',
  'phone_number',
  'frequence_paiement_eau', 'prochaine_echeance_eau',
  'frequence_paiement_energie', 'prochaine_echeance_energie',
  'frequence_paiement_telephone', 'prochaine_echeance_telephone',
  'frequence_paiement_internet', 'prochaine_echeance_internet',
  'frequence_paiement_tv', 'prochaine_echeance_tv',
  'price_per_night', 'max_guests', 'bedrooms', 'bathrooms', 'area_sqm',
  'amenities', 'is_published', 'maintenance_notes', 'availability_notes',
  'minimum_stay', 'maximum_stay', 'check_in_time', 'check_out_time',
  'cleaning_fee', 'tax_rate', 'cancellation_policy', 'house_rules',
  'wifi_password', 'owner_id'
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Nettoyer les champs vides et filtrer les champs autorisés
    const safeData = Object.fromEntries(
      Object.entries(body)
        .filter(([key]) => ALLOWED_FIELDS.includes(key))
        .map(([key, value]) => [key, value === "" ? null : value])
    )

    const supabase = await createClient()
    const { error } = await supabase
      .from("lofts")
      .update(safeData)
      .eq("id", id)

    if (error) {
      console.error("Error updating loft:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/lofts/[id]/update:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
