import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch lofts with owner info and percentages
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner_percentage, company_percentage, owners:owner_id(id, name)')
      .not('owner_id', 'is', null)
      .order('name')

    if (loftsError) return NextResponse.json({ error: loftsError.message }, { status: 500 })

    // Fetch income transactions per loft in date range
    let query = supabase
      .from('transactions')
      .select('id, loft_id, amount, equivalent_amount_default_currency, description, date, transaction_type, category, status')
      .eq('transaction_type', 'income')
      .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate + 'T23:59:59')

    const { data: transactions, error: txError } = await query
    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    // Group transactions by loft
    const txByLoft = new Map<string, any[]>()
    ;(transactions || []).forEach(tx => {
      if (!txByLoft.has(tx.loft_id)) txByLoft.set(tx.loft_id, [])
      txByLoft.get(tx.loft_id)!.push(tx)
    })

    // Revenue per loft (sum of equivalent_amount_default_currency)
    const revenueByLoft = new Map<string, number>()
    ;(transactions || []).forEach(tx => {
      const amt = tx.equivalent_amount_default_currency ?? tx.amount ?? 0
      revenueByLoft.set(tx.loft_id, (revenueByLoft.get(tx.loft_id) || 0) + Number(amt))
    })

    // Build result per loft
    const loftResults = (lofts || []).map((loft: any) => {
      const revenue = revenueByLoft.get(loft.id) || 0
      const ownerPct = loft.owner_percentage || 0
      const companyPct = loft.company_percentage || 0
      const ownerDue = Math.round(revenue * ownerPct / 100)
      const companyDue = Math.round(revenue * companyPct / 100)
      const loftTx = txByLoft.get(loft.id) || []

      return {
        loft_id: loft.id,
        loft_name: loft.name,
        owner_id: loft.owner_id,
        owner_name: (loft.owners as any)?.name || 'Inconnu',
        owner_percentage: ownerPct,
        company_percentage: companyPct,
        total_revenue: Math.round(revenue),
        owner_due: ownerDue,
        company_due: companyDue,
        transactions: loftTx.map(tx => ({
          id: tx.id,
          date: tx.date,
          description: tx.description || '',
          category: tx.category || '',
          amount: Math.round(Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0)),
        })),
      }
    })

    // Group by owner — only include lofts that have transactions
    const byOwnerMap = new Map<string, any>()
    loftResults.forEach(l => {
      if (!byOwnerMap.has(l.owner_id)) {
        byOwnerMap.set(l.owner_id, {
          owner_id: l.owner_id,
          owner_name: l.owner_name,
          lofts: [],
          total_revenue: 0,
          total_owner_due: 0,
          total_company_due: 0,
        })
      }
      const entry = byOwnerMap.get(l.owner_id)!
      entry.lofts.push(l)
      entry.total_revenue += l.total_revenue
      entry.total_owner_due += l.owner_due
      entry.total_company_due += l.company_due
    })

    // Filter out owners with zero revenue
    const byOwner = Array.from(byOwnerMap.values())
      .filter(g => g.total_revenue > 0)
      .sort((a, b) => b.total_revenue - a.total_revenue)

    return NextResponse.json({
      lofts: loftResults,
      byOwner,
      period: { startDate, endDate },
    })
  } catch (err) {
    console.error('[partner-due]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
