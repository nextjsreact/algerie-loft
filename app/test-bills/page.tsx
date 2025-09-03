import { BillAlerts } from '@/components/dashboard/bill-alerts'

export const dynamic = 'force-dynamic'

export default function TestBillsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Bill Alerts Test</h1>
      <BillAlerts />
    </div>
  )
}