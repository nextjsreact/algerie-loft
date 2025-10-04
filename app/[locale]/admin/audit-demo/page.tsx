import { requireRole } from "@/lib/auth"
import { AuditHistory } from "@/components/audit/audit-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AuditDemoPage() {
  // Require admin role to access this demo page
  const session = await requireRole(['admin', 'manager'])

  // Use the real transaction ID from the logs
  const testRecordId = '229afc15-84a5-4b93-b65a-fd133c063653'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Démo du Système d'Audit
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test de l'interface d'audit avec des données réelles.
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test 1 : Historique d'Audit pour Transactions</CardTitle>
              <CardDescription>
                Test avec une vraie transaction (devrait montrer l'historique des modifications)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditHistory 
                tableName="transactions" 
                recordId={testRecordId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test 2 : Historique d'Audit pour Tasks</CardTitle>
              <CardDescription>
                Test avec l'UUID de transaction (devrait être vide car c'est une autre table)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditHistory 
                tableName="tasks" 
                recordId={testRecordId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test 3 : Historique d'Audit pour Reservations</CardTitle>
              <CardDescription>
                Test avec l'UUID de transaction (devrait être vide car c'est une autre table)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditHistory 
                tableName="reservations" 
                recordId={testRecordId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Informations de Test</h3>
          <div className="text-sm space-y-1">
            <p><strong>Utilisateur:</strong> {session.user.email}</p>
            <p><strong>Rôle:</strong> {session.user.role}</p>
            <p><strong>Test Record ID:</strong> {testRecordId}</p>
            <p><strong>Note:</strong> Le premier test utilise un vrai UUID de transaction avec des modifications enregistrées. Les autres tests utilisent le même UUID mais pour d'autres tables, donc ils devraient être vides.</p>
          </div>
        </div>
      </div>
    </div>
  )
}