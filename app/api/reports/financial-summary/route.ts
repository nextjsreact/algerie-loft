import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    // 1. Income transactions by payment method (from transactions table)
    const { data: incomeTx } = await supabase
      .from('transactions')
      .select('loft_id, equivalent_amount_default_currency, amount, payment_method_id, payment_methods:payment_method_id(name)')
      .eq('transaction_type', 'income')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    // 2. Expense transactions
    const { data: expenseTx } = await supabase
      .from('transactions')
      .select('loft_id, equivalent_amount_default_currency, amount, category')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    // 3. Reservation payments (from reservation_payments table)
    const { data: resPay } = await supabase
      .from('reservation_payments')
      .select('amount, payment_method, reservation_id, reservations:reservation_id(loft_id)')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')

    // 4. Lofts with owner info
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner_percentage, company_percentage, owners:owner_id(id, name)')

    const loftMap = new Map((lofts || []).map((l: any) => [l.id, l]))

    // --- SECTION 1: Global income/expense ---
    const totalIncome = (incomeTx || []).reduce((s, t) => s + Number(t.equivalent_amount_default_currency ?? t.amount ?? 0), 0)
    const totalExpense = (expenseTx || []).reduce((s, t) => s + Number(t.equivalent_amount_default_currency ?? t.amount ?? 0), 0)
    const totalPayments = (resPay || []).reduce((s, p) => s + Number(p.amount ?? 0), 0)

    // --- SECTION 2: By payment method (from reservation_payments) ---
    const byPaymentMethod: Record<string, number> = {}
    ;(resPay || []).forEach((p: any) => {
      const m = p.payment_method || 'autre'
      byPaymentMethod[m] = (byPaymentMethod[m] || 0) + Number(p.amount)
    })

    // --- SECTION 3: By own lofts (company_percentage = 100) ---
    const ownLofts = (lofts || []).filter((l: any) => l.company_percentage === 100)
    const ownLoftIds = new Set(ownLofts.map((l: any) => l.id))

    const byOwnLoft: Record<string, { name: string; income: number; expense: number }> = {}
    ;(incomeTx || []).forEach((t: any) => {
      if (!t.loft_id || !ownLoftIds.has(t.loft_id)) return
      const loft = loftMap.get(t.loft_id)
      if (!byOwnLoft[t.loft_id]) byOwnLoft[t.loft_id] = { name: loft?.name || t.loft_id, income: 0, expense: 0 }
      byOwnLoft[t.loft_id].income += Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
    })
    ;(expenseTx || []).forEach((t: any) => {
      if (!t.loft_id || !ownLoftIds.has(t.loft_id)) return
      const loft = loftMap.get(t.loft_id)
      if (!byOwnLoft[t.loft_id]) byOwnLoft[t.loft_id] = { name: loft?.name || t.loft_id, income: 0, expense: 0 }
      byOwnLoft[t.loft_id].expense += Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
    })

    // --- SECTION 4: By partner (owner_percentage > 0 and < 100) ---
    const partnerLofts = (lofts || []).filter((l: any) => l.owner_percentage > 0 && l.owner_percentage < 100)
    const byPartner: Record<string, { owner_name: string; lofts: { name: string; income: number; company_share: number }[]; total_income: number; total_company_share: number }> = {}

    ;(incomeTx || []).forEach((t: any) => {
      if (!t.loft_id) return
      const loft = loftMap.get(t.loft_id) as any
      if (!loft || loft.owner_percentage === 0 || loft.owner_percentage === 100) return
      const ownerId = loft.owner_id
      const ownerName = loft.owners?.name || 'Inconnu'
      const income = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
      const companyShare = Math.round(income * (loft.company_percentage || 0) / 100)

      if (!byPartner[ownerId]) byPartner[ownerId] = { owner_name: ownerName, lofts: [], total_income: 0, total_company_share: 0 }
      const existing = byPartner[ownerId].lofts.find(l => l.name === loft.name)
      if (existing) { existing.income += income; existing.company_share += companyShare }
      else byPartner[ownerId].lofts.push({ name: loft.name, income, company_share: companyShare })
      byPartner[ownerId].total_income += income
      byPartner[ownerId].total_company_share += companyShare
    })

    return NextResponse.json({
      period: { startDate, endDate },
      global: {
        total_income: Math.round(totalIncome),
        total_expense: Math.round(totalExpense),
        net: Math.round(totalIncome - totalExpense),
        total_payments_received: Math.round(totalPayments),
      },
      by_payment_method: Object.entries(byPaymentMethod)
        .map(([method, amount]) => ({ method, amount: Math.round(amount) }))
        .sort((a, b) => b.amount - a.amount),
      own_lofts: Object.values(byOwnLoft)
        .map(l => ({ ...l, income: Math.round(l.income), expense: Math.round(l.expense), net: Math.round(l.income - l.expense) }))
        .sort((a, b) => b.income - a.income),
      by_partner: Object.values(byPartner)
        .map(p => ({ ...p, total_income: Math.round(p.total_income), total_company_share: Math.round(p.total_company_share) }))
        .sort((a, b) => b.total_company_share - a.total_company_share),
    })
  } catch (err) {
    console.error('[financial-summary]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
