import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'
import type { Database } from "@/lib/types"

type CurrencyRow = Database['public']['Tables']['currencies']['Row']
type CurrencyInsert = Database['public']['Tables']['currencies']['Insert']

export async function POST(request: Request) {
  const supabase = await createClient()
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.code || !body.name || !body.symbol) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if currency already exists
    const { data: existingCurrency, error: existingError } = await supabase
      .from("currencies")
      .select("*")
      .eq("code", body.code)
      .limit(1)

    if (existingError) {
      console.error("Error checking existing currency:", existingError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    
    if (existingCurrency && existingCurrency.length > 0) {
      return NextResponse.json(
        { error: "Currency with this code already exists" },
        { status: 400 }
      )
    }

    // Create new currency
    const newCurrency: CurrencyInsert = {
      code: body.code,
      name: body.name,
      symbol: body.symbol,
      // Assuming decimalDigits, isDefault, ratio are optional and have defaults in DB schema
      // or are passed in the body
      is_default: body.isDefault || false,
      ratio: body.ratio || 1.0
    }

    const { data, error } = await supabase
      .from("currencies")
      .insert(newCurrency)
      .select()
      .single()

    if (error) {
      console.error("Error creating currency:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Caught error in POST /api/currencies:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Currency ID is required" }, { status: 400 });
    }

    // Set all currencies to not be default
    const { error: unsetError } = await supabase
      .from("currencies")
      .update({ is_default: false })
      .eq("is_default", true)

    if (unsetError) {
      console.error("Error unsetting default currency:", unsetError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Set the specified currency as default
    const { data, error } = await supabase
      .from("currencies")
      .update({ is_default: true })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error setting default currency:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Default currency updated successfully" });
  } catch (error) {
    console.error("Caught error in PUT /api/currencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: currencies, error } = await supabase
      .from("currencies")
      .select("*")
    
    if (error) {
      console.error("Error getting currencies:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    
    // Explicitly cast is_default to boolean for each currency if necessary,
    // though Supabase client usually handles type conversion.
    const processedCurrencies = currencies.map(currency => ({
      ...currency,
      is_default: Boolean(currency.is_default) // Ensure it's a boolean
    }));

    console.log("Processed Currencies (server-side):", processedCurrencies); // Debugging log
    return NextResponse.json(processedCurrencies)
  } catch (error) {
    console.error("Caught error in GET /api/currencies:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
