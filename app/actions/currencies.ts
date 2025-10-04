'use server'

import { createClient } from '@/utils/supabase/server'

export async function getCurrencies() {
  const supabase = await createClient()
  try {
    const { data: currencies, error } = await supabase
      .from("currencies")
      .select("*")
    
    if (error) {
      console.error("Error getting currencies:", error)
      throw new Error("Failed to fetch currencies")
    }
    
    return currencies.map(currency => ({
      ...currency,
      is_default: Boolean(currency.is_default)
    }));
  } catch (error) {
    console.error("Caught error in getCurrencies:", error)
    throw new Error("Failed to fetch currencies")
  }
}
