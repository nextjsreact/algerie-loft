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
export async function getCurrency(id: string) {
  const supabase = await createClient()
  try {
    const { data: currency, error } = await supabase
      .from("currencies")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) {
      console.error("Error getting currency:", error)
      throw new Error("Failed to fetch currency")
    }
    
    return {
      ...currency,
      is_default: Boolean(currency.is_default)
    };
  } catch (error) {
    console.error("Caught error in getCurrency:", error)
    throw new Error("Failed to fetch currency")
  }
}

export async function createCurrency(formData: FormData) {
  const supabase = await createClient()
  try {
    const currencyData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      symbol: formData.get('symbol') as string,
      exchange_rate: parseFloat(formData.get('exchange_rate') as string),
      is_default: formData.get('is_default') === 'true'
    }

    const { data, error } = await supabase
      .from("currencies")
      .insert([currencyData])
      .select()
      .single()
    
    if (error) {
      console.error("Error creating currency:", error)
      throw new Error("Failed to create currency")
    }
    
    return data;
  } catch (error) {
    console.error("Caught error in createCurrency:", error)
    throw new Error("Failed to create currency")
  }
}

export async function updateCurrency(id: string, formData: FormData) {
  const supabase = await createClient()
  try {
    const currencyData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      symbol: formData.get('symbol') as string,
      exchange_rate: parseFloat(formData.get('exchange_rate') as string),
      is_default: formData.get('is_default') === 'true'
    }

    const { data, error } = await supabase
      .from("currencies")
      .update(currencyData)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating currency:", error)
      throw new Error("Failed to update currency")
    }
    
    return data;
  } catch (error) {
    console.error("Caught error in updateCurrency:", error)
    throw new Error("Failed to update currency")
  }
}

export async function deleteCurrency(id: string) {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from("currencies")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting currency:", error)
      throw new Error("Failed to delete currency")
    }
    
    return { success: true };
  } catch (error) {
    console.error("Caught error in deleteCurrency:", error)
    throw new Error("Failed to delete currency")
  }
}

export async function setDefaultCurrency(id: string) {
  const supabase = await createClient()
  try {
    // First, set all currencies to not default
    await supabase
      .from("currencies")
      .update({ is_default: false })
      .neq("id", "")

    // Then set the selected currency as default
    const { data, error } = await supabase
      .from("currencies")
      .update({ is_default: true })
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Error setting default currency:", error)
      throw new Error("Failed to set default currency")
    }
    
    return data;
  } catch (error) {
    console.error("Caught error in setDefaultCurrency:", error)
    throw new Error("Failed to set default currency")
  }
}