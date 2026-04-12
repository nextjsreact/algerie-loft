import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    const filterLoftId = searchParams.get('loftId') || null
    const filterOwnerId = searchParams.get('ownerId') || null

    // 1. Reservation payments grouped by currency
    let payQuery = supabase
      .from('reservation_payments')
      .select(`
        id, amount, currency, payment_method, processed_at, created_at,
        reservations:reservation_id(
          id, loft_id, guest_name, check_in_date, check_out_date,
          lofts:loft_id(id, name, owner_id)
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .eq('status', 'completed')

    const { data: payments } = await payQuery

    // 2. Expense transactions grouped by currency
    let expQuery = supabase
      .from('transactions')
      .select('id, amount, equivalent_amount_default_currency, description, category, date, loft_id, currency_id, currencies:currency_id(code, symbol)')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    if (filterLoftId) expQuery = expQuery.eq('loft_id', filterLoftId)

    const { data: expenses } = await expQuery

    // 3. Get lofts for owner filter
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name, owner_id')

    const loftMap = new Map((lofts || []).map((l: any) => [l.id, l]))

    // 4. Group payments by currency
    const incomesByCurrency = new Map<string, {
      currency: string
      total: number
      count: number
      details: any[]
    }>()

    ;(payments || []).forEach((p: any) => {
      const res = p.reservations as any
      const loftId = res?.loft_id
      const loft = loftMap.get(loftId)

      // Apply filters
      if (filterLoftId && loftId !== filterLoftId) return
      if (filterOwnerId && loft?.owner_id !== filterOwnerId) return

      const currency = p.currency || 'DZD'
      if (!incomesByCurrency.has(currency)) {
        incomesByCurrency.set(currency, { currency, total: 0, count: 0, details: [] })
      }
      const entry = incomesByCurrency.get(currency)!
      entry.total += Number(p.amount)
      entry.count++
      entry.details.push({
        id: p.id,
        amount: Number(p.amount),
        currency,
        payment_method: p.payment_method,
        date: p.processed_at || p.created_at,
        loft_name: res?.lofts?.name || '—',
        guest_name: res?.guest_name || null,
        check_in: res?.check_in_date,
        check_out: res?.check_out_date,
        type: 'income',
      })
    })

    // 5. Group expenses by currency
    const expensesByCurrency = new Map<string, {
      currency: string
      total: number
      count: number
      details: any[]
    }>()

    ;(expenses || []).forEach((t: any) => {
      if (filterOwnerId) {
        const loft = loftMap.get(t.loft_id)
        if (loft?.owner_id !== filterOwnerId) return
      }

      const currency = (t.currencies as any)?.code || 'DZD'
      const amount = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)

      if (!expensesByCurrency.has(currency)) {
        expensesByCurrency.set(currency, { currency, total: 0, count: 0, details: [] })
      }
      const entry = expensesByCurrency.get(currency)!
      entry.total += amount
      entry.count++
      entry.details.push({
        id: t.id,
        amount,
        currency,
        description: t.description || '—',
        category: t.category || '—',
        date: t.date,
        loft_name: loftMap.get(t.loft_id)?.name || '—',
        type: 'expense',
      })
    })

    // 6. Merge into unified currency list
    const allCurrencies = new Set([
      ...Array.from(incomesByCurrency.keys()),
      ...Array.from(expensesByCurrency.keys()),
    ])

    const byCurrency = Array.from(allCurrencies).map(currency => {
      const inc = incomesByCurrency.get(currency) || { total: 0, count: 0, details: [] }
      const exp = expensesByCurrency.get(currency) || { total: 0, count: 0, details: [] }
      return {
        currency,
        income: Math.round(inc.total),
        income_count: inc.count,
        expense: Math.round(exp.total),
        expense_count: exp.count,
        net: Math.round(inc.total - exp.total),
        income_details: inc.details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        expense_details: exp.details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }
    }).sort((a, b) => b.income - a.income)

    // 7. Grand totals (in DZD equivalent — for display only)
    const grandIncome = byCurrency.reduce((s, c) => s + c.income, 0)
    const grandExpense = byCurrency.reduce((s, c) => s + c.expense, 0)

    // Available lofts and owners for filters
    const { data: owners } = await supabase
      .from('owners')
      .select('id, name')
      .order('name')

    return NextResponse.json({
      period: { startDate, endDate },
      by_currency: byCurrency,
      totals: {
        income: grandIncome,
        expense: grandExpense,
        net: grandIncome - grandExpense,
      },
      lofts_list: (lofts || []).map((l: any) => ({ id: l.id, name: l.name })),
      owners_list: owners || [],
    })
  } catch (err) {
    console.error('[reports/by-currency]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
