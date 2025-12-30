import { requireRole } from "@/lib/auth"
import { getTransaction, deleteTransaction } from "@/app/actions/transactions"
import { getCurrencies } from "@/app/actions/currencies"
import { getPaymentMethods } from "@/app/actions/payment-methods"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditHistory } from "@/components/audit/audit-history"
import { AuditPermissionManager } from "@/lib/permissions/audit-permissions"
import Link from "next/link"
import { notFound } from "next/navigation"
import { validateTransactionId } from "@/lib/utils/validation"
import { logger } from "@/lib/logger"
import { 
  trackRoutingIssue, 
  track404Error, 
  trackSuccessfulRouting, 
  trackDatabaseError,
  createRoutingContext 
} from "@/lib/utils/error-tracking"
import type { Currency } from "@/lib/types"

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const routingContext = createRoutingContext('/transactions/[id]', { id });
  const startTime = Date.now();
  
  // Log route access attempt for monitoring
  logger.info('Transaction detail page accessed', {
    category: 'routing',
    route: '/transactions/[id]',
    requestedId: id,
    timestamp: new Date().toISOString()
  });
  
  // Validate UUID format before proceeding with authentication and database queries
  const validation = validateTransactionId(id);
  if (!validation.isValid) {
    // Track routing issue with comprehensive context
    trackRoutingIssue(
      'Transaction route validation failed - invalid UUID format',
      'invalid_format',
      {
        ...routingContext,
        requestedId: id,
        userAgent: typeof process !== 'undefined' && process.env.NODE_ENV === 'development' 
          ? 'server-side-dev' 
          : 'server-side-prod'
      },
      {
        validationError: validation.error,
        errorCode: validation.errorCode,
        actionTaken: 'redirect_to_404'
      }
    );
    
    // Track 404 error for invalid UUID format
    track404Error(
      'Invalid transaction ID format provided',
      {
        resourceType: 'transaction',
        resourceId: id,
        searchAttempted: false,
        suggestedActions: ['Check URL format', 'Navigate from transactions list']
      },
      routingContext
    );
    
    // Return 404 for invalid UUID format to prevent exposing validation details
    notFound();
  }

  const session = await requireRole(["admin", "manager"])
  
  // Log successful authentication for transaction access
  logger.info('Transaction access authenticated', {
    category: 'routing',
    route: '/transactions/[id]',
    transactionId: id,
    userId: session.user.id,
    userRole: session.user.role
  });
  
  let transaction, currencies, paymentMethods;
  const dbQueryStart = Date.now();
  
  try {
    [transaction, currencies, paymentMethods] = await Promise.all([
      getTransaction(id),
      getCurrencies(),
      getPaymentMethods(),
    ]);
  } catch (error) {
    // Track database error during transaction retrieval
    trackDatabaseError(
      'Failed to retrieve transaction data',
      error,
      {
        operation: 'parallel_data_fetch',
        resourceType: 'transaction',
        resourceId: id,
        userId: session.user.id,
        route: '/transactions/[id]'
      }
    );
    
    // Re-throw to let Next.js handle the error
    throw error;
  }

  const dbQueryTime = Date.now() - dbQueryStart;

  if (!transaction) {
    // Track 404 error for valid UUID but non-existent transaction
    track404Error(
      'Transaction not found in database',
      {
        resourceType: 'transaction',
        resourceId: id,
        searchAttempted: true,
        suggestedActions: [
          'Verify transaction ID',
          'Check if transaction was deleted',
          'Search in transactions list'
        ]
      },
      {
        ...routingContext,
        userId: session.user.id,
        userRole: session.user.role
      },
      {
        userId: session.user.id,
        userRole: session.user.role
      }
    );
    
    notFound()
  }
  
  const totalLoadTime = Date.now() - startTime;
  
  // Track successful routing with performance metrics
  trackSuccessfulRouting(
    '/transactions/[id]',
    {
      ...routingContext,
      userId: session.user.id,
      userRole: session.user.role
    },
    {
      loadTime: totalLoadTime,
      dbQueryTime: dbQueryTime
    }
  );
  
  // Log successful transaction page load
  logger.info('Transaction page loaded successfully', {
    category: 'routing',
    route: '/transactions/[id]',
    transactionId: id,
    userId: session.user.id,
    transactionType: transaction.transaction_type,
    transactionStatus: transaction.status,
    loadTime: totalLoadTime,
    dbQueryTime: dbQueryTime
  });

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

  // Check if user can view audit history
  const canViewAudit = AuditPermissionManager.canViewEntityAuditHistory(
    session.user.role, 
    'transactions', 
    transaction.id
  );

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
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Transaction Details</TabsTrigger>
          {canViewAudit && (
            <TabsTrigger value="audit">Audit History</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className={`font-medium ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.transaction_type === 'income' ? '+' : '-'}{transaction.currency_symbol || '€'}{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transaction.amount)}
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
                      return `${defaultCurrency.symbol || '€'}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(transaction.equivalent_amount_default_currency || 0)} (Ratio: ${ratioUsed})`;
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
        </TabsContent>

        {canViewAudit && (
          <TabsContent value="audit" className="space-y-4">
            <AuditHistory 
              tableName="transactions" 
              recordId={transaction.id}
              className="w-full"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}