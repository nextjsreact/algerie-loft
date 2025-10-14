"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server' // Import the new createClient
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
    // Récupérer les informations du loft avant suppression pour l'audit
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

    // Vérifier s'il y a des dépendances qui pourraient empêcher la suppression
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

    // Si il y a des dépendances, informer l'utilisateur
    if (relatedTasks?.length || relatedTransactions?.length) {
      const dependencies = []
      if (relatedTasks?.length) dependencies.push("tâches")
      if (relatedTransactions?.length) dependencies.push("transactions")
      
      throw new Error(`Impossible de supprimer ce loft car il est lié à des ${dependencies.join(", ")}. Veuillez d'abord supprimer ou modifier ces éléments.`)
    }

    // Supprimer d'abord les photos associées (si elles existent)
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

    // Créer un log d'audit pour la suppression
    try {
      await supabase.from("audit_logs").insert({
        table_name: "lofts",
        record_id: id,
        action: "DELETE",
        old_values: loftToDelete,
        new_values: null,
        user_id: session.user.id,
        user_email: session.user.email,
        timestamp: new Date().toISOString()
      })
    } catch (auditError) {
      console.error("Error creating audit log:", auditError)
      // Ne pas faire échouer la suppression si l'audit échoue
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteLoft:", error)
    throw error
  }
}

export async function getLoft(id: string): Promise<Loft | null> {
  noStore();
  const supabase = await createClient() // Create client here
  const { data: loft, error } = await supabase
    .from("lofts")
    .select("*, owner:loft_owners(name)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching loft:", error)
    return null
  }

  return loft as unknown as Loft
}

export async function updateLoft(id: string, data: Omit<Loft, "id" | "created_at" | "updated_at">): Promise<{ success: boolean }> {
  await requireRole(["admin", "manager"])

  // Clean up empty strings to prevent UUID errors
  const cleanedData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      // Convert empty strings to null for UUID fields and other nullable fields
      value === "" ? null : value
    ])
  )

  const supabase = await createClient() // Create client here
  const { error } = await supabase
    .from("lofts")
    .update(cleanedData)
    .eq("id", id)

  if (error) {
    console.error("Error updating loft:", error)
    return { success: false }
  }

  return { success: true }
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

  const supabase = await createClient() // Create client here
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
