'use server'

import { createClient } from '@/utils/supabase/server'
import { updateNextBillDate } from '@/lib/services/bill-notifications'
import { createNotification } from '@/lib/services/notifications'
import { revalidatePath } from 'next/cache'

const UTILITY_LABELS = {
  eau: 'Water',
  energie: 'Energy',
  telephone: 'Phone',
  internet: 'Internet'
}

const UTILITY_CATEGORIES = {
  eau: 'Water Bill',
  energie: 'Energy Bill',
  telephone: 'Phone Bill',
  internet: 'Internet Bill'
}

function getUtilityLabel(utility: string): string {
  const labels = {
    eau: 'Water',
    energie: 'Energy',
    telephone: 'Phone',
    internet: 'Internet'
  }
  return labels[utility as keyof typeof labels] || utility
}

export async function markBillAsPaid(
  loftId: string,
  utilityType: 'eau' | 'energie' | 'telephone' | 'internet',
  amount: number,
  description?: string,
  currencyId?: string,
  paymentMethodId?: string
) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get loft data to check frequency
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('name, owner_id')
      .eq('id', loftId)
      .single()

    if (loftError || !loft) {
      throw new Error('Loft not found')
    }

    // Get currency information for conversion if needed
    let currencyData = null
    let convertedAmount = amount
    
    if (currencyId) {
      const { data: currency, error: currencyError } = await supabase
        .from('currencies')
        .select('id, code, ratio, is_default')
        .eq('id', currencyId)
        .single()
      
      if (!currencyError && currency) {
        currencyData = currency
        // If not default currency, convert to default currency
        if (!currency.is_default) {
          convertedAmount = amount * currency.ratio
        }
      }
    }

    // Create transaction record with proper category
    const transactionData = {
      loft_id: loftId,
      transaction_type: 'expense',
      category: utilityType, // This will match our seeded categories: eau, energie, telephone, internet
      status: 'completed',
      description: description || `${getUtilityLabel(utilityType)} bill payment`,
      date: new Date().toISOString().split('T')[0],
      amount: amount, // Store original amount in original currency
      currency_id: currencyId || null,
      payment_method_id: paymentMethodId || null,
      ratio_at_transaction: currencyData?.ratio || 1.0,
      equivalent_amount_default_currency: convertedAmount // Store converted amount separately
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData])

    if (transactionError) {
      throw transactionError
    }

    // Update next bill date if frequency is set
    // Since we are not fetching the frequency, we cannot update the next bill date.
    // This will be handled by the user manually until the root cause is resolved.
      
      // Send confirmation notification to loft owner
      if (loft.owner_id) {
        await createNotification(
          loft.owner_id,
          `${getUtilityLabel(utilityType)} Bill Paid - ${loft.name}`,
          `${getUtilityLabel(utilityType)} bill payment of $${amount} has been recorded.`,
          'success',
          `/lofts/${loftId}`
        )
      }

    // Revalidate the loft page to show updated data
    revalidatePath(`/lofts/${loftId}`)
    
    return { success: true, message: 'Bill marked as paid successfully' }
  } catch (error) {
    console.error('Error marking bill as paid:', error)
    return { success: false, message: 'Failed to mark bill as paid' }
  }
}

export async function getUpcomingBillsForLoft(loftId: string) {
  const supabase = await createClient()

  try {
    const { data: loft, error } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        frequence_paiement_eau,
        prochaine_echeance_eau,
        frequence_paiement_energie,
        prochaine_echeance_energie,
        frequence_paiement_telephone,
        prochaine_echeance_telephone,
        frequence_paiement_internet,
        prochaine_echeance_internet
      `)
      .eq('id', loftId)
      .single()

    if (error || !loft) {
      throw new Error('Loft not found')
    }

    const today = new Date()
    const bills = []

    const utilities = ['eau', 'energie', 'telephone', 'internet'] as const
    
    for (const utility of utilities) {
      const dueDate = loft[`prochaine_echeance_${utility}`]
      const frequency = loft[`frequence_paiement_${utility}`]

      if (dueDate && frequency) {
        const dueDateObj = new Date(dueDate)
        const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24))

        bills.push({
          utility,
          label: getUtilityLabel(utility),
          dueDate,
          frequency,
          daysUntilDue,
          isOverdue: daysUntilDue < 0
        })
      }
    }

    return { success: true, bills }
  } catch (error) {
    console.error('Error fetching bills for loft:', error)
    return { success: false, bills: [] }
  }
}
