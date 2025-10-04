"use server"

import { requireRole, requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { transactionSchema } from "@/lib/validations"
import type { Database } from "@/lib/types"
import { getCurrencies } from "@/app/actions/currencies"
import { createClient } from '@/utils/supabase/server'
import { currencyConversionService } from "@/lib/services/currency-conversion"
import { logger } from "@/lib/logger"
// Audit context removed - triggers work automatically

type Transaction = Database['public']['Tables']['transactions']['Row']

export async function getTransactions(): Promise<(Transaction & { currency_symbol?: string })[]> {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const session = await requireRole(["admin", "manager"])
  logger.info("Creating transaction", { data })
  const validatedData = transactionSchema.parse(data)

  let ratioAtTransaction = null;
  let equivalentAmountDefaultCurrency = null;

  if (validatedData.currency_id && validatedData.amount) {
    try {
      // Validate amount
      if (!currencyConversionService.validateAmount(validatedData.amount)) {
        throw new Error("Invalid transaction amount")
      }

      // Calculate conversion using the service
      const conversionResult = await currencyConversionService.calculateConversion(
        validatedData.amount,
        validatedData.currency_id
      )

      ratioAtTransaction = conversionResult.exchangeRate;
      equivalentAmountDefaultCurrency = conversionResult.convertedAmount;

      logger.info("Currency conversion completed for transaction", {
        originalAmount: conversionResult.originalAmount,
        convertedAmount: conversionResult.convertedAmount,
        exchangeRate: conversionResult.exchangeRate,
        fromCurrency: conversionResult.fromCurrency.code,
        toCurrency: conversionResult.toCurrency.code
      })

    } catch (error) {
      logger.error("Currency conversion failed during transaction creation", error, {
        currencyId: validatedData.currency_id,
        amount: validatedData.amount
      })

      // Check if it's a conversion error with fallback action
      if (error instanceof Error && 'conversionError' in error) {
        const conversionError = (error as any).conversionError
        
        if (conversionError.fallbackAction === 'USE_DEFAULT_RATE') {
          // Use 1:1 ratio as fallback
          ratioAtTransaction = 1;
          equivalentAmountDefaultCurrency = validatedData.amount;
          
          logger.warn("Using fallback 1:1 conversion rate", {
            currencyId: validatedData.currency_id,
            amount: validatedData.amount
          })
        } else if (conversionError.fallbackAction === 'BLOCK_TRANSACTION') {
          // Re-throw error to block transaction
          throw error
        }
      } else {
        // For other errors, use fallback
        ratioAtTransaction = 1;
        equivalentAmountDefaultCurrency = validatedData.amount;
        
        logger.warn("Using fallback conversion due to unexpected error", {
          currencyId: validatedData.currency_id,
          amount: validatedData.amount,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").insert({
    ...validatedData,
    loft_id: validatedData.loft_id || null,
    payment_method_id: validatedData.payment_method_id || null,
    description: validatedData.description || '',
    ratio_at_transaction: ratioAtTransaction,
    equivalent_amount_default_currency: equivalentAmountDefaultCurrency,
  })

  if (error) {
    logger.error("Error creating transaction in database", error)
    throw error
  }

  logger.info("Transaction created successfully")
  redirect("/transactions")
}

export async function updateTransaction(id: string, data: unknown) {
  const session = await requireRole(["admin", "manager"])
  logger.info("Updating transaction", { id, data })
  const validatedData = transactionSchema.parse(data)

  // Get current transaction to compare changes
  const supabase = await createClient()
  const { data: currentTransaction, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !currentTransaction) {
    logger.error("Error fetching current transaction for update", fetchError)
    throw new Error("Transaction not found")
  }

  let ratioAtTransaction = currentTransaction.ratio_at_transaction;
  let equivalentAmountDefaultCurrency = currentTransaction.equivalent_amount_default_currency;

  // Check if currency or amount changed - if so, recalculate conversion
  const currencyChanged = validatedData.currency_id !== currentTransaction.currency_id;
  const amountChanged = validatedData.amount !== currentTransaction.amount;

  if ((currencyChanged || amountChanged) && validatedData.currency_id && validatedData.amount) {
    try {
      // Validate amount
      if (!currencyConversionService.validateAmount(validatedData.amount)) {
        throw new Error("Invalid transaction amount")
      }

      // Recalculate conversion using the service
      const conversionResult = await currencyConversionService.calculateConversion(
        validatedData.amount,
        validatedData.currency_id
      )

      ratioAtTransaction = conversionResult.exchangeRate;
      equivalentAmountDefaultCurrency = conversionResult.convertedAmount;

      logger.info("Currency conversion recalculated for transaction update", {
        transactionId: id,
        currencyChanged,
        amountChanged,
        originalAmount: conversionResult.originalAmount,
        convertedAmount: conversionResult.convertedAmount,
        exchangeRate: conversionResult.exchangeRate,
        fromCurrency: conversionResult.fromCurrency.code,
        toCurrency: conversionResult.toCurrency.code
      })

    } catch (error) {
      logger.error("Currency conversion failed during transaction update", error, {
        transactionId: id,
        currencyId: validatedData.currency_id,
        amount: validatedData.amount
      })

      // Check if it's a conversion error with fallback action
      if (error instanceof Error && 'conversionError' in error) {
        const conversionError = (error as any).conversionError
        
        if (conversionError.fallbackAction === 'USE_DEFAULT_RATE') {
          // Use 1:1 ratio as fallback
          ratioAtTransaction = 1;
          equivalentAmountDefaultCurrency = validatedData.amount;
          
          logger.warn("Using fallback 1:1 conversion rate for update", {
            transactionId: id,
            currencyId: validatedData.currency_id,
            amount: validatedData.amount
          })
        } else if (conversionError.fallbackAction === 'BLOCK_TRANSACTION') {
          // Re-throw error to block transaction update
          throw error
        }
      } else {
        // For other errors, use fallback
        ratioAtTransaction = 1;
        equivalentAmountDefaultCurrency = validatedData.amount;
        
        logger.warn("Using fallback conversion for update due to unexpected error", {
          transactionId: id,
          currencyId: validatedData.currency_id,
          amount: validatedData.amount,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

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
    logger.error("Error updating transaction in database", error)
    throw error
  }

  logger.info("Transaction updated successfully", { id })
  redirect(`/transactions/${id}`)
}

export async function deleteTransaction(id: string) {
  const session = await requireRole(["admin"])

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)

  if (error) {
    console.error("Error deleting transaction:", error)
    throw error
  }

  redirect("/transactions")
}