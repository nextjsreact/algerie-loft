import { getSession } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TestRolePage() {
  const session = await getSession()

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Test de Rôle Utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div className="space-y-2">
              <p><strong>Connecté:</strong> ✅ Oui</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Nom:</strong> {session.user.full_name || 'Non défini'}</p>
              <p><strong>Rôle:</strong> <span className="bg-blue-100 px-2 py-1 rounded">{session.user.role}</span></p>
              <p><strong>ID:</strong> {session.user.id}</p>
              <p><strong>Créé le:</strong> {session.user.created_at}</p>
              
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Redirection attendue selon le rôle:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>admin/manager/member:</strong> /fr/home</li>
                  <li>• <strong>executive:</strong> /fr/executive</li>
                  <li>• <strong>client:</strong> /fr/client/dashboard</li>
                  <li>• <strong>partner:</strong> /fr/partner/dashboard</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Si tu vois cette page, c'est que la redirection automatique ne fonctionne pas.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p><strong>Connecté:</strong> ❌ Non</p>
              <p className="text-gray-600">Tu n'es pas connecté. Va sur /fr/login pour te connecter.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}