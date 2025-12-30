import { requireRole } from "@/lib/auth"
import { AuditTest } from "@/components/audit/audit-test"

export default async function AuditTestPage() {
  // Require admin role to access this test page
  const session = await requireRole(['admin', 'manager'])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Test du Système d'Audit
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Page de diagnostic pour identifier et résoudre les problèmes du système d'audit.
          </p>
        </div>

        <AuditTest />

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Instructions de Test</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>1. Test Diagnostic:</strong> Vérifie l'authentification, la base de données, le schéma et les permissions.</p>
            <p><strong>2. Test API Entity:</strong> Teste l'endpoint spécifique qui cause l'erreur "Internal Server Error".</p>
            <p><strong>3. Vérifiez les logs:</strong> Ouvrez la console du navigateur et les logs du serveur pour plus de détails.</p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Informations de Session</h3>
          <div className="text-sm space-y-1">
            <p><strong>Utilisateur:</strong> {session.user.email}</p>
            <p><strong>Rôle:</strong> {session.user.role}</p>
            <p><strong>ID:</strong> {session.user.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}