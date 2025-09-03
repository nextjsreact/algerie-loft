import { requireRole } from "@/lib/auth"
import { getTransaction, deleteTransaction } from "@/app/actions/transactions"
import { getCurrencies } from "@/app/actions/currencies"
import { getPaymentMethods } from "@/app/actions/payment-methods"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Currency } from "@/lib/types"

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["admin", "manager"])
  const [transaction, currencies, paymentMethods] = await Promise.all([
    getTransaction(id),
    getCurrencies(),
    getPaymentMethods(),
  ]);

  if (!transaction) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{transaction.description}</CardTitle>
              <CardDescription>On {new Date(transaction.date).toLocaleDateString()}</CardDescription>
            </div>
            <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className={`font-medium ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.transaction_type === 'income' ? '+' : '-'}{transaction.currency_symbol || '$'}{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transaction.amount)}
            </span>
          </div>
          {transaction.equivalent_amount_default_currency !== null && transaction.equivalent_amount_default_currency !== undefined && (
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Equivalent:</span>
                  <span className={`text-xs ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {(() => {
                  const defaultCurrency = currencies.find(c => c.is_default);
                  if (!defaultCurrency) {
                    return 'N/A';
                  }

                  if (transaction.currency_id === defaultCurrency.id) {
                    return `(Default Currency)`;
                  }
                  
                  const ratioUsed = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8, useGrouping: false }).format(transaction.ratio_at_transaction || 0);
                  return `${defaultCurrency.symbol || '$'}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transaction.equivalent_amount_default_currency || 0)} (Ratio: ${ratioUsed})`;
                })()}
              </span>
            </div>
          )}
          {transaction.payment_method_id && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Method:</span>
              <span className="font-medium">{paymentMethods.find(pm => pm.id === transaction.payment_method_id)?.name}</span>
            </div>
          )}
          <div className="mt-6 flex gap-4">
            {session.user.role === "admin" && (
              <form action={async () => { "use server"; await deleteTransaction(transaction.id) }}>
                <Button variant="destructive">Delete</Button>
              </form>
            )}
            <Button asChild variant="outline">
              <Link href={`/transactions/${transaction.id}/edit`}>Edit Transaction</Link>
            </Button>
            <Button asChild>
              <Link href="/transactions">Back to Transactions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
