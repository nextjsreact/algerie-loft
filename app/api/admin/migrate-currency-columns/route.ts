import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// One-time migration: add currency tracking columns to reservations
export async function POST() {
  try {
    const supabase = await createClient(true)

    // Add columns one by one using raw SQL via RPC
    const queries = [
      `ALTER TABLE reservations ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'DZD'`,
      `ALTER TABLE reservations ADD COLUMN IF NOT EXISTS currency_ratio NUMERIC(12,4) DEFAULT 1`,
      `ALTER TABLE reservations ADD COLUMN IF NOT EXISTS price_per_night_input NUMERIC(12,2) DEFAULT NULL`,
    ]

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { query })
      if (error) {
        // Try direct approach if exec_sql doesn't exist
        console.error('exec_sql failed:', error.message)
      }
    }

    // Verify columns exist by selecting them
    const { data, error: verifyError } = await supabase
      .from('reservations')
      .select('currency_code, currency_ratio, price_per_night_input')
      .limit(1)

    if (verifyError) {
      return NextResponse.json({ success: false, error: verifyError.message, hint: 'Run the SQL manually in Supabase dashboard' })
    }

    return NextResponse.json({ success: true, message: 'Columns already exist or were created' })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
