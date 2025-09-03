"use server"

import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server' // Import the new createClient

type Currency = Database['public']['Tables']['currencies']['Row']

export async function getCurrencies(): Promise<Currency[]> {
  const supabase = await createClient() // Create client here
  const { data: currencies, error } = await supabase
    .from("currencies")
    .select("*")

  if (error) {
    console.error("Error getting currencies:", error)
    throw error
  }

  return currencies
}

export async function setDefaultCurrency(id: string) {
  const supabase = await createClient() // Create client here
  const { error: error1 } = await supabase
    .from("currencies")
    .update({ is_default: false })
    .eq("is_default", true)
  
  if (error1) {
    console.error("Error unsetting default currency:", error1)
    throw error1
  }

  const { error: error2 } = await supabase
    .from("currencies")
    .update({ is_default: true })
    .eq("id", id)

  if (error2) {
    console.error("Error setting default currency:", error2)
    throw error2
  }

  revalidatePath("/settings/currencies")
}

export async function createCurrency(data: Omit<Currency, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient() // Create client here

  // Check if a currency with the same code already exists
  const { data: existingCurrency, error: fetchError } = await supabase
    .from("currencies")
    .select("id")
    .eq("code", data.code)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error checking for existing currency:", fetchError)
    throw fetchError
  }

  if (existingCurrency) {
    throw new Error("A currency with this code already exists.")
  }

  const { error } = await supabase.from("currencies").insert(data)

  if (error) {
    console.error("Error creating currency:", error)
    throw error
  }

  revalidatePath("/settings/currencies")
}

export async function updateCurrency(id: string, data: Omit<Currency, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient() // Create client here
  const { error } = await supabase
    .from("currencies")
    .update(data)
    .eq("id", id)

  if (error) {
    console.error("Error updating currency:", error)
    throw error
  }

  revalidatePath("/settings/currencies")
}

export async function deleteCurrency(id: string) {
  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("currencies").delete().eq("id", id)

  if (error) {
    console.error("Error deleting currency:", error)
    throw error
  }

  revalidatePath("/settings/currencies")
}
