"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server' // Import the new createClient

type Team = Database['public']['Tables']['teams']['Row']

export async function createTeam(formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const data = Object.fromEntries(formData)
  const { data: newTeam, error } = await supabase
    .from("teams")
    .insert({
      name: data.name.toString().trim(),
      description: data.description?.toString().trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create team:", error)
    return { error: error instanceof Error ? error.message : "Failed to create team" }
  }

  return { success: true, team: newTeam }
}

export async function updateTeam(id: string, formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const data = Object.fromEntries(formData)
  const { data: updatedTeam, error } = await supabase
    .from("teams")
    .update({
      name: data.name.toString().trim(),
      description: data.description?.toString().trim() || null
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Failed to update team:", error)
    return { error: error instanceof Error ? error.message : "Failed to update team" }
  }

  return { success: true, team: updatedTeam }
}

export async function deleteTeam(id: string) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("teams").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete team:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete team" }
  }

  redirect("/teams")
}

export async function getTeam(id: string) {
  const supabase = await createClient() // Create client here
  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching team:", error)
    return null
  }

  return team
}
