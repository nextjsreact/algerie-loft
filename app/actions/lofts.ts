"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server'
import { unstable_noStore as noStore } from 'next/cache';

type Loft = Database['public']['Tables']['lofts']['Row']

export async function getLofts() {
  const supabase = await createClient() // Create client here
  const { data: lofts, error } = await supabase
    .from("lofts")
    .select("id, name")
    .order("name")

  if (error) {
    console.error("Error getting lofts:", error)
    throw error
  }

  return lofts
}

export async function deleteLoft(id: string) {
  const session = await requireRole(["admin"])

  const supabase = await createClient()
  
  try {
    // Récupérer les informations du loft avant suppression
    const { data: loftToDelete, error: fetchError } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching loft for deletion:", fetchError)
      throw new Error("Loft non trouvé")
    }

    if (!loftToDelete) {
      throw new Error("Loft non trouvé")
    }

    // Vérifier s'il y a des dépendances
    const { data: relatedTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("loft_id", id)
      .limit(1)

    const { data: relatedTransactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("loft_id", id)
      .limit(1)

    if (relatedTasks?.length || relatedTransactions?.length) {
      const dependencies = []
      if (relatedTasks?.length) dependencies.push("tâches")
      if (relatedTransactions?.length) dependencies.push("transactions")
      
      throw new Error(`Impossible de supprimer ce loft car il est lié à des ${dependencies.join(", ")}. Veuillez d'abord supprimer ou modifier ces éléments.`)
    }

    // Supprimer les photos associées
    await supabase
      .from("loft_photos")
      .delete()
      .eq("loft_id", id)

    // Supprimer les disponibilités associées
    await supabase
      .from("loft_availability")
      .delete()
      .eq("loft_id", id)

    // Supprimer le loft
    const { error: deleteError } = await supabase
      .from("lofts")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting loft:", deleteError)
      throw new Error(`Erreur lors de la suppression: ${deleteError.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteLoft:", error)
    throw error
  }
}export async function getLoft(id: string): Promise<Loft | null> {
  noStore();
  const supabase = await createClient() // Create client here
  const { data: loft, error } = await supabase
    .from("lofts")
    .select("*, owner:owners(name)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching loft:", error)
    return null
  }

  return loft as unknown as Loft
}

export async function updateLoft(id: string, data: Omit<Loft, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; error?: string }> {
  console.log('=== updateLoft SERVER ACTION ===')
  console.log('ID:', id)
  console.log('Data received:', data)
  
  try {
    await requireRole(["admin", "manager"])
    console.log('Role check passed')

    // Clean up empty strings to prevent UUID errors
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        // Convert empty strings to null for UUID fields and other nullable fields
        value === "" ? null : value
      ])
    )

    // Remove fields that don't exist in the database
    const { partner_id, ...validData } = cleanedData as any

    // Only keep fields that exist in the lofts table
    const allowedFields = [
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

    const safeData = Object.fromEntries(
      Object.entries(validData).filter(([key]) => allowedFields.includes(key))
    )

    console.log('Cleaned data:', safeData)

    const supabase = await createClient()
    console.log('Supabase client created')
    
    const { data: updateResult, error } = await supabase
      .from("lofts")
      .update(safeData)
      .eq("id", id)
      .select()

    console.log('Update result:', updateResult)
    console.log('Update error:', error)

    if (error) {
      console.error("Error updating loft:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/lofts/${id}/edit`)
    revalidatePath(`/lofts/${id}`)
    revalidatePath('/lofts')
    console.log('Update successful!')
    return { success: true }
  } catch (error) {
    // Re-throw Next.js redirect/notFound errors - they must not be caught
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('=== updateLoft EXCEPTION ===', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

interface CreateLoftResult {
  success: boolean
  loftId: string
}

export async function createLoft(data: Omit<Loft, "id" | "created_at" | "updated_at">): Promise<CreateLoftResult> {
  await requireRole(["admin"])

  // Clean up empty strings to prevent UUID errors
  const cleanedData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      // Convert empty strings to null for UUID fields and other nullable fields
      value === "" ? null : value
    ])
  )

  const supabase = await createClient()
  const { data: newLoft, error } = await supabase
    .from("lofts")
    .insert(cleanedData)
    .select()
    .single()

  if (error) {
    console.error("Error creating loft:", error)
    throw error
  }
    
  return {
    success: true,
    loftId: newLoft.id
  }
}

export async function linkLoftToAirbnb(id: string, formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient()
  const airbnb_listing_id = formData.get("airbnb_listing_id") as string

  const { error } = await supabase
    .from("lofts")
    .update({ airbnb_listing_id })
    .eq("id", id)

  if (error) {
    console.error("Error linking loft to Airbnb:", error)
    throw error
  }

  redirect(`/lofts/${id}`)
}
