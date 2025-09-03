"use server"

import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import { transactionSchema } from "@/lib/validations"
import type { Database } from "@/lib/types"
import { getCurrencies } from "@/app/actions/currencies" // This function is already refactored
import { createClient } from '@/utils/supabase/server' // Import the new createClient

type Transaction = Database['public']['Tables']['transactions']['Row']

export async function getTransactions(): Promise<(Transaction & { currency_symbol?: string })[]> {
  const supabase = await createClient() // Create client here
  const { data, error } = await supabase
    .from("transactions")
    .select("*, currency:currencies(symbol)")
    .order("date", { ascending: false })

  if (error) {
    console.error("Error getting transactions:", error)
    return []
  }

  return data.map((t: any) => ({ ...t, currency_symbol: t.currency?.symbol }))
}

export async function getTransaction(id: string): Promise<(Transaction & { currency_symbol?: string }) | null> {
  const supabase = await createClient() // Create client here
  const { data, error } = await supabase
    .from("transactions")
    .select("*, currency:currencies(symbol)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching transaction:", error)
    return null
  }

  return { ...data, currency_symbol: data.currency?.symbol }
}

export async function createTransaction(data: unknown) {
  await requireRole(["admin", "manager"])
  console.log("createTransaction data:", data)
  const validatedData = transactionSchema.parse(data)

  let ratioAtTransaction = null;
  let equivalentAmountDefaultCurrency = null;

  if (validatedData.currency_id && validatedData.amount) {
    const currencies = await getCurrencies();
    const selectedCurrency = currencies.find(c => c.id === validatedData.currency_id);
    const defaultCurrency = currencies.find(c => c.is_default);

    if (selectedCurrency && defaultCurrency) {
      ratioAtTransaction = (selectedCurrency.ratio || 1) / (defaultCurrency.ratio || 1);
      equivalentAmountDefaultCurrency = validatedData.amount * ratioAtTransaction;
    }
  }

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("transactions").insert({
    ...validatedData,
    loft_id: validatedData.loft_id || null,
    payment_method_id: validatedData.payment_method_id || null,
    description: validatedData.description || '',
    ratio_at_transaction: ratioAtTransaction,
    equivalent_amount_default_currency: equivalentAmountDefaultCurrency,
  })

  if (error) {
    console.error("Error creating transaction:", error)
    throw error
  }

  redirect("/transactions")
}

export async function updateTransaction(id: string, data: unknown) {
  await requireRole(["admin", "manager"])
  console.log("updateTransaction data:", data)
  const validatedData = transactionSchema.parse(data)

  let ratioAtTransaction = null;
  let equivalentAmountDefaultCurrency = null;

  if (validatedData.currency_id && validatedData.amount) {
    const currencies = await getCurrencies();
    const selectedCurrency = currencies.find(c => c.id === validatedData.currency_id);
    const defaultCurrency = currencies.find(c => c.is_default);

    if (selectedCurrency && defaultCurrency) {
      ratioAtTransaction = (selectedCurrency.ratio || 1) / (defaultCurrency.ratio || 1);
      equivalentAmountDefaultCurrency = validatedData.amount * ratioAtTransaction;
    }
  }

  const supabase = await createClient() // Create client here
  const { error } = await supabase
    .from("transactions")
    .update({
      ...validatedData,
      loft_id: validatedData.loft_id || null,
      payment_method_id: validatedData.payment_method_id || null,
      description: validatedData.description || '',
      ratio_at_transaction: ratioAtTransaction,
      equivalent_amount_default_currency: equivalentAmountDefaultCurrency,
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating transaction:", error)
    throw error
  }

  redirect(`/transactions/${id}`)
}

export async function deleteTransaction(id: string) {
  await requireRole(["admin"])

  const supabase = await createClient() // Create client here
  const { error } = await supabase.from("transactions").delete().eq("id", id)

  if (error) {
    console.error("Error deleting transaction:", error)
    throw error
  }

  redirect("/transactions")
}
