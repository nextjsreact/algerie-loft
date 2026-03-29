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

    // Fetch income AND expense transactions per loft in date range
    let query = supabase
      .from('transactions')
      .select('id, loft_id, amount, equivalent_amount_default_currency, description, date, transaction_type, category, status')
      .in('transaction_type', ['income', 'expense'])
      .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate + 'T23:59:59')

    const { data: transactions, error: txError } = await query
    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    // Group transactions by loft, split by type
    const txByLoft = new Map<string, { income: any[], expense: any[] }>()
    ;(transactions || []).forEach(tx => {
      if (!txByLoft.has(tx.loft_id)) txByLoft.set(tx.loft_id, { income: [], expense: [] })
      const entry = txByLoft.get(tx.loft_id)!
      if (tx.transaction_type === 'income') entry.income.push(tx)
      else entry.expense.push(tx)
    })

    // Net revenue per loft (income - expenses)
    const netByLoft = new Map<string, { income: number; expense: number; net: number }>()
    txByLoft.forEach((txs, loftId) => {
      const income = txs.income.reduce((s, tx) => s + Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0), 0)
      const expense = txs.expense.reduce((s, tx) => s + Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0), 0)
      netByLoft.set(loftId, { income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense) })
    })

    // Build result per loft
    const loftResults = (lofts || []).map((loft: any) => {
      const figures = netByLoft.get(loft.id) || { income: 0, expense: 0, net: 0 }
      const ownerPct = loft.owner_percentage || 0
      const companyPct = loft.company_percentage || 0
      const ownerDue = Math.round(figures.net * ownerPct / 100)
      const companyDue = Math.round(figures.net * companyPct / 100)
      const loftTxs = txByLoft.get(loft.id) || { income: [], expense: [] }

      return {
        loft_id: loft.id,
        loft_name: loft.name,
        owner_id: loft.owner_id,
        owner_name: (loft.owners as any)?.name || 'Inconnu',
        owner_percentage: ownerPct,
        company_percentage: companyPct,
        total_income: figures.income,
        total_expense: figures.expense,
        total_revenue: figures.net,   // net = income - expenses
        owner_due: ownerDue,
        company_due: companyDue,
        transactions: [
          ...loftTxs.income.map(tx => ({
            id: tx.id,
            date: tx.date,
            description: tx.description || '',
            category: tx.category || '',
            amount: Math.round(Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0)),
            type: 'income' as const,
          })),
          ...loftTxs.expense.map(tx => ({
            id: tx.id,
            date: tx.date,
            description: tx.description || '',
            category: tx.category || '',
            amount: Math.round(Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0)),
            type: 'expense' as const,
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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
