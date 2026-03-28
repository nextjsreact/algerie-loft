import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient(true)

    const { data: lofts, error } = await supabase
      .from('lofts')
      .select('id, name, owner_id, contract_start_date, contract_duration_months, owners:owner_id(name)')
      .not('contract_start_date', 'is', null)
      .not('contract_duration_months', 'is', null)

    if (error) return NextResponse.json({ alerts: [] })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in30Days = new Date(today)
    in30Days.setDate(in30Days.getDate() + 30)

    const alerts = (lofts || [])
      .map((loft: any) => {
        const start = new Date(loft.contract_start_date)
        const expiry = new Date(start)
        expiry.setMonth(expiry.getMonth() + loft.contract_duration_months)

        const msPerDay = 1000 * 60 * 60 * 24
        const days_remaining = Math.ceil((expiry.getTime() - today.getTime()) / msPerDay)

        return {
          id: loft.id,
          name: loft.name,
          owner_name: (loft.owners as any)?.name || 'Inconnu',
          contract_start_date: loft.contract_start_date,
          contract_duration_months: loft.contract_duration_months,
          expiry_date: expiry.toISOString(),
          days_remaining,
        }
      })
      // Only show contracts expiring within 30 days (or already expired)
      .filter((a: any) => a.days_remaining <= 30)
      .sort((a: any, b: any) => a.days_remaining - b.days_remaining)

    return NextResponse.json({ alerts })
  } catch {
    return NextResponse.json({ alerts: [] })
  }
}
