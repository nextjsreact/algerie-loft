"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server'

type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient()
  const { data: paymentMethods, error } = await supabase
    .from("payment_methods")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching payment methods:", error)
    return []
  }

  return paymentMethods
}

export async function createPaymentMethod(formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient()
  const data = Object.fromEntries(formData)
  const name = data.name?.toString().trim()
  const type = data.type?.toString().trim()
  const details = data.details?.toString().trim()
  
  if (!name) {
    return { error: "Name is required" }
  }

  // Fonction pour parser les détails de manière sécurisée
  const parseDetails = (detailsString: string) => {
    if (!detailsString) return null
    
    try {
      // Essayer de parser comme JSON
      return JSON.parse(detailsString)
    } catch {
      // Si ce n'est pas du JSON valide, retourner comme chaîne
      return detailsString
    }
  }

  const { data: newPaymentMethod, error } = await supabase
    .from("payment_methods")
    .insert({
      name,
      type,
      details: parseDetails(details || ''),
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create payment method:", error)
    return { error: error instanceof Error ? error.message : "Failed to create payment method" }
  }

  return { success: true, paymentMethod: newPaymentMethod }
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  await requireRole(["admin"])

  const supabase = await createClient()
  const data = Object.fromEntries(formData)
  const name = data.name?.toString().trim()
  const type = data.type?.toString().trim()
  const details = data.details?.toString().trim()

  if (!name) {
    return { error: "Name is required" }
  }

  // Fonction pour parser les détails de manière sécurisée
  const parseDetails = (detailsString: string) => {
    if (!detailsString) return null
    
    try {
      // Essayer de parser comme JSON
      return JSON.parse(detailsString)
    } catch {
      // Si ce n'est pas du JSON valide, retourner comme chaîne
      return detailsString
    }
  }

  const { error } = await supabase
    .from("payment_methods")
    .update({
      name,
      type,
      details: parseDetails(details || ''),
    })
    .eq("id", id)

  if (error) {
    console.error("Failed to update payment method:", error)
    return { error: error instanceof Error ? error.message : "Failed to update payment method" }
  }

  return { success: true }
}

export async function deletePaymentMethod(id: string) {
  await requireRole(["admin"])

  const supabase = await createClient()
  const { error } = await supabase.from("payment_methods").delete().eq("id", id)

  if (error) {
    console.error("Failed to delete payment method:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete payment method" }
  }

  redirect("/settings/payment-methods")
}
