"use server"

import { requireRole } from "@/lib/auth"
import { z } from "zod"
import { transactionSchema } from "@/lib/validations"
import { createClient } from '@/utils/supabase/server' // Import the new createClient

export async function createNewTransaction(data: z.infer<typeof transactionSchema>) {
  await requireRole(["admin"])
  
  console.group('[NEW TRANSACTION ACTION]')
  console.log('Received data:', {
    amount: data.amount,
    type: data.transaction_type,
    status: data.status,
    description: data.description
  })

  const supabase = await createClient() // Create client here
  try {
    const { data: newTransaction, error } = await supabase
      .from("transactions")
.insert({
        amount: data.amount,
        transaction_type: data.transaction_type,
        status: data.status,
        description: data.description || '',
date: new Date(data.date || Date.now()).toISOString(),
      })
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
    console.error('Transaction failed:', error)
    return { 
      error: error instanceof Error ? error.message : 'Transaction failed'
    }
  } finally {
    console.groupEnd()
  }
}
