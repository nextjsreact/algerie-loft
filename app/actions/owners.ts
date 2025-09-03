"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server' // Import the new createClient

type LoftOwner = Database['public']['Tables']['loft_owners']['Row']

export async function getOwners(): Promise<LoftOwner[]> {
  const supabase = await createClient() // Create client here
  const { data: owners, error } = await supabase
    .from("loft_owners")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching owners:", error)
    return []
  }

  return owners
}

export async function updateOwner(id: string, formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const data = Object.fromEntries(formData)
  console.log("updateOwner data:", data)
  const ownership_type = data.ownership_type?.toString().trim()
  
  const { error } = await supabase
    .from("loft_owners")
    .update({
      name: data.name.toString().trim(),
      email: data.email?.toString().trim() || null,
      phone: data.phone?.toString().trim() || null,
      address: data.address?.toString().trim() || null,
      ownership_type: ownership_type as LoftOwner['ownership_type']
    })
    .eq("id", id)

  if (error) {
    console.error("Failed to update owner:", error)
    return { error: error instanceof Error ? error.message : "Failed to update owner" }
  }

  return { success: true }
}

export async function deleteOwner(id: string) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("loft_owners").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete owner:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete owner" }
  }

  redirect("/owners")
}

export async function createOwner(formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const data = Object.fromEntries(formData)
  console.log("createOwner data:", data)
  const name = data.name?.toString().trim()
  const ownership_type = data.ownership_type?.toString().trim()
  
  if (!name) {
    return { error: "Name is required" }
  }

  const { data: newOwner, error } = await supabase
    .from("loft_owners")
    .insert({
      name,
      email: data.email?.toString().trim() || null,
      phone: data.phone?.toString().trim() || null,
      address: data.address?.toString().trim() || null,
      ownership_type: ownership_type as LoftOwner['ownership_type']
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create owner:", error)
    return { error: error instanceof Error ? error.message : "Failed to create owner" }
  }

  return { success: true, owner: newOwner }
}
