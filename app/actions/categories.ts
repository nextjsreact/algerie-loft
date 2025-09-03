"use server"

import { requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server' // Import the new createClient

type Category = Database['public']['Tables']['categories']['Row']

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient() // Create client here
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error getting categories:", error)
    throw error
  }

  return categories
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient() // Create client here
  const { data: category, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error getting category:", error)
    throw error
  }

  return category
}

export async function createCategory(data: { name: string; description: string | null; type: "income" | "expense" }) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("categories").insert(data)

  if (error) {
    console.error("Error creating category:", error)
    throw error
  }

  revalidatePath("/settings/categories")
}

export async function updateCategory(id: string, data: { name: string; description: string | null; type: "income" | "expense" }) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase
    .from("categories")
    .update(data)
    .eq("id", id)

  if (error) {
    console.error("Error updating category:", error)
    throw error
  }

  revalidatePath("/settings/categories")
}

export async function deleteCategory(id: string) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    console.error("Error deleting category:", error)
    throw error
  }

  revalidatePath("/settings/categories")
}
