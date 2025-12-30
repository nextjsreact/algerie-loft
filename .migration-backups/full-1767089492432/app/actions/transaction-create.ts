"use server"

import { requireRole } from "@/lib/auth"
import type { Database } from "@/lib/types"
import { createClient } from '@/utils/supabase/server' // Import the new createClient

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export async function createTransaction(data: {
  amount: string
  type: string  
  status: string
  description: string
}) {
  console.group('[TRANSACTION CREATION]')
  console.log('Raw input data:', data)
  
  const supabase = await createClient() // Create client here
  try {
    const parsedData: TransactionInsert = {
      amount: Number(data.amount),
      transaction_type: data.type as "income" | "expense",
      status: data.status as "pending" | "completed" | "failed",
      description: data.description,
      date: new Date().toISOString(),
    }
    console.log('Parsed data:', parsedData)

    const { data: newTransaction, error } = await supabase
      .from("transactions")
      .insert(parsedData)
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('Database result:', newTransaction)
    return { 
      success: true,
      transaction: newTransaction
    }
  } catch (error) {
    console.error('Creation failed:', error)
    return { 
      error: error instanceof Error ? error.message : 'Transaction creation failed'
    }
  } finally {
    console.groupEnd()
  }
}
